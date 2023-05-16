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
    }

    /**
     * addMeasurement:
     * 
     * Creates a new list item for a measurement and adds it to the list
     * 
     * @param {Measurement} measurement 
     */
    addMeasurement(measurement) {
        let listItem = new MeasurementListItem(measurement);
        this.listItems.push(listItem);
        this.element.appendChild(listItem.element);
    }
}