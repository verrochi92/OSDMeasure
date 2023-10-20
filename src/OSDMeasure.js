/**
 * DexieWrapper.js
 *
 * Database wrapper that helps access data via the plugin
 *
 * By Nicholas Verrochi and Vidhya Sree N
 */

class DexieWrapper {

    db; // Dexie.js object to access the database
    plugin; // reference to the plugin

    /**
     * constructor
     *
     * Opens the database, will work whether it exists already or not
     *
     * @param {OSDMeasure} plugin
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.db = new Dexie("database");
        this.db.version(3).stores({
            measurements: `
                id,
                image,
                p1x, p1y,
                p2x, p2y,
                name,
                color`
        });
        this.db.open();
    }

    /**
     * clear:
     *
     * Removes all entries from the database
     */
    clear() {
        this.db.measurements.clear();
    }

    /**
     * getAllMeasurements:
     *
     * Gets all the measurements from the database
     *
     * @returns a list of all stored measurements
     */
    async getAllMeasurements(imageIdentifier) {
        let measurements = [];
        // query all measurements related to the image
        let result = await this.db.measurements.where("image").equals(imageIdentifier).toArray();
        for (let i = 0; i < result.length; i++) {
            let measurement = new Measurement(
                new Point(result[i].p1x, result[i].p1y, result[i].color, this.plugin.fabricCanvas , this.imageIdentifier),
                new Point(result[i].p2x, result[i].p2y, result[i].color, this.plugin.fabricCanvas , this.imageIdentifier),
                result[i].name, result[i].color, this.plugin.conversionFactor, this.plugin.units, this.plugin.fabricCanvas ,this.imageIdentifier
            );
            measurement.id = result[i].id;
            measurements.push(measurement);
        }
        return measurements;
    }

    /**
     * removeMeasurement:
     *
     * Removes the measurement passed in from the database
     *
     * @param {Measurement} measurement
     */
    async removeMeasurement(measurement,imageIdentifier) {
        await this.db.measurements.delete(measurement.id,imageIdentifier);
    }

    /**
     * saveAll:
     *
     * Saves an entire list of measurements
     *
     * @param {Measurement []} measurements
     */
    saveAll(measurements,imageIdentifier) {
        for (let i = 0; i < measurements.length; i++) {
            this.saveMeasurement(measurements[i],imageIdentifier);
        }
    }

    /**
     * saveMeasurement:
     *
     * Saves a measurement into the database
     * Measurements that already exist are replaced with their new versions
     *
     * @param {Measurement} measurement: the measurement object to store
     */
    saveMeasurement(measurement,imageIdentifier) {
        this.db.measurements.put({
            id: measurement.id,
            image: imageIdentifier,
            p1x: measurement.p1.x,
            p1y: measurement.p1.y,
            p2x: measurement.p2.x,
            p2y: measurement.p2.y,
            name: measurement.name,
            color: measurement.color
        });
    }
}

/*
 * OSDMeasure.js
 *
 * Plugin for OpenSeadragon that allows for measuring
 *
 * By Nicholas Verrochi and Vidhya Sree N
 *
 * Requires OpenSeadragon, Fabric.js, and
 * the OpenSeadragon Fabric.js Overlay plugin
 */

class OSDMeasure {

    /**
     * APIs used by the plugin
     */
    viewer; // the OpenSeadragon viewer
    overlay; // the fabric.js overlay, contains the canvas
    fabricCanvas; // the fabric.js canvas to draw shapes on
    db; // DexieWrapper to access the database

    /**
     * Flags
     */
    isMeasuring; // flag to indicate when user is mid-measurement (one point marked)
    useBuiltInUI; // when true, will setup the built-in UI after starting

    /**
     * Data
     */
    measurements; // holds measurements taken in an array
    p1; // start point of the measurement
    p2; // end point of the measurement
    redoStack; // populated upon undo - this way the user can go back again

