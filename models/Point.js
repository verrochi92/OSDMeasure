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

    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    /* renders the object onto the fabricCanvas based on zoom */
    render(fabricCanvas, zoom) {
        this.fabricObject = new fabric.Circle({
            originX: 'center',
            originY: 'center',
            left: this.x,
            top: this.y,
            fill: this.color,
            radius: 150 / (zoom * 1.5)
        });
        fabricCanvas.add(this.fabricObject);
    }
}