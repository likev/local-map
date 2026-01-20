## 数据来源

https://github.com/zhChuXiao/ChinaGeoJson

## 数据处理

```bash
tippecanoe -o china.mbtiles -Z0 -z1 --drop-densest-as-needed -l china china.json
```

```bash
cd province
```

To get the outline (boundary) of your cities, the best tool is Mapshaper.

Since your city files likely contain multiple internal polygons (districts, blocks, etc.), you need to dissolve them. This merges all touching polygons into a single shape, removing the internal borders and leaving just the outer perimeter.

The -dissolve command removes all attribute data (properties). In the GeoJSON spec, a shape with no properties is often saved as a raw Geometry, whereas a shape with properties must be saved as a Feature.

To force Mapshaper to output a FeatureCollection, you simply need to add a dummy property back onto the shape before saving.
```bash
# Loop through every json file and ending in ".json"
for f in *.json; do
  mapshaper "$f" \
    -dissolve -each "idd=1" \
    -o "${f%.json}_boundary.geojson"
done
```

```bash
tippecanoe -o provinces_boundary.mbtiles -Z2 -z4 --drop-densest-as-needed -l provinces_boundary *.geojson
tippecanoe -o provinces.mbtiles -Z5 -z7 --drop-densest-as-needed -l provinces *.json
```

```bash
cd ../citys
tippecanoe -o citys.mbtiles -Z8 -z12 --drop-densest-as-needed -l citys *.json
```

Use `tile-join` (which comes installed with tippecanoe) to smash them together. It automatically handles the zoom logic (Z0-4 comes from file A, Z5-7 comes from file B, Z8-12 comes from file C).
```bash
cd ..
tile-join -o map-china.pmtiles china.mbtiles province/provinces_boundary.mbtiles province/provinces.mbtiles citys/citys.mbtiles
```