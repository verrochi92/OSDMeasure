/**
 * Point.js
 * Object model to represent a point (part of a measurement)
 * By Nicholas Verrochi
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
     * 
     * @param {*} x 
     * @param {*} y 
     * @param {*} color 
     * @param {*} fabricCanvas 
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
        this.fabricCanvas.add(this.fabricObject);
        this.adjustToZoom(zoom);
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
}