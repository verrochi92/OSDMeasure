/**
 * ButtonBar.js
 * 
 * Creates a row of buttons for the menu
 * 
 * By Nicholas Verrochi and Vidhya Sree N
 */

class ButtonBar {
    
    plugin; // access to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // container for all buttons
    undoButton; // undo button
    redoButton; // redo button
    resetButton; // reset button
    exportButton; // allows for exporting measurement data to csv

    /**
     * constructor
     * 
     * Creates the button bar and sets up handlers
     * 
     * @param {OSDMeasure} plugin: reference to the plugin 
     */

    constructor(plugin) {
        this.plugin = plugin;
        this.element = document.createElement("div");

        this.undoButton = document.createElement("input");
        this.undoButton.setAttribute("type", "button");
        this.undoButton.setAttribute("value", "undo (ctrl + z)");
        this.setButtonStyle(this.undoButton);
        this.undoButton.addEventListener("click", () => {
            this.plugin.undo();
        });
        this.element.appendChild(this.undoButton);

        this.redoButton = document.createElement("input");
        this.redoButton.setAttribute("type", "button");
        this.redoButton.setAttribute("value", "redo (ctrl + y)");
        this.setButtonStyle(this.redoButton);
        this.redoButton.addEventListener("click", () => { 
            this.plugin.redo();
        });
        this.element.appendChild(this.redoButton);

        this.resetButton = document.createElement("input");
        this.resetButton.setAttribute("type", "button");
        this.resetButton.setAttribute("value", "reset (ctrl + r)")
        this.setButtonStyle(this.resetButton);
        this.resetButton.addEventListener("click", () => {
            if (window.confirm("Are you sure you want to reset all measurements and annotations?")) {
                this.plugin.clear();
            }
        });
        this.element.appendChild(this.resetButton);

        this.exportButton = document.createElement("input");
        this.exportButton.setAttribute("type", "button");
        this.exportButton.setAttribute("value", "export csv (ctrl + s)")
        this.setButtonStyle(this.exportButton);
        this.exportButton.addEventListener("click", () => {
            this.plugin.exportCSV();
        });
        this.element.appendChild(this.exportButton);
    }

    /**
     * setButtonStyle:
     * 
     * Styles an individual button
     * 
     * @param {HMTLInputElement} button: button to style
     */
    setButtonStyle(button) {
        let style = button.style;
        style.setProperty("color", "white");
        style.setProperty("background-color", "black");
        style.setProperty("width", "100%");
        style.setProperty("height", "25px");
    }
}