    /**
     * Customization options
     */
    conversionFactor; // factor to multiply for converting from pixels
    measurementColor; // color to render measurement markings
    menuOptions; // options object to be passed to the built-in UI if used
    units; // string to indicate what units are used, for example "um"
    imageIdentifier;
    measurementIdCounter;
    measurementList = null;
    /**
     * constructor
     *
     * Sets up the viewer by starting a fabric.js overlay and wiring callbacks
     *
     * @param {OpenSeadragon} viewer: the OpenSeadragon viewer
     * @param {Object} options: object used to customize settings
     */
    constructor(viewer, options = {}) {
        this.viewer = viewer;

        this.processOptions(options);

        // pull in the two libraries
        this.overlay = viewer.fabricjsOverlay();
        this.fabricCanvas = this.overlay.fabricCanvas();
        this.viewer.gestureSettingsMouse.clickToZoom = false;
        this.viewer.gestureSettingsTouch.clickToZoom = false;
        this.isMeasuring = false; // toggles when user places first point of a measurement

        // the two points used to measure - these are image coordinates
        this.p1 = null;
        this.p2 = null;

        // store all the measurements (and extraneous points)
        this.measurements = [];
        // temporarily stores undone measurements
        this.redoStack = [];

        // initialize databasse
        this.db = new DexieWrapper(this);

        this.measurementList = new MeasurementList(this);

        this.imageIdentifier = this.viewer.tileSources[this.viewer.currentPage()];

        this.viewer.addHandler('page', (event) => {
                this.updateImageIdentifier(event);
                this.clearCanvas();
                this.loadFromLocalStorage(this.imageIdentifier);
        });

        // add our custom handler for measurements
        this.viewer.addHandler('canvas-double-click', (event) => {
            this.addMeasurement(event);
            if (!event.quick) {
                event.preventDefaultAction = true;
            }
        });

        // re-render on page event (change in zoom)
        this.viewer.addHandler('zoom', this.adjustToZoom.bind(this));

        // re-render on rotation
        this.viewer.addHandler('rotate', () => {
            this.viewer.viewport.rotateTo(0);
        })

        // dispatch correct method on key press
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event);
        });

        this.loadFromLocalStorage();
         this.measurementIdCounter = 0;
         // Add a click event listener to select a measurement when clicked
             this.viewer.addHandler("canvas-click", (event) => {
                 const webPoint = event.position;
                 const viewportPoint = this.viewer.viewport.pointFromPixel(webPoint);
                 const imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);

                for (let i = 0; i < this.measurements.length; i++) {
                            if (this.measurements[i].isPointInside(imagePoint.x, imagePoint.y)) {
                                // Check if the clicked measurement is the same as the selectedMeasurement
                                if (this.selectedMeasurement === this.measurements[i]) {
                                    // If it is, deselect it
                                    this.deselectMeasurement();
                                } else {
                                    // If it's not, select it
                                    this.selectMeasurement(this.measurements[i]);
                                }
                                break;
                    }
                 }
             });
    }

    updateImageIdentifier(event){
        this.imageIdentifier = this.viewer.tileSources[this.viewer.currentPage()];
    }

    clearCanvas(){
        this.fabricCanvas.clear();
        for (let i = 0; i < this.measurements.length; i++) {
          this.measurements[i].remove();
        }
        this.measurements = [];
        this.redoStack = [];
        if (this.isMeasuring) {
          this.p1.remove();
        }
        this.p1 = null;
        this.p2 = null;
        this.isMeasuring = false;
        document.dispatchEvent(new Event("measurements-reset"));
    }
    /*
     * addMeasurement:
     *     Only called in measuring mode - places a new point onto the canvas,
     *     and performs measuring once two points have been placed.
     */
    addMeasurement(event) {
        let webPoint = event.position;
        let viewportPoint = this.viewer.viewport.pointFromPixel(webPoint);
        let imagePoint = this.viewer.viewport.viewportToImageCoordinates(viewportPoint);
        let zoom = this.viewer.viewport.getZoom();

        if (this.isMeasuring) { // already have a point, so complete the measurement
            this.p2 = new Point(imagePoint.x, imagePoint.y, this.measurementColor, this.fabricCanvas , this.imageIdentifier);
            this.p2.render(zoom);
            let measurement = new Measurement(
                this.p1, this.p2,
                `M${this.measurements.length + 1}`,
                this.measurementColor, this.conversionFactor, this.units, this.fabricCanvas ,this.imageIdentifier
            );
            measurement.render(zoom);
            this.measurements.push(measurement);
            measurement.id = this.measurementIdCounter++;
            measurement.imageIdentifier = this.imageIdentifier;
            this.saveInLocalStorage(this.imageIdentifier);
            // dispatch an event to let it be known there is a new measurement
            document.dispatchEvent(new Event("measurement-added"));
        } else { // place the first point
            this.p1 = new Point(imagePoint.x, imagePoint.y, this.measurementColor, this.fabricCanvas ,this.imageIdentifier);
            this.p1.render(zoom);
        }
        // have to blow out the redo stack since we made a new measurement
        this.redoStack = [];
        this.isMeasuring = !this.isMeasuring;
    }
    deleteSelectedMeasurement() {
            if (this.selectedMeasurement) {
                const measurementIndex = this.measurements.indexOf(this.selectedMeasurement);
                console.log(measurementIndex);
                if (measurementIndex !== -1) {
                    // Remove it from the canvas
                    this.selectedMeasurement.remove();

                    // Remove it from the list
                    this.measurements.splice(measurementIndex, 1);

                    // Remove it from the database
                    this.redoStack.push(this.selectedMeasurement);
                    this.db.removeMeasurement(this.selectedMeasurement, this.imageIdentifier);
                    this.saveInLocalStorage(this.imageIdentifier);
                    // Dispatch a custom event with a parameter
                    const event = new CustomEvent("delete-selected-measurement", {
                        detail: {
                          measurement: this.selectedMeasurement
                         }
                    });
                    document.dispatchEvent(event);

                    this.deselectMeasurement(); // Deselect the deleted measurement
                }
            }
        }
         // Add a method to handle measurement selection
          selectMeasurement(measurement) {
              // Deselect the previously selected measurement (if any)
              if (this.selectedMeasurement) {
                  this.deselectMeasurement();
              }

              this.selectedMeasurement = measurement;
              this.selectedMeasurement.select();
          }
          // Add a method to deselect the currently selected measurement
          deselectMeasurement() {
              if (this.selectedMeasurement) {
                  this.selectedMeasurement.deselect();
                  this.selectedMeasurement = null;
              }
          }

    /**
     * adjustToZoom:
     *
     * Adjusts the sizes of all fabric.js objects based on zoom
     */
    adjustToZoom() {
        let zoom = this.viewer.viewport.getZoom();
        for (let i = 0; i < this.measurements.length; i++) {
            this.measurements[i].adjustToZoom(zoom);
        }
        if (this.p1 != null) {
            this.p1.adjustToZoom(zoom);
        }
        if (this.p2 != null) {
            this.p2.adjustToZoom(zoom);
        }
    }

    /**
     * clear:
     *     Erases all saved data relevant to this specific image from
     *     localStorage and clears fabric objects and measurement data.
     */
    clear() {
        this.db.clear();
        for (let i = 0; i < this.measurements.length; i++) {
            this.measurements[i].remove();
        }
        this.measurements = [];
        this.redoStack = [];
        if (this.isMeasuring) {
            this.p1.remove();
        }
        this.p1 = null;
        this.p2 = null;
        this.isMeasuring = false;
        document.dispatchEvent(new Event("measurements-reset"));
    }

    /**
     * exportCSV:
     *     creates a CSV containing the measurement data
     */
    exportCSV() {
        let header = ["Name", "Point 1 X", "Point 1 Y", "Point 2 X", "Point 2 Y", "Distance(mm)"];
        let createRow = (measurement) => {
            return [
                measurement.name,
                measurement.p1.x,
                measurement.p1.y,
                measurement.p2.x,
                measurement.p2.y,
                measurement.distance
            ];
        };
        // generate the rows
        let rows = [header];
        for (let i = 0; i < this.measurements.length; i++) {
            rows.push(createRow(this.measurements[i]));
        }
        // join the rows together
        let csv = "data:text/csv;charset=utf-8," + rows.map((row) => row.join(",")).join("\n");
        // encode to URI
        let uri = encodeURI(csv);
        // download using invisible link trick
        let link = document.createElement("a");
        link.setAttribute("href", uri);
        link.setAttribute("download", "measurements.csv");
        document.body.appendChild(link);
        link.click();
        // clean up
        document.body.removeChild(link);
    }

    /**
     * handleKeyPress:
     *
     * Handles keyboard shortcuts
     */
    handleKeyPress(event) {
        // reset
        if (event.ctrlKey && event.key == 'r') {
            if (window.confirm("Are you sure you want to reset all measurements and annotations?")) {
                this.clear();
            }
        }
        // undo
        else if (event.ctrlKey && event.key == 'z') {
            this.undo();
        }
        // redo
        else if (event.ctrlKey && event.key == 'y') {
            this.redo();
        }
        // export csv
        else if (event.ctrlKey && event.key == 's') {
            this.exportCSV();
        }
        else if(event.ctrlKey && event.key == "d") this.deleteSelectedMeasurement();
        // override ctrl presses
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }

    /**
     * loadFromLocalStorage:
     *     Loads any existing measurements from localStorage
     */
    async loadFromLocalStorage(imageIdentifier) {
        this.measurements = await this.db.getAllMeasurements(this.imageIdentifier);
        this.setMeasurementColor(localStorage.getItem("color"));
        document.dispatchEvent(new Event("data-loaded"));
        // render the measurements
        this.renderAllMeasurements();
    }

    /**
     * processOptions:
     *
     * Stores customization options in the object proper
     * Loads the built-in UI if chosen for use
     *
     * @param {Object} options
     */
    processOptions(options) {
        if (options.conversionFactor) {
            this.conversionFactor = options.conversionFactor;
        }
        else {
            this.conversionFactor = 1;
        }

        if (options.units) {
            this.units = options.units;
        }
        else {
            this.units = "px";
        }

        if (options.measurementColor) {
            this.measurementColor = options.measurementColor;
        }
        else {
            this.measurementColor = "#000000"
        }

        if (options.useBuiltInUI) {
            let ui = new UI(this);
            ui.addToDocument();
        }
    }

    /**
     * redo:
     *     replaces the last undone measurement or point if there are any in the stack
     */
    redo() {
        if (this.redoStack.length > 0) {
            let lastObject = this.redoStack.pop();
            // get zoom level for rendering
            let zoom = this.viewer.viewport.getZoom();
            // if it's a point, handle it as such
            if (lastObject instanceof Point) {
                this.p1 = lastObject;
                this.p1.render(zoom);
                // set isMeasuring so the next double-click finishes the measurement
                this.isMeasuring = true;
            }
            else { // it's a measurement
                this.measurements.push(lastObject);
                lastObject.id = this.measurements.length - 1;
                lastObject.p1.render(zoom);
                lastObject.p2.render(zoom);
                lastObject.render(zoom);
                // can't forget to save!
                this.saveInLocalStorage(this.imageIdentifier);
                // dispatch event to replace it in the measurement list
                document.dispatchEvent(new Event("measurement-added"));
            }
        }
    }

    /**
     * renderAllMeasurements:
     *     Renders all measurements
     */
    renderAllMeasurements() {
        let zoom = this.viewer.viewport.getZoom();
        for (let i = 0; i < this.measurements.length; i++) {
            this.measurements[i].p1.render(zoom);
            this.measurements[i].p2.render(zoom);
            this.measurements[i].render(zoom);
        }
        if (this.isMeasuring && this.p1 != null) {
            this.p1.render(zoom);
        }
    }

    /**
     * saveInLocalStorage:
     *     Saves the measurements in localStorage in JSON format
     */
    saveInLocalStorage(imageIdentifier) {
        this.db.saveAll(this.measurements,imageIdentifier);
        localStorage.setItem("color", this.measurementColor);
    }

    /**
     * setMeasurementColor:
     *     changes color of measurement markings, also when
     *     mid-measurement, changes the color of the first marking
     */
    setMeasurementColor(color) {
        this.measurementColor = color;
        if (this.isMeasuring) {
            // have to re-color the marking already placed
            this.p1.color = this.measurementColor;
            this.p1.fabricObject.fill = this.measurementColor;
            this.fabricCanvas.renderAll();
        }
        this.saveInLocalStorage(this.imageIdentifier);
    }

    /**
     * undo:
     *     Undose the last action - if mid-measurement, the first
     *     point is erased and the user will have to start over.
     *     Otherwise, the last created measurement is erased.
     */
    async undo() {
        if (this.isMeasuring) { // we have a point
            // store the point for redo
            this.redoStack.push(this.p1);
            this.p1.remove();
            this.p1 = null;
            this.isMeasuring = !this.isMeasuring;
        }
        else if (this.measurements.length > 0) { // we have a whole measurement
            // pop out of measurements and into redoStack
            let measurement = this.measurements.pop()
            measurement.remove();
            this.redoStack.push(measurement);
            await this.db.removeMeasurement(measurement);
            this.saveInLocalStorage(this.imageIdentifier);
            document.dispatchEvent(new Event("measurement-removed"));
        }

    }
}
/**
 * Measurement.js
 * Object model to represent a measurement between two points
 * By Nicholas Verrochi and Vidhya Sree N
 * For CS410 - The Axolotl Project
 */

