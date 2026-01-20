function generateGraticuleLines(interval) {
    // 1. Generate the Grid GeoJSON
    const graticule = {
        type: 'FeatureCollection',
        features: []
    };

    // Longitude lines (Meridians) every 10 degrees
    for (let lng = -180; lng <= 180; lng += interval) {
        graticule.features.push({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                // A vertical line from South Pole to North Pole
                coordinates: [[lng, -90], [lng, 90]]
            },
            properties: { value: lng, type: 'meridian' }
        });
    }

    // Latitude lines (Parallels) every 10 degrees
    // Note: We stop at +/- 80 or 85 because Web Mercator distorts heavily at the poles
    for (let lat = -80; lat <= 80; lat += interval) {
        graticule.features.push({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                // A horizontal line from West to East
                coordinates: [[-180, lat], [180, lat]]
            },
            properties: { value: lat, type: 'parallel' }
        });
    }

    return graticule;
}

function generateSombreroData(CENTER = [112.45, 34.62], SPREAD = 0.1, GRID_SIZE = 200) {
    const data = [];
    // We scan a grid from -10 to 10 in mathematical space
    const bounds = 15;
    const step = (bounds * 2) / GRID_SIZE;

    for (let x = -bounds; x <= bounds; x += step) {
        for (let y = -bounds; y <= bounds; y += step) {
            const r = Math.sqrt(x * x + y * y);
            // Avoid division by zero at the very center
            const z = r === 0 ? 1.0 : Math.sin(r) / r;

            // Map math coordinates back to Lat/Lon
            // x mapped to Longitude, y mapped to Latitude
            data.push({
                position: [
                    CENTER[0] + (x / bounds) * SPREAD,
                    CENTER[1] + (y / bounds) * SPREAD
                ],
                value: z
            });
        }
    }
    return data;
}

// A. DATA GENERATION
function generateMonkeySaddleData(CENTER = [112.45, 34.62], SPREAD = 0.15, GRID_SIZE = 400) {
    const data = [];
    const bounds = 2.0;
    const step = (bounds * 2) / GRID_SIZE;

    for (let x = -bounds; x <= bounds; x += step) {
        for (let y = -bounds; y <= bounds; y += step) {
            // Standard Monkey Saddle equation
            const z = (x ** 3) - (3 * x * y ** 2);

            data.push({
                position: [
                    CENTER[0] + (x / bounds) * SPREAD,
                    CENTER[1] + (y / bounds) * SPREAD
                ],
                value: z
            });
        }
    }
    return data;
}

// A. DATA GENERATION
function generateCassiniData(CENTER = [112.45, 34.62], SPREAD = 0.15, GRID_SIZE = 400) {
    const data = [];
    const bounds = 2.5;
    const step = (bounds * 2) / GRID_SIZE;
    const a = 1.0; // Distance of foci from center

    for (let x = -bounds; x <= bounds; x += step) {
        for (let y = -bounds; y <= bounds; y += step) {
            // Distance to Focus 1 (-a, 0)
            const d1sq = (x + a) ** 2 + y ** 2;
            // Distance to Focus 2 (+a, 0)
            const d2sq = (x - a) ** 2 + y ** 2;

            // Cassini value is the square root of the product of distances
            const z = Math.sqrt(d1sq * d2sq);

            data.push({
                position: [
                    CENTER[0] + (x / bounds) * SPREAD,
                    CENTER[1] + (y / bounds) * SPREAD
                ],
                value: z
            });
        }
    }
    return data;
}

export { generateGraticuleLines, generateSombreroData, generateMonkeySaddleData, generateCassiniData };