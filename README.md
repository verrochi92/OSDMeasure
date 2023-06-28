# OSDMeasure
 Measure with OpenSeadragon!

 Created by Nicholas Verrochi, Vidhya Sree Narayanappa, Sairam Bandarupalli and Andy Duverneau
 for Professor Daniel Haehn's [CS410](https://cs410.net/) class at the University of Massachusetts in Boston.
 
 This plugin was created as part of [the Axolotl Project](https://github.com/verrochi92/axolotl/) for the McCusker lab at UMass Boston.
 OSDMeasure is a specialized measuring tool for OpenSeadragon that makes taking measurements from OpenSeadragon-compatible images easy
 and fast. 
 
 [Click here to try it out!](https://verrochi92.github.io/axolotl/viewer.html?tileSource=W255B_0)
 
 ## Setup
 
 OSDMeasure is easy to use. First, there are some dependencies:
 
 1. [OpenSeadragon](http://openseadragon.github.io/)
 2. [Fabric.js](http://fabricjs.com/)
 3. [Fabric.js overlay plugin for OpenSeadragon](https://github.com/altert/OpenseadragonFabricjsOverlay)
 4. [Dexie.js](https://dexie.org)

If you download the packaged version, it will include everything needed, as well as a minified source file.
Once the dependencies and plugin are setup, simply include them in the HTML:

`
    <script src="OSDMeasure.js"></script>
`

You will need to instantiate an OpenSeadragon viewer with the following options: 

```
    let viewer = new OpenSeadragon({
        id: "viewer",
        prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
        showNavigator: false,
        tileSources: tileSource,
        sequenceMode: false,
        useCanvas: true,
        preventDefaultAction: true
    });
```

Where `"viewer"` is the id of the HTML element to create the viewer and `tileSource` is the directory to the image to load into the viewer.
Other options can be customized without affecting OSDMeasure. (As far as I know! If you find otherwise, please let me know!) 
The bigger the viewer, the better, especially if using our custom UI, I recommend setting height and width to 100%.
Please see the [OpenSeadragon documentation](http://openseadragon.github.io/docs/) or some of the 
[examples](http://openseadragon.github.io/#examples-and-features) to learn more if you are unfamiliar.

## Usage

Using the viewer, you can instantiate an instance of the plugin, which will add all of the functionality to the viewer.

`
    let plugin = new OSDMeasure(viewer, {});
`

The second argument is an anonymous object containing the options for the plugin. The options available are as folows:

1. `conversionFactor`: Factor to multiply by to convert to real-world units. By default this is 1.
2. `units`: A string used to represent the units, for example, `"um"`. By default this is `"px"`.
3. `measurementColor`: Sets the color to render measurements in. By default this is black, but using he built-in UI, there is an easy way to change colors.
4. `useBuiltInUI`: Generates a built-in UI, including color selection, naming measurements, and buttons for other functionality.

## The UI

Our UI is simple and clean, and is suitable for most purposes if you are using this library. To open the menu, simply click the icon
in the top-right corner. There you will see a color selector, a list of measurements if you've taken any, and some buttons for options
like undo, redo, reset, and export to csv.

## Don't want to use our UI?

That's fine if you want to create your own. There are several keyboard shortcuts that work even if you don't use it. They are as follows:

1. ctrl + z: undo
2. ctrl + y: redo
3. ctrl + s: export csv (will download the file)
4. ctrl + r: reset all measurements (will popup an alert for confirmation)

Measurements can be taken without setting up a UI, but you would want to program these features. Here are some functions to make note of:

1. `undo()`
2. `redo()`
3. `exportCSV()`
4. `clear()` - resets all measurements
5. `setMeasurementColor()` - changes the color measurements are rendered in

