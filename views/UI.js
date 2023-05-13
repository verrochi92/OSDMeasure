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

    /**
     * HTML elements
     */
    menuIcon; // traditional (three dots) menu icon

    /**
     * Style options (from the "options" object)
     */
    backgroundColor;

    /**
     * constructor:
     * 
     * Sets up inner HTML elements and their style
     * Sets up event callbacks for UI elements
     * Doesn't add anything to the document! This has a separate function
     * Options comes from the "uiOptions" object from the "options" objects 
     * used to instantiate the OSDMeasure class
     * 
     * @param {Object} options: options to customize the menu
     */
    constructor(options = {}) {
        this.processOptions(options);
        this.setBodyStyle();
        this.menuIcon = new MenuIcon(options);
    }

    /**
     * addToDocument:
     * 
     * Adds the entire UI to the document - call this after instantiating to display
     */
    addToDocument() {
        this.menuIcon.addToDocument();
    }

    /**
     * processOptions:
     * 
     * Stores options from argument in the object proper
     * Sets defaults for options not set
     * 
     * @param {Object} options 
     */
    processOptions(options) {
        if (options.backgroundColor) {
            this.backgroundColor = options.backgroundColor;
        }
        else {
            this.backgroundColor = "black";
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
        style.setProperty("background-color", this.backgroundColor);
    }
}