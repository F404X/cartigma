import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const root=new URL("../",import.meta.url);
const source=readFileSync(new URL("map-fallback.js",root),"utf8");
const html=readFileSync(new URL("index.html",root),"utf8");
const style=readFileSync(new URL("styles.css",root),"utf8");
const app=readFileSync(new URL("app.js",root),"utf8");
const bootstrap=readFileSync(new URL("map-bootstrap.js",root),"utf8");
const workflow=readFileSync(new URL(".github/workflows/pages.yml",root),"utf8");

function mockLeaflet(){
  const state={tileUrl:null,controls:0,markers:[],lines:[],polygons:[],groups:[],
    fit:null,events:{},size:{x:440,y:280},pixelsPerDegree:4,centerLng:0};
  const leaflet={
    map(){return {
      on(name,cb){state.events[name]=cb;return this},
      off(name,cb){if(state.events[name]===cb)delete state.events[name];return this},
      getContainer(){return {addEventListener(){}}},
      getSize(){return state.size},
      containerPointToLatLng(point){
        return {lat:0,lng:state.centerLng+(point[0]-state.size.x/2)/state.pixelsPerDegree};
      },
      getZoom(){return 3},
      setView(){return this},
      fitBounds(coords,options){state.fit={coords,options};return this},
      remove(){},
      removeLayer(){}
    }},
    tileLayer(url){state.tileUrl=url;return {addTo(){return this}}},
    control:{zoom(){return {addTo(){state.controls++}}}},
    DomEvent:{disableClickPropagation(){}},
    divIcon(props){return props},
    layerGroup(){
      const group={markers:[],addTo(){state.groups.push(this);return this},
        clearLayers(){this.markers=[];return this}};
      return group;
    },
    marker(coordinate,options){
      const item={coordinate,options,addTo(target){
        if(target?.markers)this.group=target,target.markers.push(this);
        else state.markers.push(this);
        return this;
      },
        getElement(){return {}},
        bindPopup(){return this},
        remove(){state.markers=state.markers.filter(x=>x!==this)}};
      return item;
    },
    polyline(coords,options){return {coords,options,addTo(){state.lines.push(this);return this}}},
    geoJSON(feature,options){return {feature,options,addTo(){state.polygons.push(this);return this}}}
  };
  return {leaflet,state};
}

