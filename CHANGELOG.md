# Changelog

Changes to QuadratNotes, newest first. Anything that changes the **exported data** (columns, files or their
contents) is marked **Export change**, so analysis scripts can be checked. Export columns are described in
[docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md). Released versions are archived on Zenodo:
[10.5281/zenodo.24295028](https://doi.org/10.5281/zenodo.24295028).

## 0.18.3 (21 Nov 2026)
- Help guide (`help.html`), linked from the home screen footer, About and the README, and available offline.
- "New version ready" banner when an update has downloaded, with Reload and Later. The app also checks for
  updates when it comes back to the screen.
- **Export change:** accented and special letters in site names are now folded to plain letters in survey codes
  and file names instead of becoming dashes (Porth Llŷn → `porth-llyn`, previously `porth-ll-n`). Codes of
  existing surveys are unchanged, but photo and export file names for them follow the new spelling.

## 0.18.2 (20 Nov 2026)
- Privacy page (`privacy.html`), linked from About, the feedback form and the README.
- This changelog, and an updated export guide in `docs/DATA-DICTIONARY.md`.
- Offline cache: only the app's own page is saved as the offline copy (other pages such as the privacy page no
  longer replace it).

## 0.18.1 (20 Nov 2026)
- Feedback form: optional 1–5 rating ("How are you finding QuadratNotes?"). A rating or a message can be sent on its own.

## 0.18.0 (20 Nov 2026)
- Fixed points for plots revisited over time: mark a plot where you stand (GPS averaged over 20 s), tap the map,
  import a CSV/GeoJSON/KML file, or copy points from an earlier survey; then get guided to each one.
- **Export change:** new `*_fixed_points.csv` in the zip (also downloadable from the Fixed points screen and
  re-importable). Map files include fixed points (`feature_type` `fixed_point`; KML folder "Fixed points").
- **Export change:** for quadrats saved at a fixed point, `point_id` is the point's name and `plot_id` is filled
  with it if left blank. In KML quadrat tables the label "Random point" is now "Point".
- Includes 0.17.5–0.17.11, which were not released separately.

## 0.17.11 (20 Nov 2026)
- iNaturalist information moved into More formats ("Photo records").

## 0.17.10 (20 Nov 2026)
- Backup section simplified: explanation behind an "i"; a short Home Screen warning only on iPhone/iPad in Safari.

## 0.17.9 (20 Nov 2026)
- Export tab simplified; table descriptions moved to the README.

## 0.17.8 (20 Nov 2026)
- **Export change:** photos in the zip export now carry their quadrat's GPS position and accuracy, time and species
  list as EXIF, so they can be dragged into the iNaturalist web uploader. File names are unchanged.

## 0.17.6–0.17.7 (20 Nov 2026)
- Feedback form in the field-testers "i" panel (sent through Web3Forms; optional email for replies).

## 0.17.5 (19 Nov 2026)
- Opens from the saved copy after 3 seconds on weak signal instead of waiting for the network.
- Link-preview image and tags; larger tap targets; shorter region names; consistent date display; tab bar aligned
  on wide screens.

## 0.16.0–0.17.4 (Nov 2026)
- Random points: draw or walk the survey area, place random points with an optional minimum spacing, and get
  guided to each one (arrow, compass, skip with reason).
- Backup and restore (merges without overwriting); survey deletion.
- GPS accuracy kept to the centimetre for external GNSS/DGPS/RTK receivers; raw GPS height recorded.
- Per-species seagrass grid; round habitat badges.
- **Export change:** new quadrat columns `survey_area_m2`, `point_id`, `planned_latitude`, `planned_longitude`,
  `distance_from_point_m`, `gps_altitude_m` and `gps_altitude_accuracy_m`; new `*_random_points.csv`; GeoJSON and
  KML map files.

## 0.15.0 (17 Nov 2026)
- First public version: seagrass, rocky shore and saltmarsh surveys; quadrat and species CSV tables; photos in a zip;
  Darwin Core archive for OBIS and GBIF; optional weather and modelled tide from Open-Meteo.
