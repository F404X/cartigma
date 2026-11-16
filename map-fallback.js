/* GeoDetective offline-friendly map engine fallback.
   Leaflet uses public OpenStreetMap tiles when WebGL or the vector map fails.
   No API key or extra account is required. */
(() => {
  "use strict";
  let loading = null;
  let adapter = null;
  const sources = [
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  ];
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = url;
      el.async = true;
      el.onload = resolve;
      el.onerror = () => reject(new Error("Leaflet CDN unavailable"));
      document.head.appendChild(el);
    });
  }
  async function ensure() {
    if(window.L)return adapter||(adapter=createAdapter(window.L));
    if(!loading)loading=(async()=>{
      for(const url of sources) {
        try{await loadScript(url);if(window.L)break;}catch(error){console.warn(error);}
      }
      if(!window.L)throw new Error("Neither Leaflet provider is available");
      return adapter||(adapter=createAdapter(window.L));
    })();
    try{return await loading;}catch(error){loading=null;throw error;}
  }
  function createAdapter(L) {
    class MapAdapter {
      constructor(options) {
        this.root = L.map(options.container,{center:[options.center[1],options.center[0]],
          zoom:options.zoom,minZoom:options.minZoom,maxZoom:options.maxZoom,worldCopyJump:true,
          zoomControl:false,doubleClickZoom:false,preferCanvas:true});
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
          maxZoom:19,
          attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
        }).addTo(this.root);
        this._sources = new Map();
        this._layers = new Map();
        this._layerCleanups = new Map();
      }
      addControl() {L.control.zoom({position:"bottomleft"}).addTo(this.root);return this;}
      on(type,callback) {
        if(type==="style.load") {queueMicrotask(callback);return this;}
        const adapted=type==="click"
          ?event=>callback({lngLat:{lng:event.latlng.lng,lat:event.latlng.lat},originalEvent:event.originalEvent})
          :callback;
        this.root.on(type,adapted);
        return this;
      }
      getCanvas(){return this.root.getContainer();}
      getStyle(){return {layers:[]};}
      setLayoutProperty(){}
      getZoom(){return this.root.getZoom();}
      resize(){this.root.invalidateSize({pan:false});return this;}
      getCenter(){const c=this.root.getCenter();return {lng:c.lng,lat:c.lat};}
      easeTo(opts){
        this.root.setView([opts.center[1],opts.center[0]],opts.zoom||this.root.getZoom(),{animate:true});
        return this;
      }
      fitBounds(bounds,opts={}){
        const p=opts.padding||{};
        this.root.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]],
          {animate:true,maxZoom:opts.maxZoom,paddingTopLeft:[p.left||0,p.top||0],
            paddingBottomRight:[p.right||0,p.bottom||0]});
        return this;
      }
      getLayer(id){return this._layers.get(id)||null;}
      getSource(id){return this._sources.get(id)||null;}
      addSource(id,source){this._sources.set(id,source);}
      removeSource(id){this._sources.delete(id);}
      addLayer(layer){
        const geo=this._sources.get(layer.source)?.data?.geometry;
        if(layer.id==="case-hemisphere-arrows"&&layer.type==="symbol"
          &&geo?.type==="LineString"){
          const group=L.layerGroup().addTo(this.root);
          const north=layer.layout?.["text-field"]!=="↓";
          const glyph=north?"↑":"↓";
          const icon=L.divIcon({
            className:"hemisphere-direction-arrow",html:glyph,
            iconSize:[18,18],iconAnchor:[9,north?20:-2]
          });
          const hide=()=>group.clearLayers();
          const update=()=>{
            group.clearLayers();
            const size=this.root.getSize();
            if(!size||!Number.isFinite(size.x)||size.x<=0)return;
            // Project viewport X coordinates to longitude. Every arrow remains
            // the same pixel size and approx. 88px apart at ANY zoom level.
            for(let x=44;x<size.x-16;x+=88){
              const lng=this.root.containerPointToLatLng([x,size.y/2]).lng;
              L.marker([0,lng],{icon,interactive:false,keyboard:false}).addTo(group);
            }
          };
          this._layers.set(layer.id,group);
          this._layerCleanups.set(layer.id,()=>{
            this.root.off("zoomstart",hide);
            this.root.off("movestart",hide);
            this.root.off("zoomend",update);
            this.root.off("moveend",update);
          });
          this.root.on("zoomstart",hide);
          this.root.on("movestart",hide);
          this.root.on("zoomend",update);
          this.root.on("moveend",update);
          update();
        }else if(geo?.type==="LineString"){
          const line=L.polyline(geo.coordinates.map(point=>[point[1],point[0]]),{
            color:"#ffd449",weight:2,opacity:.85,
            dashArray:layer.id==="case-hemisphere-line"?"6 9":"5 7"
          }).addTo(this.root);
          this._layers.set(layer.id,line);
        }else if(geo?.type==="Polygon"||geo?.type==="MultiPolygon"){
          const outline=layer.id==="case-continent-outline"&&layer.type==="line";
          const style=outline?
            {color:"#ffd449",weight:1.7,opacity:.28,fill:false,
              fillOpacity:0,interactive:false}:
            {color:"#ffd449",weight:1,opacity:.45,fillColor:"#ffd449",
              fillOpacity:0.10,interactive:false};
          const polygon=L.geoJSON({type:"Feature",properties:{},geometry:geo},{
            style
          }).addTo(this.root);
          this._layers.set(layer.id,polygon);
        }
      }
      removeLayer(id){
        this._layerCleanups.get(id)?.();
        this._layerCleanups.delete(id);
        const layer=this._layers.get(id);
        if(layer)this.root.removeLayer(layer);
        this._layers.delete(id);
      }
      remove(){
        for(const id of [...this._layers.keys()])this.removeLayer(id);
        this.root.remove();
      }
    }
    class Marker {
      constructor(options){this.element=options.element;this.coordinate=[0,0];}
      setLngLat(position){this.coordinate=position;return this;}
      addTo(map){
        const html=this.element.outerHTML;
        const icon=L.divIcon({
          html,className:"geodetective-leaflet-pin",iconSize:[24,32],iconAnchor:[12,32]
        });
        this.root=L.marker([this.coordinate[1],this.coordinate[0]],{icon}).addTo(map.root);
        if(this.root.getElement())L.DomEvent.disableClickPropagation(this.root.getElement());
        return this;
      }
      setPopup(popup){
        if(this.root&&popup.node)this.root.bindPopup(popup.node);
        return this;
      }
      remove(){if(this.root){this.root.remove();this.root=null;}return this;}
    }
    class Popup {
      setDOMContent(element){this.node=element;return this;}
    }
    return {Map:MapAdapter,Marker,Popup,NavigationControl:class{},supported(){return true;},
      isFallback:true};
  }
  window.GeoMapFallback={ensure};
})();
