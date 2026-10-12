# QuadratNotes

A free, offline-first seagrass quadrat survey recorder. Data stays on the
device and is exported as CSV (plus photos in a zip), ready for R.

## Before launch
- In `index.html`, fill in `APP_CONFIG` near the top of the script (support link, contact email).
- In `index.html`, delete the line marked `PRE-LAUNCH` so search engines can list the app.

## Hosting on GitHub Pages
On the free GitHub plan the repository must be public for Pages to work.
Settings > Pages > Build and deployment: "Deploy from a branch", branch `main`, folder `/ (root)`.
The site appears at `https://<your-username>.github.io/<repository-name>/`.

## Updating
Replace `index.html` and commit; phones get the new version next time they open it with signal.
If you change `jszip.min.js`, fonts or icons, also bump the version in `sw.js` (e.g. `v2` to `v3`).

## Licence
Copyright (c) 2026 Oliver R Thomas. Released under the MIT License (see `LICENSE.txt`).

## Name and logo
The MIT License covers the code only. The QuadratNotes name and logo (the quadrat grid icons) are
(c) 2026 Oliver R Thomas, all rights reserved, and may not be used to name or brand other products
without permission. If you fork the project, please use a different name and icon.

## Third-party code and fonts
- `jszip.min.js`: JSZip 3.10.1 (https://stuk.github.io/jszip/), dual-licensed MIT or GPLv3.
- Atkinson Hyperlegible, Barlow Condensed and Nunito fonts: SIL Open Font License 1.1 (see `fonts/`).
