/**
 * MeasurementList.js
 * 
 * Encapsulates the dynamic measurement list in the menu
 * 
 * By Nicholas Verrochi and Vidhya Sree N
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
        this.element.style.setProperty("list-style", "none");

        // add new list item when measurement added
        document.addEventListener("measurement-added", this.addLatestMeasurement.bind(this));
        document.addEventListener("measurement-removed", this.removeLatestMeasurement.bind(this));
        document.addEventListener("measurements-reset", this.resetMeasurements.bind(this));
        document.addEventListener("data-loaded", this.addAllMeasurements.bind(this));
    }

    /**
     * addAllMeasurements:
     * 
     * Adds all measurements to the list
     */
    addAllMeasurements() {
        for (let i = 0; i < this.plugin.measurements.length; i++) {
            let measurement = this.plugin.measurements[i];
            let listItem = new MeasurementListItem(this.plugin, measurement);
            this.listItems.push(listItem);
            this.element.appendChild(listItem.element);
        }
    }

    /**
     * addLatestMeasurement:
     * 
     * Creates a new list item for the most recently added measurement and adds it to the list
     */
    addLatestMeasurement() {
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
     * removeLatestMeasurement:
     * 
     * Removes the latest measurement from the list upon undo
     */
    removeLatestMeasurement() {
        this.element.removeChild(this.listItems.pop().element);
    }

    /**
     * resetMeasurements:
     * 
     * Clears the list when the user resets all measurements
     */
    resetMeasurements() {
        for(let i = 0; i < this.listItems.length; i++) {
            this.element.removeChild(this.listItems[i].element);
        }
        this.listItems = [];
    }
}