test("the investigation is vertically stacked in CSS at every breakpoint",()=>{
  assert.match(style,/\.case-columns\s*\{\s*display:grid;\s*grid-template-columns:minmax\(0,1fr\)/);
  assert.match(style,/grid-template-rows:minmax\(0,51%\) minmax\(0,49%\)/);
  assert.match(style,/\.case-columns>\.clue-panel/);
  assert.match(style,/\.case-columns>\.guess-panel/);
  assert.ok(html.indexOf('class="clue-panel"')<html.indexOf('class="guess-panel"'));
});

test("both keyless vector and fallback raster scripts are included in Pages",()=>{
  assert.match(bootstrap,/GeoMapFallback\.ensure/);
  assert.match(bootstrap,/cdn\.jsdelivr\.net/);
  assert.match(app,/switchToFallback/);
  assert.match(app,/mapStyleTimeout/);
  assert.match(app,/typeof libre\.supported==="function"/);
  assert.ok(html.includes('src="map-fallback.js?v=20261116-continent-outline"'));
  assert.match(html,/leaflet@1\.9\.4\/dist\/leaflet\.css/);
  assert.match(workflow,/map-fallback\.js/);
});

test("Leaflet fallback restores map, markers, line and click coordinates",async()=>{
  const {leaflet,state}=mockLeaflet();
  const window={L:leaflet};
  runInNewContext(source,{window,document:{},Promise,Map,queueMicrotask,console});
  const library=await window.GeoMapFallback.ensure();
  assert.equal(library.isFallback,true);
  const map=new library.Map({container:"map",center:[8,15],zoom:1.7,maxZoom:16,minZoom:1.2});
  map.addControl();
  assert.equal(state.tileUrl,"https://tile.openstreetmap.org/{z}/{x}/{y}.png");
  assert.equal(state.controls,1);
  let ready=false;
  map.on("style.load",()=>{ready=true});
  await Promise.resolve();
  assert.ok(ready);
  let click=null;
  map.on("click",event=>click=event.lngLat);
  state.events.click({latlng:{lat:31.63,lng:-7.98}});
  assert.equal(click.lat,31.63);
  assert.equal(click.lng,-7.98);
  const element={outerHTML:'<span class="pin"></span>'};
  const marker=new library.Marker({element,anchor:"bottom"});
  marker.setLngLat([-7.98,31.63]).addTo(map);
  assert.equal(state.markers[0].coordinate[0],31.63);
  assert.equal(state.markers[0].options.icon.iconAnchor[1],32);
  map.addSource("case-distance-line",{data:{geometry:{type:"LineString",coordinates:[[-7.98,31.63],[-7.6,33.5]]}}});
  map.addLayer({id:"case-distance-line",source:"case-distance-line"});
  assert.equal(state.lines.length,1);
  assert.equal(state.lines[0].coords[0][0],31.63);
  const equator={type:"LineString",coordinates:[[-179.9,0],[179.9,0]]};
  map.addSource("case-hemisphere-line",{data:{geometry:equator}});
  map.addLayer({id:"case-hemisphere-line",source:"case-hemisphere-line",type:"line"});
  assert.equal(state.lines[1].options.dashArray,"6 9");
  const strip={type:"Polygon",coordinates:[[[-30,-85],[0,-85],[0,85],[-30,85],[-30,-85]]]};
  map.addSource("case-sector-longitude",{data:{geometry:strip}});
  map.addLayer({id:"case-sector-longitude",source:"case-sector-longitude",type:"fill"});
  assert.equal(state.polygons.length,1);
  assert.equal(state.polygons[0].options.style.fillColor,"#ffd449");
  assert.equal(state.polygons[0].options.style.fillOpacity,0.10);
  map.addLayer({id:"case-hemisphere-arrows",source:"case-hemisphere-line",
    type:"symbol",layout:{"text-field":"↑","symbol-spacing":88}});
  assert.equal(state.polygons.length,1);
  const group=state.groups[0];
  assert.ok(group.markers.length>=4);
  const arrowsBefore=group.markers.map(p=>p.coordinate[1]);
  assert.ok(group.markers.every(marker=>
    marker.coordinate[0]===0&&marker.options.icon.html==="↑"&&
    marker.options.icon.iconAnchor[1]===20&&marker.options.interactive===false));
  // Simulate a much closer zoom: geographic longitudes change, but screen
  // spacing, glyph dimensions and pixel offset from the Equator remain fixed.
  state.pixelsPerDegree=18;
  state.events.zoomstart();
  assert.equal(group.markers.length,0,
    "Arrows should disappear instantly at the start of a zoom");
  state.events.zoomend();
  const arrowsAfter=group.markers.map(p=>p.coordinate[1]);
  assert.equal(arrowsAfter.length,arrowsBefore.length);
  assert.notDeepEqual(arrowsAfter,arrowsBefore);
  const projected=group.markers.map(p=>
    Math.round(state.size.x/2+(p.coordinate[1]-state.centerLng)*state.pixelsPerDegree));
  assert.deepEqual(projected,[44,132,220,308,396]);
  state.centerLng=65;
  state.events.moveend();
  assert.deepEqual(group.markers.map(p=>
    Math.round(state.size.x/2+(p.coordinate[1]-state.centerLng)*state.pixelsPerDegree)),
    projected);
  map.removeLayer("case-hemisphere-arrows");
  assert.equal(state.events.zoomend,undefined);
  assert.equal(state.events.moveend,undefined);
  assert.equal(state.events.zoomstart,undefined);
  assert.equal(state.events.movestart,undefined);
  map.addLayer({id:"case-hemisphere-arrows",source:"case-hemisphere-line",
    type:"symbol",layout:{"text-field":"↓","symbol-spacing":88}});
  assert.ok(state.groups.at(-1).markers.every(p=>p.options.icon.html==="↓"&&
    p.options.icon.iconAnchor[1]===-2));
  const outline={type:"MultiPolygon",coordinates:[
    [[[-2,1],[-1,1],[-1,2],[-2,2],[-2,1]]]
  ]};
  map.addSource("case-continent-outline",{data:{geometry:outline}});
  map.addLayer({id:"case-continent-outline",source:"case-continent-outline",type:"line"});
  const coast=state.polygons.at(-1);
  assert.equal(coast.options.style.fill,false);
  assert.equal(coast.options.style.fillOpacity,0);
  assert.equal(coast.options.style.opacity,0.28);
  assert.equal(coast.options.style.color,"#ffd449");
  map.fitBounds([[-8,31],[-7,34]],{maxZoom:5,padding:{top:20,bottom:20,left:30,right:30}});
  assert.equal(state.fit.options.maxZoom,5);
  marker.remove();
  assert.equal(state.markers.length,0);
});
