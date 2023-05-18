/**
 * Measurement.js
 * Object model to represent a measurement between two points
 * By Nicholas Verrochi
 * For CS410 - The Axolotl Project
 */

class Measurement {

    p1; // starting point of the measurement in **image** coordinates
    p2; // ending point of the measurement in image coordinates
    name; // name given to the measurement
    color; // color used to render the measurement
    distance; // distance in pixels
    conversionFactor; // factor to convert from px -> chosen units (distance in px * conversion factor = converted distance)
    units; // string to represent the units, for example "px" for pixels

    /**
     * fabric.js objects
     */
    fabricGroup; // stores the fabric.js objects used to render the measurement
    fabricCanvas; // the canvas on which to render the fabric.js objects
    line; // line between the two points
    textObject; // text displaying the distance
        
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
    constructor(p1, p2, name, color, conversionFactor, units, fabricCanvas) {
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
        this.fabricGroup = new fabric.Group();
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
    }

    /**
     * remove:
     * 
     * Removes the fabric group from the canvas
     */
    remove() {
        this.fabricCanvas.remove(this.fabricGroup);
    }

    /**
     * render:
     * 
     * Adds the points, line, and length text to the canvas
     * 
     * @param {float} zoom: zoom ratio of the viewer
     */
    render(zoom) {
        this.fabricGroup.add(this.p1.fabricObject);
        this.fabricGroup.add(this.p2.fabricObject);

        // draw line between p1 and p2
        this.line = new fabric.Line([this.p1.x, this.p1.y, this.p2.x, this.p2.y], {
            originX: 'center',
            originY: 'center',
            stroke: this.color,
            strokeWidth: 50 / zoom
        });
        this.fabricGroup.add(this.line);
        // create text object to display measurement
        let text = (this.distance).toFixed(3) + " " + this.units;
        this.textObject = new fabric.Text(text, {
            left: Math.max(this.p1.x, this.p2.x) + 100 / zoom,
            top: this.p1.x > this.p2.x ? this.p1.y : this.p2.y,
            fontSize: 300 / zoom,
            fill: this.color
        });
        this.fabricGroup.add(this.textObject);

        this.fabricCanvas.add(this.fabricGroup);
        this.adjustToZoom();
    }
}