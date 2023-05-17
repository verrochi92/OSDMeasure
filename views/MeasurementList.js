/**
 * MeasurementList.js
 * 
 * Encapsulates the dynamic measurement list in the menu
 * 
 * By Nicholas Verrochi
 */

class MeasurementList {

    plugin; // reference to the OSDMeasure plugin

    /**
     * HTML elements
     */
    element; // UL element to hold the entire list
    listItems = []; // list of li items, one per measurement of type MeasurementListItem

    /**
     * constructor:
     * 
     * Creates an empty measurement list
     * 
     * @param {OSDMeasure} plugin: reference to access the plugin
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.element = document.createElement("ul");

        // add new list item when measurement added
        document.addEventListener("measurement-added", this.addMeasurement.bind(this), false);
        document.addEventListener("measurement-removed", this.removeMeasurement.bind(this), false);
    }

    /**
     * addMeasurement:
     * 
     * Creates a new list item for the most recently added measurement and adds it to the list
     */
    addMeasurement() {
        let measurement = this.plugin.measurements[this.plugin.measurements.length - 1];
        let listItem = new MeasurementListItem(this.plugin, measurement);
        this.listItems.push(listItem);
        this.element.appendChild(listItem.element);
    }

    /**
     * addToDocument:
     * 
     * Adds the entire list to the DOM tree
     * Also sets it up to work in fullscreen mode
     */
    addToDocument() {
        document.appendChild(this.element);
        this.plugin.viewer.element.appendChild(this.element);
    }

    /**
     * removeMeasurement:
     * 
     * Removes the latest measurement from the list upon undo
     */
    removeMeasurement() {
        this.element.removeChild(this.listItems.pop());
    }
}