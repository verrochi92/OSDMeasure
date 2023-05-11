/**
 * UI.js
 * 
 * Generates a basic UI for the OSDMeasure plugin
 * This gets generated on the document and alters
 * some of the css for the document
 * 
 * By Nicholas Verrochi
 */

class UI {
    constructor(options = {}) {
        processOptions(options);
        setBodyStyle();
        this.menuIcon = new MenuIcon(options);
    }

    processOptions(options) {
        if (options.backgroundColor) {
            this.backgroundColor = options.backgroundColor;
        }
        else {
            this.backgroundColor = "black";
        }
    }

    setBodyStyle() {
        let style = document.body.style;
        style.setProperty("overflow", "hidden");
        style.setProperty("background-color", this.backgroundColor);
    }

    addToDocument() {
        document.appendChild(this.menuIcon);
    }
}