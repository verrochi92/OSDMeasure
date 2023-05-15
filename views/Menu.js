/**
 * Menu.js
 * 
 * Class to represent the measurement menu
 * 
 * By Nicholas Verrochi
 */

class Menu {

    plugin; // reference to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // holds the entire menu
    colorSelector; // color input to select measurement color

    /**
     * constructor
     * 
     * Programatically constructs a menu
     * 
     * @param {OSDMeasure} plugin: reference to interact with the plugin
     * @param {Object} options: customization options object
     */
    constructor(plugin, options = {}) {
        this.plugin = plugin;

        // create menu container
        this.element = document.createElement("div");
        this.element.setAttribute("hidden", "hidden"); // start hidden until user opens

        // create color selector
        this.colorSelector = document.createElement("input");
        this.colorSelector.setAttribute("type", "color");
        this.colorSelector.value = plugin.measurementColor; // set color from plugin
        // handler for changing color
        this.colorSelector.addEventListener("change", this.handleColorChange.bind(this), false);
        this.element.appendChild(this.colorSelector);
    }

    /**
     * addToDocument
     * 
     * Adds the menu to the DOM tree
     */
    addToDocument() {
        document.body.appendChild(this.element);
        // append to the viewer's element so menu will stay visible in fullscreen
        this.plugin.viewer.element.appendChild(this.element);
    }

    /**
     * handleColorChange
     * 
     * Handles change in color from the color selector 
     */
    handleColorChange() {
        console.log("handleColorChange called...");
        let color = this.colorSelector.value;
        this.plugin.setMeasurementColor(color);
    }
}