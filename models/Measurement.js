/**
 * Measurement.js
 * Object model to represent a measurement between two points
 * By Nicholas Verrochi
 * For CS410 - The Axolotl Project
 */

class Measurement {
    /* p1 and p2 are the **image** coordinates */
    constructor(p1, p2, name, color, conversionFactor, units) {
        this.p1 = p1;
        this.p2 = p2;
        this.id = name; // this never changes
        this.name = name;
        this.color = color;
        this.distance = Math.sqrt(Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2));
        this.conversionFactor = conversionFactor; // pixels * conversionFactor = actual measurement
        this.units = units;
    }

    /* render the measurement as 3 fabricjs objects on the viewer passed in */
    render(fabricCanvas, zoom) {
        this.p1.render(fabricCanvas, zoom);
        this.p2.render(fabricCanvas, zoom);

        // draw line between p1 and p2
        let line = new fabric.Line([this.p1.x, this.p1.y, this.p2.x, this.p2.y], {
            originX: 'center',
            originY: 'center',
            stroke: this.color,
            strokeWidth: 50 / zoom
        });
        fabricCanvas.add(line);
        // create text object to display measurement
        let text = (this.distance * this.conversionFactor).toFixed(3) + " " + this.units;
        let textObject = new fabric.Text(text, {
            left: Math.max(this.p1.x, this.p2.x) + 100 / zoom,
            top: this.p1.x > this.p2.x ? this.p1.y : this.p2.y,
            fontSize: 300 / zoom,
            fill: this.color
        });
        fabricCanvas.add(textObject);
    }

    /* returns the string representing the distance */
    toString() {
        return `${(this.distance * this.conversionFactor).toFixed(3)}`;
    }

    /* convert to a list element */
    toListElementInnerHTML() {
        return `<span contenteditable="true">${this.name}</span>: ` + 
            `${(this.distance * this.conversionFactor).toFixed(3)} ${this.units}`;
    }
}