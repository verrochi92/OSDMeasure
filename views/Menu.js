/**
 * Menu.js
 * 
 * Class to represent the measurement menu
 * 
 * By Nicholas Verrochi
 */

class Menu {

    /**
     * HTML elements
     */
    element; // holds the entire menu

    /**
     * constructor
     * 
     * @param {Object} options: customization options object
     */
    constructor(options = {}) {
        this.element = document.createElement("div");
    }
}