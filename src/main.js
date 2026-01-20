// main.js
import './style.css'; // Import your CSS (see Step 3)
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; // CRITICAL: Import MapLibre styles
import { Protocol } from 'pmtiles';

import { MapboxOverlay as deckMapboxOverlay } from '@deck.gl/mapbox';

import { generateGraticuleLines } from './graticule.js';

import { MathLayerControl } from './mathLayerControl.js';
import { ProjectionControl } from './projectionControl.js';
import { BitmapControl, NativeBitmapControl } from './bitmapLayerControl.js';

// 1. Initiate the PMTiles Protocol
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// 2. Initialize the Map
const map = new maplibregl.Map({
    container: 'map', // The ID of the div in index.html

    style: {
        version: 8,
        // projection: { type: 'globe' },
        sources: {
            'my-local-source': {
                type: 'vector',
                // Notice the pmtiles:// protocol
                url: 'pmtiles://http://localhost:8080/map-china.pmtiles'
            }
        },
        layers: [
            {
                id: 'simple-fill0',
                source: 'my-local-source',
                'source-layer': 'china', // MUST match the layer name inside your PMTiles!
                type: 'line'
            },
            {
                id: 'simple-fill1',
                source: 'my-local-source',
                'source-layer': 'provinces_boundary', // MUST match the layer name inside your PMTiles!
                type: 'line'
            },
            {
                id: 'simple-fill2',
                source: 'my-local-source',
                'source-layer': 'provinces', // MUST match the layer name inside your PMTiles!
                /*
                type: 'fill',
                paint: {
                    'fill-color': '#0080ff',
                    'fill-opacity': 0.5
                }
                */
                type: 'line',
                paint: {
                    'line-color': '#213f5e',
                    'line-width': 1,
                    'line-opacity': 0.3
                }
            },
            {
                id: 'simple-fill3',
                source: 'my-local-source',
                'source-layer': 'citys', // MUST match the layer name inside your PMTiles!
                type: 'line',
                paint: {
                    'line-color': '#363a3d',
                    'line-width': 1,
                    'line-opacity': 0.5
                }
            }
        ]
    },
    center: [112, 34],
    zoom: 5
});

map.addControl(new maplibregl.NavigationControl());

// Optional: specific event for when the zoom completely stops
map.on('zoomend', () => {
    console.log('Zoom Finished at:', map.getZoom());
});

function addGraticuleLines() {
    const graticule = generateGraticuleLines(10);
    // 2. Add the Source
    map.addSource('graticule-source', {
        type: 'geojson',
        data: graticule
    });

    // 3. Add the Layer
    /*
    MapLibre's addLayer expects a static JSON configuration object (a "style spec") 
    that describes how to render data. 
    It looks for properties like "id", "source", "type" (e.g., fill, line, symbol), and "paint".
    */
    map.addLayer({
        id: 'graticule-layer',
        type: 'line',
        source: 'graticule-source',
        paint: {
            'line-color': '#888',   // Gray lines
            'line-width': 0.5,      // Thin lines
            'line-opacity': 0.5
        }
    });

    // Optional: Add Labels for the lines
    map.addLayer({
        id: 'graticule-labels',
        type: 'symbol',
        source: 'graticule-source',
        layout: {
            'text-field': ['get', 'value'], // Display the degrees
            'text-size': 10,
            'symbol-placement': 'line',
            'text-max-angle': 30
        },
        paint: {
            'text-color': '#888',
            'text-halo-color': '#fff',
            'text-halo-width': 1
        }
    });
}

// 2. Setup Overlay (Starts Empty)
const deckOverlay = new deckMapboxOverlay({
    interleaved: true,
    layers: []
});

// 3. Add Your Custom Control
// Pass the overlay instance AND the 'deck' object (so it can create layers)
const mathControl = new MathLayerControl(deckOverlay);
map.addControl(mathControl, 'top-right');

const projectionControl = new ProjectionControl(map);
map.addControl(projectionControl, 'top-right');

const deckOverlayBitmap = new deckMapboxOverlay({
    interleaved: true,
    layers: []
});

const bitmapControl = new BitmapControl(deckOverlayBitmap);
//map.addControl(bitmapControl, 'top-right');

map.on('load', () => {
    addGraticuleLines();

    /* CRITICAL: Add the Deck.GL layer as a Control 
    deck.MapboxOverlay is a Control (Plugin) The MapboxOverlay class is designed as an IControl. 
    In MapLibre/Mapbox, a "Control" is usually a UI element (like zoom buttons or the compass), 
    but it is also the interface for plugins to hook into the map's lifecycle.
    */
    //map.addControl(deckOverlay);
    //map.addControl(deckOverlayBitmap);

    // Add the native control
    const nativeControl = new NativeBitmapControl();
    map.addControl(nativeControl, 'top-right');
})