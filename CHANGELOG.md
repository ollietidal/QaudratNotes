# Changelog

Changes to QuadratNotes, newest first. Anything that changes the **exported data** (columns, files or their
contents) is marked **Export change**, so analysis scripts can be checked. Export columns are described in
[docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md). Released versions are archived on Zenodo:
[10.5281/zenodo.24295028](https://doi.org/10.5281/zenodo.24295028).

## 0.19.2 (24 Nov 2026)
- Ko-fi link in one place only: the home-screen footer, plus one line at the end of the help guide and in the
  README. Removed the "Found this useful?" line that appeared after exporting and the support line in About.
- GitHub shows a Sponsor button linking to Ko-fi (`.github/FUNDING.yml`). The tests workflow is back in
  `.github/workflows/` so tests run on every change. No change to exports.

## 0.19.1 (22 Nov 2026)
- Home screen: a "Works best from your home screen" pill under "field testers wanted", shown until the app is
  installed. Its i opens three short steps for your phone (iPhone, Android or computer), with an Install button
  where the browser offers one, and "Hide this tip".
- Feedback form: optional quick picks for which survey, whether it was used on a real survey, and who is sending
  (student, volunteer, researcher or professional, other); a prompt with the questions that help most; the phone
  type (iPhone, Android or other) is sent with each message; and an opt-in usage summary (number of surveys and
  quadrats by habitat, shown before sending). Privacy notice updated.
- Tests are now in the repository (`tests/`) and run automatically on GitHub for every change.
- Contributing guide (`CONTRIBUTING.md`), support note (`SUPPORT.md`) and issue forms for bug reports
  and feature requests. No change to the app or its exports.

## 0.19.0 (21 Nov 2026)
- **Custom survey** for any habitat: make a template with your own species list, one way of scoring them
  (% cover with the grid, count, present/absent, or a Domin or Braun-Blanquet class), an optional "Also count" list
  (e.g. snails in a % cover survey; more can be added in the field) and optional quadrat
  details (number with unit, choice list, yes/no, text). Templates are saved on the phone, can be shared as a
  `.quadratnotes-template.json` file and imported, and each survey keeps its own copy. Transects, random points
  and fixed points work as in the other surveys.
- "Check scientific names" in the template editor looks names up in the GBIF species list (needs signal; only the names
  are sent) and suggests fixes for spelling slips. Adding "snail" in the field when "Snails" is listed uses
  the listed name. Privacy page updated (GBIF, and the OBIS/WoRMS look-ups the Darwin Core download already made).
- Backups include templates; restoring adds any the phone doesn't have.
- Saltmarsh and custom % cover: the grid now shades squares already used by other species in the quadrat
  (they can still be tapped, as plants overlap).
- Fix: the offline cache no longer stores replies from other sites. Before, "Get current conditions" could
  return the weather and tide saved from an earlier look-up near the same spot (with the new time). The cache
  is renewed (`quadratnotes-v9`).
- **Export change:** the data zip includes each custom survey's template as
  `templates/<name>.quadratnotes-template.json`, which can be imported.
- **Export change:** new quadrats column `survey_template` after `habitat` (blank except for custom surveys).
  Custom surveys add `cf_…` columns at the end of the quadrats table, one per quadrat detail.
- **Export change:** new species columns `braun_blanquet` and `presence` after `domin`. `domin` also holds the
  class picked in Domin-scale custom surveys.
- **Export change:** Darwin Core: custom surveys use the template name as `habitat`, describe the template in
  `samplingProtocol`, leave `kingdom` blank and add quadrat details as measurements. Dataset titles for a mix of
  custom and coastal surveys read "Quadrat surveys: …".
- **Export change:** photo descriptions (EXIF) in rocky shore and saltmarsh surveys list only species present,
  not those recorded at 0.

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
