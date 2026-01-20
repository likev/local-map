
import { ContourLayer as deckContourLayer } from '@deck.gl/aggregation-layers';

import { generateSombreroData, generateMonkeySaddleData, generateCassiniData } from './graticule.js';

function createDeckGLSombreroContourLayer() {
    const contourData = generateSombreroData();

    // 3. DECK.GL LAYER
    // We define 'isobands' (filled ranges) with start/end thresholds
    const myDeckLayer =
        new deckContourLayer({
            id: 'sombrero-contours',
            data: contourData,
            getPosition: d => d.position,
            getWeight: d => d.value,

            // CRITICAL FIX 1: Finer resolution
            // 20-30 meters is usually a "sweet spot" for city-scale smoothness
            cellSize: 180,

            // AGGREGATION: We want the exact value at the point, so we SUM 
            // (assuming 1 point per bin).
            aggregation: 'SUM',

            // OPTIONAL: Smooth edges (GPU interpolation)
            gpuAggregation: true,

            // CRITICAL FIX 3: More bands = Smoother Gradient
            contours: [
                // Deep Blue (Trough)
                { threshold: [-0.25, -0.15], color: [20, 50, 150, 200] },
                { threshold: [-0.15, -0.05], color: [40, 100, 200, 180] },

                // Transition (Teal/White)
                { threshold: [-0.05, 0.05], color: [255, 255, 255, 60] },

                // The Rise (Warm colors)
                { threshold: [0.05, 0.15], color: [255, 220, 100, 120] },
                { threshold: [0.15, 0.30], color: [255, 180, 50, 160] },
                { threshold: [0.30, 0.50], color: [255, 140, 0, 200] },
                { threshold: [0.50, 0.80], color: [255, 80, 0, 230] },

                // The Peak (Red)
                { threshold: [0.80, 1.2], color: [255, 20, 20, 255] }
            ]
        })


    return myDeckLayer;

}

function createDeckGLMonkeySaddleContourLayer() {
    const contourData = generateMonkeySaddleData();

    // 3. DECK.GL LAYER
    const myDeckLayer =
        new deckContourLayer({
            id: 'monkey-saddle',
            data: generateMonkeySaddleData(),
            getPosition: d => d.position,
            getWeight: d => d.value,

            cellSize: 100,
            aggregation: 'SUM',

            contours: [
                // 1. THE VALLEYS (Negative Z - Blue/Purple)
                // The "Tail" and "Leg" slots
                { threshold: [-4.0, -2.0], color: [75, 0, 130, 200] }, // Indigo
                { threshold: [-2.0, -0.5], color: [0, 0, 255, 150] },  // Blue

                // 2. THE NEUTRAL ZONE (Near 0 - Gray/Transparent)
                { threshold: [-0.5, 0.5], color: [200, 200, 200, 50] },

                // 3. THE RIDGES (Positive Z - Gold/Yellow)
                // The peaks between the valleys
                { threshold: [0.5, 2.0], color: [255, 200, 0, 150] }, // Gold
                { threshold: [2.0, 4.0], color: [255, 255, 0, 200] }, // Bright Yellow
            ]
        })

    return myDeckLayer;
}

function createDeckGLCassiniContourLayer() {
    const contourData = generateCassiniData();

    // 3. DECK.GL LAYER
    const myDeckLayer =
        new deckContourLayer({
            id: 'cassini-ovals',
            data: generateCassiniData(), // Call the function
            getPosition: d => d.position,
            getWeight: d => d.value,

            // Aggregation settings
            cellSize: 100, // Large enough to blend points smoothly
            aggregation: 'SUM',

            contours: [
                // 1. THE SEPARATE LOOPS (Values < 1.0)
                { threshold: [0.1, 0.6], color: [0, 100, 255, 150] },  // Deep Blue
                { threshold: [0.6, 0.95], color: [0, 200, 255, 180] }, // Cyan

                // 2. THE TRANSITION ZONE (Around 1.0)
                // This captures the "Figure 8" shape
                { threshold: [0.95, 1.05], color: [255, 255, 255, 200] }, // White border

                // 3. THE MERGED OVALS (Values > 1.0)
                { threshold: [1.05, 1.4], color: [255, 150, 0, 150] }, // Orange
                { threshold: [1.4, 2.0], color: [255, 50, 0, 150] },   // Red
                { threshold: [2.0, 3.5], color: [100, 0, 0, 100] },    // Dark Red Fade
            ]
        })


    return myDeckLayer;
}

export { createDeckGLSombreroContourLayer, createDeckGLMonkeySaddleContourLayer, createDeckGLCassiniContourLayer };