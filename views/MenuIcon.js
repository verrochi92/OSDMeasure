/**
 * MenuBar.js
 * 
 * Programatically generates a menu icon
 * 
 * By Nicholas Verrochi
 */

class MenuBar {
    constructor(options = {}) {
        processOptions(options);
        this.element = new document.createElement("div");
        this.dots = [
            document.createElement("div"),
            document.createElement("div"),
            document.createElement("div")
        ];
        setupStyle();
        
        // add to document
        document.appendChild(menuIcon);
        this.dots.map((dot) => {
            menuIcon.appendChild(dot);
        });
    }

    processOptions(options) {
        if (options.menuIconColor) {
            this.menuIconColor = options.menuIconColor;
        }
        else {
            this.menuIconColor = "white";
        }

        if (options.menuBackgroundColor) {
            this.menuBackgroundColor = options.menuBackgroundColor;
        }
        else {
            this.menuBackgroundColor = "rgba(0, 0, 0, 0.7)";
        }
    }

    setupStyle() {
        let style = this.element.style;
        style.setProperty("background-color", this.menuBackgroundColor);

    }
}