class Measurement {

    id; // used to track in the database - set externally
    p1; // starting point of the measurement in **image** coordinates
    p2; // ending point of the measurement in image coordinates
    name; // name given to the measurement
    color; // color used to render the measurement
    distance; // distance in pixels
    conversionFactor; // factor to convert from px -> chosen units (distance in px * conversion factor = converted distance)
    units; // string to represent the units, for example "px" for pixels
    imageIdentifier;

    /**
     * fabric.js objects
     */
    fabricCanvas; // the canvas on which to render the fabric.js objects
    line; // line between the two points
    textObject; // text displaying the distance
    isSelected;

    /**
     * constructor
     *
     * Stores points, name, color, and conversion factor and units
     * Instantiates a fabric Group to store the relevant objects to render
     *
     * @param {Point} p1
     * @param {Point} p2
     * @param {string} name
     * @param {string} color
     * @param {float} conversionFactor
     * @param {string} units
     * @param {fabric.Canvas} fabricCanvas
     */
    constructor(p1, p2, name, color, conversionFactor, units, fabricCanvas,imageIdentifier) {
        this.p1 = p1;
        this.p2 = p2;
        this.name = name;
        this.color = color;
        this.distance = Math.sqrt(Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2));
        this.conversionFactor = conversionFactor; // pixels * conversionFactor = actual measurement
        this.units = units;
        // convert to proper units
        this.distance *= conversionFactor;
        this.fabricCanvas = fabricCanvas;
        this.imageIdentifier = imageIdentifier;
        this.isSelected = false;
    }

    /**
     * adjustToZoom:
     *
     * Adjusts the fabric objects to the zoom level of the viewer
     *
     * @param {float} zoom: zoom ratio to adjust to
     */
    adjustToZoom(zoom) {
        this.p1.adjustToZoom(zoom);
        this.p2.adjustToZoom(zoom);
        this.line.strokeWidth = 50 / zoom;
        this.textObject.fontSize = 300 / zoom;
        // adjust distance between right-most point and text
        this.textObject.left = Math.max(this.p1.x, this.p2.x) + 100 / zoom;
    }

    /**
     * remove:
     *
     * Removes the fabric group from the canvas
     */
    remove() {
        this.p1.remove();
        this.p2.remove();
        this.fabricCanvas.remove(this.line);
        this.fabricCanvas.remove(this.textObject);
    }

    /**
     * render:
     *
     * Adds the points, line, and length text to the canvas
     *
     * @param {float} zoom: zoom ratio of the viewer
     */
    render(zoom) {
        // draw line between p1 and p2
        this.line = new fabric.Line([this.p1.x, this.p1.y, this.p2.x, this.p2.y], {
            originX: 'center',
            originY: 'center',
            stroke: this.color,
            strokeWidth: 50 / zoom
        });
        this.fabricCanvas.add(this.line);

        // create text object to display measurement
        let text = (this.distance).toFixed(3) + " " + this.units;
        this.textObject = new fabric.Text(text, {
            left: Math.max(this.p1.x, this.p2.x) + 100 / zoom,
            top: this.p1.x > this.p2.x ? this.p1.y : this.p2.y,
            fontSize: 300 / zoom,
            fill: this.color
        });
        this.fabricCanvas.add(this.textObject);
    }
        // Add methods to select and deselect the measurement
        select() {
            this.line.set({
                stroke: "grey"
            });
            // Highlight both points with a grey fill
            this.p1.fabricObject.set({ fill: "grey" });
            this.p2.fabricObject.set({ fill: "grey" });

            this.textObject.set({ fill: "grey" });
            this.fabricCanvas.renderAll();
        }

        deselect() {
            this.line.set({
                stroke: this.color
            });
            this.p1.fabricObject.set({ fill: this.color });
            this.p2.fabricObject.set({ fill: this.color });

            this.textObject.set({ fill: this.color });
            this.fabricCanvas.renderAll();
        }
     // Add a method to check if a point is inside the measurement
         isPointInside(x, y) {
             const minX = Math.min(this.p1.x, this.p2.x);
             const maxX = Math.max(this.p1.x, this.p2.x);
             const minY = Math.min(this.p1.y, this.p2.y);
             const maxY = Math.max(this.p1.y, this.p2.y);

             return x >= minX && x <= maxX && y >= minY && y <= maxY;
         }
}

