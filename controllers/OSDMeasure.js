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
            this.p2 = new Point(imagePoint.x, imagePoint.y, this.measurementColor, this.fabricCanvas);
            this.p2.render(zoom);
            let measurement = new Measurement(
                this.p1, this.p2,
                `M${this.measurements.length + 1}`,
                this.measurementColor, this.conversionFactor, this.units, this.fabricCanvas
            );
            measurement.render(zoom);
            this.measurements.push(measurement);
            measurement.id = this.measurements.length - 1;
            this.saveInLocalStorage();
            // dispatch an event to let it be known there is a new measurement
            document.dispatchEvent(new Event("measurement-added"));
        } else { // place the first point
            this.p1 = new Point(imagePoint.x, imagePoint.y, this.measurementColor, this.fabricCanvas);
            this.p1.render(zoom);
        }
        // have to blow out the redo stack since we made a new measurement
        this.redoStack = [];
        this.isMeasuring = !this.isMeasuring;
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
        this.p1 = null;
        this.p2 = null;
        document.dispatchEvent(new Event("measurements-reset"));
    }

    /**
     * exportCSV:
     *     creates a CSV containing the measurement data
     */
    exportCSV() {
        let header = ["Name", "Point 1", "Point 2", "Distance"]
        let createRow = (measurement) => {
            return [
                measurement.name,
                measurement.p1.toString(),
                measurement.p2.toString(),
                measurement.toString()
            ];
        }
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
        // override ctrl presses
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }

    /**
     * loadFromLocalStorage:
     *     Loads any existing measurements from localStorage
     */
    async loadFromLocalStorage() {
        this.measurements = await this.db.getAllMeasurements();
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
                lastObject.id = measurements.length - 1;
                lastObject.p1.render(zoom);
                lastObject.p2.render(zoom);
                lastObject.render(zoom);
                // can't forget to save!
                this.saveInLocalStorage();
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
    saveInLocalStorage() {
        this.db.saveAll(this.measurements);
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
        this.saveInLocalStorage();
    }

    /**
     * undo:
     *     Undose the last action - if mid-measurement, the first
     *     point is erased and the user will have to start over.
     *     Otherwise, the last created measurement is erased.
     */
    undo() {
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
            this.db.removeMeasurement(measurement);
            this.saveInLocalStorage();
            document.dispatchEvent(new Event("measurement-removed"));
        }

    }
}
