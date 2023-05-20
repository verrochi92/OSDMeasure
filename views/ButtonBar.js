/**
 * ButtonBar.js
 * 
 * Creates a row of buttons for the menu
 * 
 * By Nicholas Verrochi
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
        this.undoButton.addEventListener("click", this.plugin.undo());
        this.element.appendChild(this.undoButton);

        this.redoButton = document.createElement("input");
        this.redoButton.setAttribute("type", "button");
        this.redoButton.setAttribute("value", "redo (ctrl + y)");
        this.setButtonStyle(this.redoButton);
        this.redoButton.addEventListener("click", this.plugin.redo());

        this.resetButton = document.createElement("input");
        this.resetButton.setAttribute("type", "button");
        this.resetButton.setAttribute("value", "reset (ctrl + r)")
        this.setButtonStyle(this.resetButton);
        this.resetButton.addEventListener("click", this.plugin.clear());

        this.exportButton = document.createElement("input");
        this.exportButton.setAttribute("type", "button");
        this.exportButton.setAttribute("value", "export csv (ctrl + s)")
        this.setButtonStyle(this.exportButton);
        this.exportButton.addEventListener("click", this.plugin.exportCSV());
    }

}