/**
 * Point.js
 * Object model to represent a point (part of a measurement)
 * By Nicholas Verrochi and Vidhya Sree N
 * For CS410 - The Axolotl Project
 */

class Point {

    x; // x-coordinate in **image** coordinates
    y; // y-coordinate in **image** coordinates
    color; // color to render in

    /**
     * fabric.js objects
     */
    fabricCanvas; // canvas which holds the point
    fabricObject; // the circle marking the point
    imageIdentifier;

    /**
     * constructor
     *
     * Creates a point that can be rendered on the canvas
     *
     * @param {int} x
     * @param {int} y
     * @param {string} color
     * @param {fabricCanvas} fabricCanvas
     */
    constructor(x, y, color, fabricCanvas,imageIdentifier) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.fabricCanvas = fabricCanvas;
        this.imageIdentifier = imageIdentifier;

        // create the fabric.js object for rendering
        this.fabricObject = new fabric.Circle({
            originX: 'center',
            originY: 'center',
            left: this.x,
            top: this.y,
            fill: this.color,
            radius: 150
        });
    }

    /**
     * adjustToZoom:
     *
     * Adjusts size of the circle based on zoom level
     *
     * @param {float} zoom: zoom ratio to adjust to
     */
    adjustToZoom(zoom) {
        this.fabricObject.setRadius(150 / (zoom * 1.5));
    }

    /**
     * remove:
     *
     * Removes the circle from the canvas
     */
    remove() {
        this.fabricCanvas.remove(this.fabricObject);
    }

    /**
     * render:
     *
     * Adds the circle to the canvas
     *
     * @param {float} zoom: zoom ratio
     */
    render(zoom) {
        this.adjustToZoom(zoom); // needs to be called first for some silly reason
        this.fabricCanvas.add(this.fabricObject);
    }
}

