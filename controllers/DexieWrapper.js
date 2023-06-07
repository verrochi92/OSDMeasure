/**
 * DexieWrapper.js
 * 
 * Database wrapper that helps access data via the plugin
 * 
 * By Nicholas Verrochi
 */

class DexieWrapper {

    db; // Dexie.js object to access the database

    constructor() {
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
        return await this.db.measurements.toArray();
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