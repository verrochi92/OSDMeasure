/**
 * DBWrapper.js
 * 
 * Database wrapper that helps access data via the plugin
 * 
 * By Nicholas Verrochi
 */

class DBWrapper {

    db; // Dexie.js object to access the database

    constructor() {
        this.db = new Dexie("database");
        this.db.version(1).stores({
            measurements: `
                p1x, p1y,
                p2x, p2y,
                name,
                color`
        });
        this.db.open();
    }

    /**
     * getAllMeasurements:
     * 
     * Gets all the measurements from the database
     * 
     * @returns a list of all stored measurements
     */
    getAllMeasurements() {

    }

    /**
     * saveMeasurement:
     * 
     * Saves a measurement into the database
     * 
     * @param {Measurement} measurement: the measurement object to store 
     */
    saveMeasurement(measurement) {
        this.db.measurements.put({
            p1x: measurement.p1.x,
            p1y: measurement.p1.y,
            p2x: measurement.p2.x,
            p2y: measurement.p2.y,
            name: measurement.name,
            color: measurement.color
        });
    }

}