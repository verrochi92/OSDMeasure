/**
 * MeasurementListItem.js
 * 
 * Encapsulates a single item on the measurement list
 * 
 * By Nicholas Verrochi
 */

class MeasurementListItem {

    plugin; // reference to the OSDMeasure plugin
    measurement; // reference to the measurement's object representation

    /**
     * constructor:
     * 
     * @param {OSDMeasure} plugin: reference for access to the plugin 
     */
    constructor(plugin, measurement) {
        this.plugin = plugin;
        this.measurement = measurement;
    }

}