/**
 * ButtonBar.js
 *
 * Creates a row of buttons for the menu
 *
 * By Nicholas Verrochi and Vidhya Sree N
 */

class ButtonBar {

    plugin; // access to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // container for all buttons
    undoButton; // undo button
    redoButton; // redo button
    resetButton; // reset button
    exportButton; // allows for exporting measurement data to csv
    deleteButton;

    /**
     * constructor
     *
     * Creates the button bar and sets up handlers
     *
     * @param {OSDMeasure} plugin: reference to the plugin
     */

    constructor(plugin) {
        this.plugin = plugin;
        this.element = document.createElement("div");

        this.undoButton = document.createElement("input");
        this.undoButton.setAttribute("type", "button");
        this.undoButton.setAttribute("value", "undo (ctrl + z)");
        this.setButtonStyle(this.undoButton);
        this.undoButton.addEventListener("click", () => {
            this.plugin.undo();
        });
        this.element.appendChild(this.undoButton);

        this.redoButton = document.createElement("input");
        this.redoButton.setAttribute("type", "button");
        this.redoButton.setAttribute("value", "redo (ctrl + y)");
        this.setButtonStyle(this.redoButton);
        this.redoButton.addEventListener("click", () => {
            this.plugin.redo();
        });
        this.element.appendChild(this.redoButton);

        this.resetButton = document.createElement("input");
        this.resetButton.setAttribute("type", "button");
        this.resetButton.setAttribute("value", "reset (ctrl + r)")
        this.setButtonStyle(this.resetButton);
        this.resetButton.addEventListener("click", () => {
            if (window.confirm("Are you sure you want to reset all measurements and annotations?")) {
                this.plugin.clear();
            }
        });
        this.element.appendChild(this.resetButton);

        this.exportButton = document.createElement("input");
        this.exportButton.setAttribute("type", "button");
        this.exportButton.setAttribute("value", "export csv (ctrl + s)")
        this.setButtonStyle(this.exportButton);
        this.exportButton.addEventListener("click", () => {
            this.plugin.exportCSV();
        });
        this.element.appendChild(this.exportButton);
        // Create a "Delete" button
                this.deleteButton = document.createElement("input");
                this.deleteButton.setAttribute("type", "button");
                this.deleteButton.setAttribute("value", "delete (ctrl + d)");
                this.setButtonStyle(this.deleteButton);
                this.deleteButton.addEventListener("click", () => {
                    this.plugin.deleteSelectedMeasurement();
                });
                this.element.appendChild(this.deleteButton);
    }

