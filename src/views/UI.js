/**
 * UI.js
 * 
 * Generates a basic UI for the OSDMeasure plugin
 * This gets generated on the document and alters
 * some of the css for the document
 * 
 * By Nicholas Verrochi and Vidhya Sree N
 */

class UI {

    plugin; // access to the OSDMeasure plugin

    /**
     * HTML elements
     */
    menuButton; // traditional (three dots) menu icon
    menu; // the measurement menu itself

    /**
     * constructor:
     * 
     * Sets up inner HTML elements and their style
     * Sets up event callbacks for UI elements
     * Doesn't add anything to the document! This has a separate function
     * 
     * @param {OSDMeasure} plugin: reference to interact with the plugin
     */
    constructor(plugin, options = {}) {
        this.plugin = plugin
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
     * setBodyStyle:
     * 
     * Sets style for the document to setup background color and stop overflow
     */
    setBodyStyle() {
        let style = document.body.style;
        style.setProperty("overflow", "hidden", "important");
        style.setProperty("background-color", "black");
        style.setProperty("font-size", "0.9em");
    }
}