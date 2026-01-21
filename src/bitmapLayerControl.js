import { BitmapLayer as deckBitmapLayer } from '@deck.gl/layers';

// CONFIGURATION
const RESOLUTION = 1000; // 1000x1000 grid
const BOUNDS = [102.0, 24.0, 113.0, 35.0]; // [minLon, minLat, maxLon, maxLat]

// HELPER: Convert Bounds to MapLibre 4-Corner Quad (TL, TR, BR, BL)
const COORDINATES_QUAD = [
    [BOUNDS[0], BOUNDS[3]], // Top Left  (minLon, maxLat)
    [BOUNDS[2], BOUNDS[3]], // Top Right (maxLon, maxLat)
    [BOUNDS[2], BOUNDS[1]], // Bottom Right (maxLon, minLat)
    [BOUNDS[0], BOUNDS[1]]  // Bottom Left  (minLon, minLat)
];
// ---------------------------------------------------------
// 1. MATH FUNCTIONS (Pure Logic)
// ---------------------------------------------------------
const mathFunctions = {
    sombrero: (x, y) => {
        const r = Math.sqrt(x * x + y * y);
        return r === 0 ? 1.0 : Math.sin(r) / r;
    },
    cassini: (x, y) => {
        const a = 1.0;
        const d1sq = (x + a) ** 2 + y ** 2;
        const d2sq = (x - a) ** 2 + y ** 2;
        return Math.sqrt(d1sq * d2sq);
    },
    monkey: (x, y) => {
        return (x ** 3) - (3 * x * y ** 2);
    }
};

// ---------------------------------------------------------
// 2. COLOR SCALES (Map Z-value to RGBA)
// ---------------------------------------------------------
const colorScales = {
    // Blue (-0.2) -> White (0) -> Red (1.0)
    sombrero: (z) => {
        if (z < 0) return [0, 100, 255, 200]; // Blue
        if (z < 0.2) return [255, 255, 255, 100]; // White/Clear
        if (z < 0.5) return [255, 200, 0, 200]; // Orange
        return [255, 0, 0, 255]; // Red
    },
    // Blue (separate) -> White (touching) -> Red (merged)
    cassini: (z) => {
        if (z < 0.95) return [0, 200, 255, 180]; // Cyan
        if (z < 1.05) return [255, 255, 255, 255]; // White Border
        if (z < 1.5) return [255, 100, 0, 200]; // Orange
        return [150, 0, 0, 255]; // Dark Red
    },
    // Indigo (Valley) -> Gray (Flat) -> Gold (Ridge)
    monkey: (z) => {
        if (z < -1.0) return [75, 0, 130, 220]; // Deep Purple
        if (z < -0.2) return [0, 0, 255, 150];  // Blue
        if (z < 0.2) return [200, 200, 200, 50]; // Transparent Gray
        if (z < 1.0) return [255, 200, 0, 150]; // Gold
        return [255, 255, 0, 220]; // Yellow
    }
};