    /**
     * setButtonStyle:
     *
     * Styles an individual button
     *
     * @param {HMTLInputElement} button: button to style
     */
    setButtonStyle(button) {
        let style = button.style;
        style.setProperty("color", "white");
        style.setProperty("background-color", "black");
        style.setProperty("width", "100%");
        style.setProperty("height", "25px");
    }
}

/**
 * MeasurementList.js
 *
 * Encapsulates the dynamic measurement list in the menu
 *
 * By Nicholas Verrochi and Vidhya Sree N
 */

class MeasurementList {

    plugin; // reference to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // UL element to hold the entire list
    listItems = []; // list of li items, one per measurement of type MeasurementListItem

    /**
     * constructor:
     *
     * Creates an empty measurement list
     *
     * @param {OSDMeasure} plugin: reference to access the plugin
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.element = document.createElement("ul");
        this.element.style.setProperty("list-style", "none");

        // add new list item when measurement added
        document.addEventListener("measurement-added", this.addLatestMeasurement.bind(this));
        document.addEventListener("measurement-removed", this.removeLatestMeasurement.bind(this));
        document.addEventListener("measurements-reset", this.resetMeasurements.bind(this));
        document.addEventListener("data-loaded", this.addAllMeasurements.bind(this));
        document.addEventListener("delete-selected-measurement", (event) => {
                            this.removeSelectedMeasurement(event.detail.measurement);
                        });
    }

    /**
     * addAllMeasurements:
     *
     * Adds all measurements to the list
     */
    addAllMeasurements() {
        for (let i = 0; i < this.plugin.measurements.length; i++) {
            let measurement = this.plugin.measurements[i];
            let listItem = new MeasurementListItem(this.plugin, measurement);
            this.listItems.push(listItem);
            this.element.appendChild(listItem.element);
        }
    }

    /**
     * addLatestMeasurement:
     *
     * Creates a new list item for the most recently added measurement and adds it to the list
     */
    addLatestMeasurement() {
        let measurement = this.plugin.measurements[this.plugin.measurements.length - 1];
        let listItem = new MeasurementListItem(this.plugin, measurement);
        this.listItems.push(listItem);
        this.element.appendChild(listItem.element);
    }

