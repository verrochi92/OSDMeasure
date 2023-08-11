/**
 * MeasurementListItem.js
 * 
 * Encapsulates a single item on the measurement list
 * 
 * By Nicholas Verrochi and Vidhya Sree N
 */

class MeasurementListItem {

    plugin; // reference to the OSDMeasure plugin
    measurement; // reference to the measurement's object representation

    /**
     * HTML elements
     */
    element; // li element that holds the list item
    nameField; // text input that holds the measurement name
    lengthDisplay; // displays the length of the measurement

    /**
     * constructor:
     * 
     * @param {OSDMeasure} plugin: reference for access to the plugin 
     * @param {Measurement} measurement: measurement object to represent
     */
    constructor(plugin, measurement) {
        this.plugin = plugin;
        this.measurement = measurement;

        this.element = document.createElement("li");

        this.nameField = document.createElement("input");
        this.nameField.setAttribute("type", "text");
        this.nameField.value = this.measurement.name;
        this.nameField.addEventListener("input", this.updateName.bind(this));
        this.setNameFieldStyle();
        this.element.appendChild(this.nameField);

        this.lengthDisplay = document.createElement("span");
        this.lengthDisplay.innerText = `: ${(this.measurement.distance).toFixed(3)} ${this.measurement.units}`;
        this.element.appendChild(this.lengthDisplay);
    }

    /**
     * setNameFieldStyle:
     * 
     * Sets up the style of the name input field
     */
    setNameFieldStyle() {
        let style = this.nameField.style;
        style.setProperty("background", "transparent");
        style.setProperty("border", "none");
        style.setProperty("color", "white");
        style.setProperty("text-align", "right");
        style.setProperty("width", "50%");
    }

    /**
     * updateName:
     * 
     * Changes name to reflect the user's choice
     */
    updateName() {
        this.measurement.name = this.nameField.value;
        this.plugin.saveInLocalStorage();
    }
}