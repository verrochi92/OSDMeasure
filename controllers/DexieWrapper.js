/**
 * DexieWrapper.js
 * 
 * Database wrapper that helps access data via the plugin
 * 
 * By Nicholas Verrochi
 */

class DexieWrapper {

    db; // Dexie.js object to access the database
    plugin; // reference to the plugin

    /**
     * constructor
     * 
     * Opens the database, will work whether it exists already or not
     * 
     * @param {OSDMeasure} plugin 
     */
    constructor(plugin) {
        this.plugin = plugin;
        this.db = new Dexie("database");
        this.db.version(1).stores({
            measurements: `
                id,
                p1x, p1y,
                p2x, p2y,
                name,
                color`
        });
        this.db.open();
    }

    /**
     * clear:
     * 
     * Removes all entries from the database
     */
    clear() {
        this.db.measurements.clear();
    }

    /**
     * getAllMeasurements:
     * 
     * Gets all the measurements from the database
     * 
     * @returns a list of all stored measurements
     */
    async getAllMeasurements() {
        let measurements = [];
        let result = await this.db.measurements.toArray();
        for (let i = 0; i < result.length; i++) {
            measurements[i] = new Measurement(
                new Point(result[i].p1x, result[i].p1y, result[i].color, this.plugin.fabricCanvas),
                new Point(result[i].p2x, result[i].p2y, result[i].color, this.plugin.fabricCanvas),
                result[i].name, result[i].color, this.plugin.conversionFactor, this.plugin.units, this.plugin.fabricCanvas
            );
        }
        return measurements;
    }

    /**
     * removeMeasurement:
     * 
     * Removes the measurement passed in from the database
     * 
     * @param {Measurement} measurement 
     */
    removeMeasurement(measurement) {
        this.db.measurements.delete(measurement.id);
    }

    /**
     * saveMeasurement:
     * 
     * Saves a measurement into the database
     * Measurements that already exist are replaced with their new versions
     * 
     * @param {Measurement} measurement: the measurement object to store 
     */
    saveMeasurement(measurement) {
        this.db.measurements.put({
            id: measurement.id,
            p1x: measurement.p1.x,
            p1y: measurement.p1.y,
            p2x: measurement.p2.x,
            p2y: measurement.p2.y,
            name: measurement.name,
            color: measurement.color
        });
    }
}