    /**
     * addToDocument:
     *
     * Adds the entire list to the DOM tree
     * Also sets it up to work in fullscreen mode
     */
    addToDocument() {
        document.appendChild(this.element);
        this.plugin.viewer.element.appendChild(this.element);
    }

    /**
     * removeLatestMeasurement:
     *
     * Removes the latest measurement from the list upon undo
     */
    removeLatestMeasurement() {
        this.element.removeChild(this.listItems.pop().element);
    }

    /**
     * resetMeasurements:
     *
     * Clears the list when the user resets all measurements
     */
    resetMeasurements() {
        for(let i = 0; i < this.listItems.length; i++) {
            this.element.removeChild(this.listItems[i].element);
        }
        this.listItems = [];
    }

    removeSelectedMeasurement(measurement) {
            const measurementId = measurement.id;
            const indexToRemove = this.listItems.findIndex(item => item.measurement.id === measurementId);
            console.log(indexToRemove);
            if (indexToRemove !== -1) {
                this.element.removeChild(this.listItems[indexToRemove].element);
                this.listItems.splice(indexToRemove, 1);
            }
        }
}

/**
 * MeasurementListItem.js
 *
 * Encapsulates a single item on the measurement list
 *
 * By Nicholas Verrochi and Vidhya Sree N
 */

class MeasurementListItem {

    plugin; // reference to the OSDMeasure plugin
    measurement; // reference to the measurement's object representation

    /**
     * HTML elements
     */
    element; // li element that holds the list item
    nameField; // text input that holds the measurement name
    lengthDisplay; // displays the length of the measurement

    /**
     * constructor:
     *
     * @param {OSDMeasure} plugin: reference for access to the plugin
     * @param {Measurement} measurement: measurement object to represent
     */
    constructor(plugin, measurement) {
        this.plugin = plugin;
        this.measurement = measurement;

        this.element = document.createElement("li");

        this.nameField = document.createElement("input");
        this.nameField.setAttribute("type", "text");
        this.nameField.value = this.measurement.name;
        this.nameField.addEventListener("input", this.updateName.bind(this));
        this.setNameFieldStyle();
        this.element.appendChild(this.nameField);

        this.lengthDisplay = document.createElement("span");
        this.lengthDisplay.innerText = `: ${(this.measurement.distance).toFixed(3)} ${this.measurement.units}`;
        this.element.appendChild(this.lengthDisplay);
    }

    /**
     * setNameFieldStyle:
     *
     * Sets up the style of the name input field
     */
    setNameFieldStyle() {
        let style = this.nameField.style;
        style.setProperty("background", "transparent");
        style.setProperty("border", "none");
        style.setProperty("color", "white");
        style.setProperty("text-align", "right");
        style.setProperty("width", "50%");
    }

    /**
     * updateName:
     *
     * Changes name to reflect the user's choice
     */
    updateName() {
        this.measurement.name = this.nameField.value;
        this.plugin.saveInLocalStorage();
    }
}

/**
 * Menu.js
 *
 * Class to represent the measurement menu
 *
 * By Nicholas Verrochi and Vidhya Sree N
 */

class Menu {

    plugin; // reference to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // holds the entire menu
    colorSelector; // color input to select measurement color
    measurementList; // dynamically displays measurements added
    buttonBar; // div which holds buttons for operations like undo, etc

    /**
     * constructor
     *
     * Programatically constructs a menu
     *
     * @param {OSDMeasure} plugin: reference to interact with the plugin
     */
    constructor(plugin) {
        this.plugin = plugin;

        // create menu container
        this.element = document.createElement("div");
        this.element.setAttribute("hidden", "hidden"); // start hidden until user opens
        this.setMenuStyle();

        // create color selector
        this.colorSelector = document.createElement("input");
        this.colorSelector.setAttribute("type", "color");
        // handler for changing color
        this.colorSelector.addEventListener("change", this.handleColorChange.bind(this), false);
        this.setColorSelectorStyle();
        this.element.appendChild(this.colorSelector);

        // create measurement list
        this.measurementList = new MeasurementList(this.plugin);
        this.element.appendChild(this.measurementList.element);

        // create button bar
        this.buttonBar = new ButtonBar(this.plugin);
        this.element.appendChild(this.buttonBar.element);

        // set starting color after data loaded (color maintained upon restarting)
        document.addEventListener("data-loaded", this.updateColor.bind(this));
    }

    /**
     * addToDocument:
     *
     * Adds the menu to the DOM tree
     */
    addToDocument() {
        document.body.appendChild(this.element);
        // append to the viewer's element so menu will stay visible in fullscreen
        this.plugin.viewer.element.appendChild(this.element);
    }