// HELPER: Paint to the hidden canvas
function paintCanvas(canvas, type) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(RESOLUTION, RESOLUTION);
    const data = imgData.data;

    // Limits for math space
    const limits = { sombrero: 15, cassini: 2.5, monkey: 2.0 };
    const bound = limits[type];
    const step = (bound * 2) / RESOLUTION;

    let idx = 0;
    for (let py = 0; py < RESOLUTION; py++) {
        const y = -bound + (py * step); // Flip Y if needed, but here simple mapping
        for (let px = 0; px < RESOLUTION; px++) {
            const x = -bound + (px * step);
            const z = mathFunctions[type](x, y);
            const [r, g, b, a] = colorScales[type](z);

            data[idx++] = r;
            data[idx++] = g;
            data[idx++] = b;
            data[idx++] = a;
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function generateBitmap(type) {
    const canvas = document.createElement('canvas');
    canvas.width = RESOLUTION;
    canvas.height = RESOLUTION;
    const ctx = canvas.getContext('2d');

    // Get raw pixel buffer (High Performance)
    const imgData = ctx.createImageData(RESOLUTION, RESOLUTION);
    const data = imgData.data; // Uint8ClampedArray [r, g, b, a, r, g, b, a...]

    // Math bounds
    const mathBounds = { sombrero: 15, cassini: 2.5, monkey: 2.0 };
    const limit = mathBounds[type];

    // Pre-calculate step to map 0..999 pixel coordinates to -limit..+limit
    const step = (limit * 2) / RESOLUTION;

    let pixelIndex = 0;

    // Loop Y then X (Standard row-major order)
    for (let py = 0; py < RESOLUTION; py++) {
        // Map pixel Y to Math Y (flip Y because canvas 0 is top)
        const y = -limit + (py * step);

        for (let px = 0; px < RESOLUTION; px++) {
            const x = -limit + (px * step);

            // 1. Calculate Z
            const z = mathFunctions[type](x, y);

            // 2. Map to Color
            const [r, g, b, a] = colorScales[type](z);

            // 3. Write to Pixel Buffer
            data[pixelIndex + 0] = r;
            data[pixelIndex + 1] = g;
            data[pixelIndex + 2] = b;
            data[pixelIndex + 3] = a;

            pixelIndex += 4;
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
}

class BitmapControl {
    constructor(deckOverlay) {
        this.deckOverlay = deckOverlay;
    }

    onAdd(map) {
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = 'white';

        const title = document.createElement('div');
        title.innerText = "High-Res Bitmap (1k)";
        title.style.fontWeight = 'bold';
        this.container.appendChild(title);

        ['sombrero', 'cassini', 'monkey'].forEach((id, idx) => {
            const wrapper = document.createElement('div');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'bitmap_layer';
            radio.id = id;
            radio.checked = idx === 0;

            radio.addEventListener('change', () => this.updateLayer(id));

            const label = document.createElement('label');
            label.htmlFor = id;
            label.innerText = id.charAt(0).toUpperCase() + id.slice(1);
            label.style.marginLeft = '5px';

            wrapper.appendChild(radio);
            wrapper.appendChild(label);
            this.container.appendChild(wrapper);
        });

        // Initial Load
        this.updateLayer('sombrero');
        return this.container;
    }

    onRemove() {
        this.container.remove();
    }

    updateLayer(type) {
        // 1. Generate the 1000x1000 Image
        const canvasImage = generateBitmap(type);

        // 2. Create BitmapLayer
        const layer = new deckBitmapLayer({
            id: 'math-bitmap',
            bounds: BOUNDS, // [112.0, 34.0, 113.0, 35.0]
            image: canvasImage,
            opacity: 0.8,
            // Smoothes the pixels so it doesn't look like Minecraft
            textureParameters: {
                minFilter: 'linear',
                magFilter: 'linear'
            }
        });

        // 3. Update Deck
        this.deckOverlay.setProps({ layers: [layer] });
    }
}

class NativeBitmapControl {
    onAdd(map) {
        this.map = map;
        this.canvasID = 'native-math-canvas';

        // 1. Create Hidden Canvas (The Data Source)
        this.canvas = document.createElement('canvas');
        this.canvas.id = this.canvasID;
        this.canvas.width = RESOLUTION;
        this.canvas.height = RESOLUTION;
        this.canvas.style.display = 'none'; // Keep it hidden
        document.body.appendChild(this.canvas);

        // 2. Initial Paint (Default to Sombrero)
        paintCanvas(this.canvas, 'sombrero');

        // 3. Add Source & Layer to Map immediately
        // Note: animate: false stops the browser from redrawing this canvas 60fps
        this.map.addSource('math-source', {
            type: 'canvas',
            canvas: this.canvasID,
            coordinates: COORDINATES_QUAD,
            animate: false
        });

        this.map.addLayer({
            id: 'math-layer',
            type: 'raster',
            source: 'math-source',
            paint: {
                'raster-opacity': 0.8,
                'raster-resampling': 'linear' // Smooths the pixels
            }
        });

        // 4. Create UI
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = 'white';

        const title = document.createElement('div');
        title.innerText = "Native Raster Source";
        title.style.fontWeight = 'bold';
        this.container.appendChild(title);

        ['sombrero', 'cassini', 'monkey'].forEach((id, idx) => {
            const wrapper = document.createElement('div');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'native_bitmap';
            radio.id = 'native_' + id;
            radio.checked = idx === 0;

            // On Change: Repaint Canvas -> Trigger Map Update
            radio.addEventListener('change', () => this.updateCanvas(id));

            const label = document.createElement('label');
            label.htmlFor = 'native_' + id;
            label.innerText = id.charAt(0).toUpperCase() + id.slice(1);
            label.style.marginLeft = '5px';

            wrapper.appendChild(radio);
            wrapper.appendChild(label);
            this.container.appendChild(wrapper);
        });

        return this.container;
    }

    onRemove() {
        // Cleanup DOM and Map
        this.container.remove();
        this.map.removeLayer('math-layer');
        this.map.removeSource('math-source');
        document.getElementById(this.canvasID).remove();
        this.map = undefined;
    }

    updateCanvas(type) {
        // 1. Repaint the pixel data on the hidden canvas
        paintCanvas(this.canvas, type);

        // 2. Critical Step for animate: false
        // Since the loop is paused, the map doesn't know the canvas changed pixels.
        // We must manually trigger a repaint of the map source.
        const source = this.map.getSource('math-source');
        if (source) {
            // .play() starts the animation loop, .pause() stops it. 
            // We just want one frame.
            source.play();
            //this.map.triggerRepaint();
            setTimeout(() => source.pause(), 100); // Stop it again to save CPU
        }
    }
}

class RemoteWeatherControl {
    onAdd(map) {
        this.map = map;
        this.canvasID = 'weather-canvas';

        // 1. Setup Canvas (Hidden)
        this.canvas = document.createElement('canvas');
        this.canvas.id = this.canvasID;
        this.canvas.width = 1000; // Must match server dimensions
        this.canvas.height = 1000;
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);

        // 2. Add Source/Layer immediately (initially empty or placeholder)
        this.map.addSource('weather-source', {
            type: 'canvas',
            canvas: this.canvasID,
            coordinates: [[112, 35], [113, 35], [113, 34], [112, 34]], // Your Bounds
            animate: false
        });

        this.map.addLayer({
            id: 'weather-layer',
            type: 'raster',
            source: 'weather-source',
            paint: { 'raster-opacity': 0.8, 'raster-resampling': 'linear' }
        });

        // 3. Create UI Button to Load Data
        this.container = document.createElement('div');
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.container.style.padding = '10px';
        this.container.style.backgroundColor = 'white';

        const btn = document.createElement('button');
        btn.textContent = '☁️ Load Weather';
        btn.style.width = '100px';
        btn.style.padding = '10px 30px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => this.loadData();
        this.container.appendChild(btn);

        return this.container;
    }

    onRemove() {
        // Cleanup DOM and Map
        this.container.remove();
        this.map.removeLayer('weather-layer');
        this.map.removeSource('weather-source');
        document.getElementById(this.canvasID).remove();
        this.map = undefined;
    }

    async loadData() {
        // 1. Fetch Binary Data
        const response = await fetch('http://localhost:8000/weather-data');
        const buffer = await response.arrayBuffer();

        // 2. Create View (Zero-Copy)
        // This is the raw array of 1,000,000 floats
        const data = new Float32Array(buffer);

        // 3. Paint to Canvas (Client-side Color Mapping)
        this.paintCanvas(data);

        // 4. Update Map
        const source = this.map.getSource('weather-source');
        if (source) { source.play(); setTimeout(() => source.pause(), 100); }
    }

    paintCanvas(data) {
        const ctx = this.canvas.getContext('2d');
        const imgData = ctx.createImageData(1000, 1000); // 1000x1000
        const pixels = imgData.data;

        for (let i = 0; i < data.length; i++) {
            const val = data[i]; // The raw temperature value

            // Example Color Map: -0.5 (Blue) to 0.5 (Red)
            // You can change this logic instantly without re-fetching data!
            let r = 0, g = 0, b = 0, a = 255;

            if (val < 0) {
                // Blue Gradient
                b = 255;
                r = Math.min(255, (val + 1) * 255);
            } else {
                // Red Gradient
                r = 255;
                b = Math.max(0, 255 - (val * 500));
            }

            const pIdx = i * 4;
            pixels[pIdx] = r;
            pixels[pIdx + 1] = g;
            pixels[pIdx + 2] = b;
            pixels[pIdx + 3] = 200; // Alpha
        }
        ctx.putImageData(imgData, 0, 0);
    }
}

export { BitmapControl, NativeBitmapControl, RemoteWeatherControl };