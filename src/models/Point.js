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
    constructor(x, y, color, fabricCanvas) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.fabricCanvas = fabricCanvas

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