    /**
     * handleColorChange:
     *
     * Handles change in color from the color selector
     */
    handleColorChange() {
        let color = this.colorSelector.value;
        this.plugin.setMeasurementColor(color);
    }

    /**
     * setColorSelectorStyle:
     *
     * Sets the style of the color selector
     */
    setColorSelectorStyle() {
        let style = this.colorSelector.style;
        style.setProperty("width", "100%");
        style.setProperty("height", "30px");
        style.setProperty("border", "none");
        style.setProperty("padding", "0px");
    }

    /**
     * setMenuStyle:
     *
     * sets the style of the menu container
     */
    setMenuStyle() {
        let style = this.element.style;
        // positioning
        style.setProperty("position", "absolute");
        style.setProperty("text-align", "left");
        style.setProperty("top", "10%");
        style.setProperty("right", "0%");
        style.setProperty("z-index", "2");
        // sizing
        style.setProperty("width", "20%");
        style.setProperty("padding", "1%");
        // coloring and opacity
        style.setProperty("background", "rgba(0, 0, 0, 0.75)");
        style.setProperty("color", "white"); // text color
    }

    /**
     * updateColor:
     *
     * Callback that sets the color swatch properly after loading
     * Needed because color selection saved between sessions
     */
    updateColor() {
        let color = this.plugin.measurementColor;
        this.colorSelector.value = color;
        this.plugin.setMeasurementColor(color);
    }
}
/**
 * MenuBar.js
 *
 * Encapsulates the menu icon
 *
 * By Nicholas Verrochi and Vidhya Sree N
 */

class MenuButton {

    plugin; // reference to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // img element that holds the menu icon

    /**
     * constructor:
     *
     * Encapsulates the menu icon using HTMLElement objects
     * Sets up callbacks to open the menu on click
     * Adds the menu icon to the DOM tree
     *
     * @param {OSDMeasure} plugin: reference used to interact with the plugin
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.element = document.createElement("img");
        this.element.setAttribute("tabindex", "0"); // allow tabbing
        this.element.setAttribute("src", "img/hamburger-50.png")
        this.setupStyle();
    }

    /**
     * addToDocument:
     *
     * Adds the menu icon to the document
     * Appends elements as children to the viewer - this allows the menu to appear while in fullscreen mode
     */
    addToDocument() {
        document.body.appendChild(this.element);
        // appending to viewer so icon displays in fullscreen mode
        this.plugin.viewer.element.appendChild(this.element);
    }

    /**
     * setupIconStyle:
     *
     * Sets up the CSS styling for the menu icon (not the dots within)
     */
    setupStyle() {
        let style = this.element.style;
        // need to set background color for visibility
        style.setProperty("background-color", "white");
        // positioning - set in top right
        style.setProperty("position", "absolute");
        style.setProperty("top", "0%");
        style.setProperty("right", "0%");
        style.setProperty("z-index", "1");
        // pointer cursor so the user knows they can click
        style.setProperty("cursor", "pointer");
    }
}
/**
 * UI.js
 *
 * Generates a basic UI for the OSDMeasure plugin
 * This gets generated on the document and alters
 * some of the css for the document
 *
 * By Nicholas Verrochi and Vidhya Sree N
 */

class UI {

    plugin; // access to the OSDMeasure plugin

    /**
     * HTML elements
     */
    menuButton; // traditional (three dots) menu icon
    menu; // the measurement menu itself

    /**
     * constructor:
     *
     * Sets up inner HTML elements and their style
     * Sets up event callbacks for UI elements
     * Doesn't add anything to the document! This has a separate function
     *
     * @param {OSDMeasure} plugin: reference to interact with the plugin
     */
    constructor(plugin, options = {}) {
        this.plugin = plugin
        this.setBodyStyle();

        // setup menu and icon
        this.menuButton = new MenuButton(plugin, options);
        this.menu = new Menu(plugin, options);

        // wire menu to open when icon clicked
        this.menuButton.element.addEventListener("click", this.toggleMenu.bind(this));
    }

    /**
     * addToDocument:
     *
     * Adds the entire UI to the document - call this after instantiating to display
     */
    addToDocument() {
        this.menuButton.addToDocument();
        this.menu.addToDocument();
    }

    /**
     * toggleMenu:
     *
     * Toggles the menu visibility
     */
    toggleMenu() {
        if (this.menu.element.getAttribute("hidden") == "hidden") {
            this.menu.element.removeAttribute("hidden");
        }
        else {
            this.menu.element.setAttribute("hidden", "hidden");
        }
    }

    /**
     * setBodyStyle:
     *
     * Sets style for the document to setup background color and stop overflow
     */
    setBodyStyle() {
        let style = document.body.style;
        style.setProperty("overflow", "hidden", "important");
        style.setProperty("background-color", "black");
        style.setProperty("font-size", "0.9em");
    }
}