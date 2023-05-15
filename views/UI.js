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
    menuButton; // traditional (three dots) menu icon

    /**
     * Style options (from the "options" object)
     */
    windowBackgroundColor;

    /**
     * constructor:
     * 
     * Sets up inner HTML elements and their style
     * Sets up event callbacks for UI elements
     * Doesn't add anything to the document! This has a separate function
     * Options comes from the "uiOptions" object from the "options" objects 
     * used to instantiate the OSDMeasure class
     * 
     * @param {OSDMeasure} plugin: reference to interact with the plugin
     * @param {Object} options: options to customize the menu
     */
    constructor(plugin, options = {}) {
        this.processOptions(options);
        this.setBodyStyle();

        // setup menu and icon
        this.menuButton = new MenuButton(plugin, options);
        this.menu = new Menu(plugin, options);

        // wire menu to open when icon clicked
        this.menuButton.element.addEventListener("click", this.toggleMenu.bind(this));
    }

    /**
     * addToDocument:
     * 
     * Adds the entire UI to the document - call this after instantiating to display
     */
    addToDocument() {
        this.menuButton.addToDocument();
        this.menu.addToDocument();
    }

    /**
     * toggleMenu:
     * 
     * Toggles the menu visibility
     */
    toggleMenu() {
        if (this.menu.element.getAttribute("hidden") == "hidden") {
            this.menu.element.removeAttribute("hidden");
        }
        else {
            this.menu.element.setAttribute("hidden", "hidden");
        }
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
        if (options.windowBackgroundColor) {
            this.windowBackgroundColor = options.windowBackgroundColor;
        }
        else {
            this.windowBackgroundColor = "black";
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
        style.setProperty("background-color", this.windowBackgroundColor);
    }
}