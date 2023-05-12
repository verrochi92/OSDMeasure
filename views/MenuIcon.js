/**
 * MenuBar.js
 * 
 * Programatically generates a menu icon
 * 
 * By Nicholas Verrochi
 */

class MenuIcon {

    /**
     * HTML elements
     */
    menuIcon; // div that holds the menu icon
    dots; // array of divs used to visually create dots in the icon

    /**
     * Style options
     */
    menuIconColor; // color of the dots in the icon
    menuBackgroundColor; // background color of the entire menu

    /**
     * constructor
     * 
     * Encapsulates the menu icon using HTMLElement objects
     * Sets up callbacks to open the menu on click
     * Adds the menu icon to the DOM tree
     * 
     * @param {Object} options: set the style options for the menu icon
     * 
     * relevant options are as follows:
     * - menuIconColor: color of the dots in the icon
     * - menuBackgroundColor: background color of the entire menu
     */
    constructor(options = {}) {
        this.processOptions(options);
        this.menuIcon = document.createElement("div");
        this.menuIcon.setAttribute("tabindex", "0"); // allow tabbing
        this.dots = [
            document.createElement("div"),
            document.createElement("div"),
            document.createElement("div")
        ];

        // setup style
        this.setupIconStyle();
        this.dots.map((dot) => {
            this.setupDotStyle(dot);
        })
        
        // add dots to the icon
        this.dots.map((dot) => {
            this.menuIcon.appendChild(dot);
        });
    }

    /**
     * addToDocument:
     * 
     * Adds the menu icon to the document
     * Appends elements as children to the viewer - this allows the menu to appear while in fullscreen mode
     */
    addToDocument() {
        let viewer = document.getElementById("viewer");
        document.body.appendChild(this.menuIcon);
        viewer.appendChild(this.menuIcon);
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
        if (options.menuIconColor) {
            this.menuIconColor = options.menuIconColor;
        }
        else {
            this.menuIconColor = "white";
        }

        if (options.menuBackgroundColor) {
            this.menuBackgroundColor = options.menuBackgroundColor;
        }
        else {
            this.menuBackgroundColor = "rgba(0, 0, 0, 0.7)";
        }
    }

    /**
     * setupDotStyle:
     * 
     * Sets the style for individual dots inside the menu icon
     * 
     * @param {HTMLDivElement} dot 
     */
    setupDotStyle(dot) {
        let style = dot.style;
        style.setProperty("background-color", this.menuIconColor);
        style.setProperty("border-radius", "5px");
        style.setProperty("width", "30%");
        style.setProperty("height", "3px");
    }

    /**
     * setupIconStyle:
     * 
     * Sets up the CSS styling for the menu icon (not the dots within)
     */
    setupIconStyle() {
        let style = this.menuIcon.style;
        // user-defined styling options
        style.setProperty("background-color", this.menuBackgroundColor);
        // positioning - set in top right, make dots flex in a column
        style.setProperty("position", "absolute");
        style.setProperty("top", "1%");
        style.setProperty("right", "0%");
        style.setProperty("display", "flex");
        style.setProperty("flex-direction", "column");
        style.setProperty("justify-content", "space-between");
        style.setProperty("z-index", "1");
        // size
        style.setProperty("width", "1%");
        style.setProperty("height", "3%");
        style.setProperty("padding", "1%");
        // pointer cursor so the user knows they can click
        style.setProperty("cursor", "pointer");
    }
}