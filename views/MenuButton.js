/**
 * MenuBar.js
 * 
 * Encapsulates the menu icon 
 * 
 * By Nicholas Verrochi
 */

class MenuButton {

    plugin; // reference to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // img element that holds the menu icon

    /**
     * Customization options
     */
    menuButtonColor; // color of the menu icon

    /**
     * constructor
     * 
     * Encapsulates the menu icon using HTMLElement objects
     * Sets up callbacks to open the menu on click
     * Adds the menu icon to the DOM tree
     * 
     * @param {OSDMeasure} plugin: reference used to interact with the plugin
     * @param {Object} options: set the style options for the menu icon
     */
    constructor(plugin, options = {}) {
        this.plugin = plugin;
        this.processOptions(options);
        this.element = document.createElement("img");
        this.element.setAttribute("tabindex", "0"); // allow tabbing
        this.element.setAttribute("src", "img/hamburger-50.png")
        this.setupStyle();
    }

    /**
     * addToDocument:
     * 
     * Adds the menu icon to the document
     * Appends elements as children to the viewer - this allows the menu to appear while in fullscreen mode
     */
    addToDocument() {
        document.body.appendChild(this.element);
        // appending to viewer so icon displays in fullscreen mode
        this.plugin.viewer.element.appendChild(this.element);
    }

    /**
     * processOptions:
     * 
     * Stores options from the passed in object in the object proper
     * Sets defaults for options not included
     * 
     * @param {Object} options 
     */
    processOptions(options) {
        if (options.menuButtonColor) {
            this.menuButtonColor = options.menuButtonColor;
        }
        else {
            this.menuButtonColor = "white";
        }
    }

    /**
     * setupIconStyle:
     * 
     * Sets up the CSS styling for the menu icon (not the dots within)
     */
    setupStyle() {
        let style = this.element.style;
        // need to set background color for visibility
        style.setProperty("background-color", this.menuButtonColor);
        // positioning - set in top right
        style.setProperty("position", "absolute");
        style.setProperty("top", "0%");
        style.setProperty("right", "0%");
        style.setProperty("z-index", "1");
        // pointer cursor so the user knows they can click
        style.setProperty("cursor", "pointer");
    }
}