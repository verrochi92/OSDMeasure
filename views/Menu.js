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
    measurementList; // dynamically displays measurements added

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
        this.colorSelector.value = plugin.measurementColor; // set color from plugin
        // handler for changing color
        this.colorSelector.addEventListener("change", this.handleColorChange.bind(this), false);
        this.setColorSelectorStyle();
        this.element.appendChild(this.colorSelector);

        // create measurement list
        this.measurementList = new MeasurementList(this.plugin);
        this.element.appendChild(this.measurementList.element);
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
        style.setProperty("min-height", "5%");
        style.setProperty("min-width", "10%");
        style.setProperty("padding", "1%");
        // coloring and opacity
        style.setProperty("background", "rgba(0, 0, 0, 0.75)");
        style.setProperty("color", "white"); // text color
    }
}