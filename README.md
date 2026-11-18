# QuadratNotes

[![DOI](https://zenodo.org/badge/1414708264.svg)](https://doi.org/10.5281/zenodo.24295028)

Free, offline quadrat surveys for coastal habitats: **seagrass, rocky shore and saltmarsh**.

QuadratNotes is a web app that installs on a phone and records quadrat surveys in the field
without signal. Everything stays on the device until you export it. Exports are tidy quadrat
and species tables (CSV) ready for R, photos in a zip, map files (GeoJSON and KML) and a Darwin
Core archive for OBIS and GBIF.

For random sampling, you can draw the survey area on a map or walk its boundary with GPS. The app
places random points inside it (with an optional minimum spacing), guides you to each one, and
records skipped points with a reason. The survey outline and points are included in the exports.

GPS accuracy is recorded down to the centimetre, so external GNSS, DGPS or RTK receivers that the
phone or tablet uses as its location source are captured properly. The device's GPS height and
vertical accuracy are exported raw (`gps_altitude_m`, `gps_altitude_accuracy_m`). Their reference
level depends on the device and receiver (often the WGS84 ellipsoid, not sea level or chart datum),
and phone heights are usually only good to ±10–30 m, so convert and check them before use.

Live app: https://quadratnotes.com

## Before public launch
- Delete the line marked `PRE-LAUNCH` near the top of `index.html` so search engines can list the app.

## Hosting
Hosted on GitHub Pages from the `main` branch, folder `/ (root)`, with the custom domain quadratnotes.com
(the `CNAME` file holds the domain; keep it).

## Updating
Replace `index.html` and commit; phones pick up the new version next time they open the app with signal.
If you change `jszip.min.js`, fonts or icons, also bump the cache version in `sw.js` (e.g. `v5` to `v6`).
Settings such as the support link, contact email, habitats offered and DOI are in `APP_CONFIG`
near the top of the script in `index.html`.

## How to cite
Thomas, O. R. (2026). QuadratNotes [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.24295028

## Licence
Copyright (c) 2026 Oliver R Thomas. Released under the MIT License (see `LICENSE.txt`).

## Name and logo
The MIT License covers the code only. The QuadratNotes name and logo (the quadrat grid icons) are
(c) 2026 Oliver R Thomas, all rights reserved, and may not be used to name or brand other products
without permission. If you fork the project, please use a different name and icon.

## Third-party code and fonts
- `jszip.min.js`: JSZip 3.10.1 (https://stuk.github.io/jszip/), dual-licensed MIT or GPLv3.
- `leaflet/`: Leaflet 1.9.4 (https://leafletjs.com), BSD 2-Clause licence (see `leaflet/LICENSE.txt`).
- Map tiles: © OpenStreetMap contributors (https://www.openstreetmap.org/copyright), ODbL. Tiles are loaded from
  tile.openstreetmap.org under the OSM Foundation tile usage policy; the app does not store them for offline use.
- Point-in-polygon test after PNPOLY by W. Randolph Franklin (MIT-style licence); Mulberry32
  random number generator by Tommy Ettinger (public domain).
- Atkinson Hyperlegible, Barlow Condensed and Nunito fonts: SIL Open Font License 1.1 (see `fonts/`).
- Weather and modelled tide data: Open-Meteo.com (CC BY 4.0).
