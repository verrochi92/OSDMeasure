class DexieWrapper{db;plugin;constructor(e){this.plugin=e,this.db=new Dexie("database"),this.db.version(2).stores({measurements:`
                id,
                image,
                p1x, p1y,
                p2x, p2y,
                name,
                color`}),this.db.open()}clear(){this.db.measurements.clear()}async getAllMeasurements(){let e=[],t=await this.db.measurements.where("image").equals(this.plugin.viewer.tileSources).toArray();for(let s=0;s<t.length;s++)e.push(new Measurement(new Point(t[s].p1x,t[s].p1y,t[s].color,this.plugin.fabricCanvas),new Point(t[s].p2x,t[s].p2y,t[s].color,this.plugin.fabricCanvas),t[s].name,t[s].color,this.plugin.conversionFactor,this.plugin.units,this.plugin.fabricCanvas));return e}removeMeasurement(e){this.db.measurements.delete(e.id)}saveAll(e){for(let t=0;t<e.length;t++)this.saveMeasurement(e[t])}saveMeasurement(e){this.db.measurements.put({id:e.id,image:this.plugin.viewer.tileSources,p1x:e.p1.x,p1y:e.p1.y,p2x:e.p2.x,p2y:e.p2.y,name:e.name,color:e.color})}}class OSDMeasure{viewer;overlay;fabricCanvas;db;isMeasuring;useBuiltInUI;measurements;p1;p2;redoStack;conversionFactor;measurementColor;menuOptions;units;constructor(e,t={}){this.viewer=e,this.processOptions(t),this.overlay=e.fabricjsOverlay(),this.fabricCanvas=this.overlay.fabricCanvas(),this.viewer.gestureSettingsMouse.clickToZoom=!1,this.viewer.gestureSettingsTouch.clickToZoom=!1,this.isMeasuring=!1,this.p1=null,this.p2=null,this.measurements=[],this.redoStack=[],this.db=new DexieWrapper(this),this.viewer.addHandler("canvas-double-click",e=>{this.addMeasurement(e),e.quick||(e.preventDefaultAction=!0)}),this.viewer.addHandler("zoom",this.adjustToZoom.bind(this)),this.viewer.addHandler("rotate",()=>{this.viewer.viewport.rotateTo(0)}),document.addEventListener("keydown",e=>{this.handleKeyPress(e)}),this.loadFromLocalStorage()}addMeasurement(e){let t=e.position,s=this.viewer.viewport.pointFromPixel(t),i=this.viewer.viewport.viewportToImageCoordinates(s),n=this.viewer.viewport.getZoom();if(this.isMeasuring){this.p2=new Point(i.x,i.y,this.measurementColor,this.fabricCanvas),this.p2.render(n);let r=new Measurement(this.p1,this.p2,`M${this.measurements.length+1}`,this.measurementColor,this.conversionFactor,this.units,this.fabricCanvas);r.render(n),this.measurements.push(r),r.id=this.measurements.length-1,this.saveInLocalStorage(),document.dispatchEvent(new Event("measurement-added"))}else this.p1=new Point(i.x,i.y,this.measurementColor,this.fabricCanvas),this.p1.render(n);this.redoStack=[],this.isMeasuring=!this.isMeasuring}adjustToZoom(){let e=this.viewer.viewport.getZoom();for(let t=0;t<this.measurements.length;t++)this.measurements[t].adjustToZoom(e);null!=this.p1&&this.p1.adjustToZoom(e),null!=this.p2&&this.p2.adjustToZoom(e)}clear(){this.db.clear();for(let e=0;e<this.measurements.length;e++)this.measurements[e].remove();this.measurements=[],this.redoStack=[],this.isMeasuring&&this.p1.remove(),this.p1=null,this.p2=null,this.isMeasuring=!1,document.dispatchEvent(new Event("measurements-reset"))}exportCSV(){let e=e=>[e.name,e.p1.toString(),e.p2.toString(),e.toString()],t=[["Name","Point 1","Point 2","Distance"]];for(let s=0;s<this.measurements.length;s++)t.push(e(this.measurements[s]));let i=encodeURI("data:text/csv;charset=utf-8,"+t.map(e=>e.join(",")).join("\n")),n=document.createElement("a");n.setAttribute("href",i),n.setAttribute("download","measurements.csv"),document.body.appendChild(n),n.click(),document.body.removeChild(n)}handleKeyPress(e){e.ctrlKey&&"r"==e.key?window.confirm("Are you sure you want to reset all measurements and annotations?")&&this.clear():e.ctrlKey&&"z"==e.key?this.undo():e.ctrlKey&&"y"==e.key?this.redo():e.ctrlKey&&"s"==e.key&&this.exportCSV(),e.ctrlKey&&e.preventDefault()}async loadFromLocalStorage(){this.measurements=await this.db.getAllMeasurements(),this.setMeasurementColor(localStorage.getItem("color")),document.dispatchEvent(new Event("data-loaded")),this.renderAllMeasurements()}processOptions(e){e.conversionFactor?this.conversionFactor=e.conversionFactor:this.conversionFactor=1,e.units?this.units=e.units:this.units="px",e.measurementColor?this.measurementColor=e.measurementColor:this.measurementColor="#000000",e.useBuiltInUI&&new UI(this).addToDocument()}redo(){if(this.redoStack.length>0){let e=this.redoStack.pop(),t=this.viewer.viewport.getZoom();e instanceof Point?(this.p1=e,this.p1.render(t),this.isMeasuring=!0):(this.measurements.push(e),e.id=measurements.length-1,e.p1.render(t),e.p2.render(t),e.render(t),this.saveInLocalStorage(),document.dispatchEvent(new Event("measurement-added")))}}renderAllMeasurements(){let e=this.viewer.viewport.getZoom();for(let t=0;t<this.measurements.length;t++)this.measurements[t].p1.render(e),this.measurements[t].p2.render(e),this.measurements[t].render(e);this.isMeasuring&&null!=this.p1&&this.p1.render(e)}saveInLocalStorage(){this.db.saveAll(this.measurements),localStorage.setItem("color",this.measurementColor)}setMeasurementColor(e){this.measurementColor=e,this.isMeasuring&&(this.p1.color=this.measurementColor,this.p1.fabricObject.fill=this.measurementColor,this.fabricCanvas.renderAll()),this.saveInLocalStorage()}undo(){if(this.isMeasuring)this.redoStack.push(this.p1),this.p1.remove(),this.p1=null,this.isMeasuring=!this.isMeasuring;else if(this.measurements.length>0){let e=this.measurements.pop();e.remove(),this.redoStack.push(e),this.db.removeMeasurement(e),this.saveInLocalStorage(),document.dispatchEvent(new Event("measurement-removed"))}}}class Measurement{id;p1;p2;name;color;distance;conversionFactor;units;fabricCanvas;line;textObject;constructor(e,t,s,i,n,r,o){this.p1=e,this.p2=t,this.name=s,this.color=i,this.distance=Math.sqrt(Math.pow(this.p2.x-this.p1.x,2)+Math.pow(this.p2.y-this.p1.y,2)),this.conversionFactor=n,this.units=r,this.distance*=n,this.fabricCanvas=o}adjustToZoom(e){this.p1.adjustToZoom(e),this.p2.adjustToZoom(e),this.line.strokeWidth=50/e,this.textObject.fontSize=300/e,this.textObject.left=Math.max(this.p1.x,this.p2.x)+100/e}remove(){this.p1.remove(),this.p2.remove(),this.fabricCanvas.remove(this.line),this.fabricCanvas.remove(this.textObject)}render(e){this.line=new fabric.Line([this.p1.x,this.p1.y,this.p2.x,this.p2.y],{originX:"center",originY:"center",stroke:this.color,strokeWidth:50/e}),this.fabricCanvas.add(this.line);let t=this.distance.toFixed(3)+" "+this.units;this.textObject=new fabric.Text(t,{left:Math.max(this.p1.x,this.p2.x)+100/e,top:this.p1.x>this.p2.x?this.p1.y:this.p2.y,fontSize:300/e,fill:this.color}),this.fabricCanvas.add(this.textObject)}}class Point{x;y;color;fabricCanvas;fabricObject;constructor(e,t,s,i){this.x=e,this.y=t,this.color=s,this.fabricCanvas=i,this.fabricObject=new fabric.Circle({originX:"center",originY:"center",left:this.x,top:this.y,fill:this.color,radius:150})}adjustToZoom(e){this.fabricObject.setRadius(150/(1.5*e))}remove(){this.fabricCanvas.remove(this.fabricObject)}render(e){this.adjustToZoom(e),this.fabricCanvas.add(this.fabricObject)}}class ButtonBar{plugin;element;undoButton;redoButton;resetButton;exportButton;constructor(e){this.plugin=e,this.element=document.createElement("div"),this.undoButton=document.createElement("input"),this.undoButton.setAttribute("type","button"),this.undoButton.setAttribute("value","undo (ctrl + z)"),this.setButtonStyle(this.undoButton),this.undoButton.addEventListener("click",()=>{this.plugin.undo()}),this.element.appendChild(this.undoButton),this.redoButton=document.createElement("input"),this.redoButton.setAttribute("type","button"),this.redoButton.setAttribute("value","redo (ctrl + y)"),this.setButtonStyle(this.redoButton),this.redoButton.addEventListener("click",()=>{this.plugin.redo()}),this.element.appendChild(this.redoButton),this.resetButton=document.createElement("input"),this.resetButton.setAttribute("type","button"),this.resetButton.setAttribute("value","reset (ctrl + r)"),this.setButtonStyle(this.resetButton),this.resetButton.addEventListener("click",()=>{window.confirm("Are you sure you want to reset all measurements and annotations?")&&this.plugin.clear()}),this.element.appendChild(this.resetButton),this.exportButton=document.createElement("input"),this.exportButton.setAttribute("type","button"),this.exportButton.setAttribute("value","export csv (ctrl + s)"),this.setButtonStyle(this.exportButton),this.exportButton.addEventListener("click",()=>{this.plugin.exportCSV()}),this.element.appendChild(this.exportButton)}setButtonStyle(e){let t=e.style;t.setProperty("color","white"),t.setProperty("background-color","black"),t.setProperty("width","100%"),t.setProperty("height","25px")}}class MeasurementList{plugin;element;listItems=[];constructor(e){this.plugin=e,this.element=document.createElement("ul"),this.element.style.setProperty("list-style","none"),document.addEventListener("measurement-added",this.addLatestMeasurement.bind(this)),document.addEventListener("measurement-removed",this.removeLatestMeasurement.bind(this)),document.addEventListener("measurements-reset",this.resetMeasurements.bind(this)),document.addEventListener("data-loaded",this.addAllMeasurements.bind(this))}addAllMeasurements(){for(let e=0;e<this.plugin.measurements.length;e++){let t=this.plugin.measurements[e],s=new MeasurementListItem(this.plugin,t);this.listItems.push(s),this.element.appendChild(s.element)}}addLatestMeasurement(){let e=this.plugin.measurements[this.plugin.measurements.length-1],t=new MeasurementListItem(this.plugin,e);this.listItems.push(t),this.element.appendChild(t.element)}addToDocument(){document.appendChild(this.element),this.plugin.viewer.element.appendChild(this.element)}removeLatestMeasurement(){this.element.removeChild(this.listItems.pop().element)}resetMeasurements(){for(let e=0;e<this.listItems.length;e++)this.element.removeChild(this.listItems[e].element);this.listItems=[]}}class MeasurementListItem{plugin;measurement;element;nameField;lengthDisplay;constructor(e,t){this.plugin=e,this.measurement=t,this.element=document.createElement("li"),this.nameField=document.createElement("input"),this.nameField.setAttribute("type","text"),this.nameField.value=this.measurement.name,this.nameField.addEventListener("input",this.updateName.bind(this)),this.setNameFieldStyle(),this.element.appendChild(this.nameField),this.lengthDisplay=document.createElement("span"),this.lengthDisplay.innerText=`: ${this.measurement.distance.toFixed(3)} ${this.measurement.units}`,this.element.appendChild(this.lengthDisplay)}setNameFieldStyle(){let e=this.nameField.style;e.setProperty("background","transparent"),e.setProperty("border","none"),e.setProperty("color","white"),e.setProperty("text-align","right"),e.setProperty("width","50%")}updateName(){this.measurement.name=this.nameField.value,this.plugin.saveInLocalStorage()}}class Menu{plugin;element;colorSelector;measurementList;buttonBar;constructor(e){this.plugin=e,this.element=document.createElement("div"),this.element.setAttribute("hidden","hidden"),this.setMenuStyle(),this.colorSelector=document.createElement("input"),this.colorSelector.setAttribute("type","color"),this.colorSelector.addEventListener("change",this.handleColorChange.bind(this),!1),this.setColorSelectorStyle(),this.element.appendChild(this.colorSelector),this.measurementList=new MeasurementList(this.plugin),this.element.appendChild(this.measurementList.element),this.buttonBar=new ButtonBar(this.plugin),this.element.appendChild(this.buttonBar.element),document.addEventListener("data-loaded",this.updateColor.bind(this))}addToDocument(){document.body.appendChild(this.element),this.plugin.viewer.element.appendChild(this.element)}handleColorChange(){let e=this.colorSelector.value;this.plugin.setMeasurementColor(e)}setColorSelectorStyle(){let e=this.colorSelector.style;e.setProperty("width","100%"),e.setProperty("height","30px"),e.setProperty("border","none"),e.setProperty("padding","0px")}setMenuStyle(){let e=this.element.style;e.setProperty("position","absolute"),e.setProperty("text-align","left"),e.setProperty("top","10%"),e.setProperty("right","0%"),e.setProperty("z-index","2"),e.setProperty("width","20%"),e.setProperty("padding","1%"),e.setProperty("background","rgba(0, 0, 0, 0.75)"),e.setProperty("color","white")}updateColor(){let e=this.plugin.measurementColor;this.colorSelector.value=e,this.plugin.setMeasurementColor(e)}}class MenuButton{plugin;element;constructor(e){this.plugin=e,this.element=document.createElement("img"),this.element.setAttribute("tabindex","0"),this.element.setAttribute("src","img/hamburger-50.png"),this.setupStyle()}addToDocument(){document.body.appendChild(this.element),this.plugin.viewer.element.appendChild(this.element)}setupStyle(){let e=this.element.style;e.setProperty("background-color","white"),e.setProperty("position","absolute"),e.setProperty("top","0%"),e.setProperty("right","0%"),e.setProperty("z-index","1"),e.setProperty("cursor","pointer")}}class UI{plugin;menuButton;menu;constructor(e,t={}){this.plugin=e,this.setBodyStyle(),this.menuButton=new MenuButton(e,t),this.menu=new Menu(e,t),this.menuButton.element.addEventListener("click",this.toggleMenu.bind(this))}addToDocument(){this.menuButton.addToDocument(),this.menu.addToDocument()}toggleMenu(){"hidden"==this.menu.element.getAttribute("hidden")?this.menu.element.removeAttribute("hidden"):this.menu.element.setAttribute("hidden","hidden")}setBodyStyle(){let e=document.body.style;e.setProperty("overflow","hidden","important"),e.setProperty("background-color","black"),e.setProperty("font-size","0.9em")}}