# Browser tests (Playwright)

End-to-end tests that run the app in Chromium with a simulated GPS position. Each script serves the
repository folder on its own local port (set `QN_ROOT` to test another copy of the site).

Run them all from `tests/` with `npm run e2e` (after `npm ci` and `npx playwright install chromium`),
or one at a time with `node e2e/run-e2e.js custom fixed`. A single script can also be run directly:
`node e2e/<name>.e2e.js [output-folder]`.

`run-e2e.js` fails a test if the script crashes or exits with an error, if the page reports a
JavaScript error, or if one of `custom.e2e.js`'s checks fails. The other scripts also print a readout
of what they saw, to compare by eye when something changes. Outside services (map tiles, weather,
species look-ups, feedback) are blocked or answered with fixed replies, so no real requests are made.
`check-exif.py` (needs Python and `exifread`) prints the photo details written into an exported zip.

- plan.e2e.js: random points (draw area, pick points, guidance, link quadrat, skip, exports)
- walk.e2e.js / dgps.e2e.js: walking the boundary; centimetre GPS accuracy
- alt.e2e.js: GPS height export (fake location source)
- backup.e2e.js: backup and restore across three simulated phones
- del.e2e.js: deleting surveys (note: the empty-survey link is now "← Back", see three.e2e.js)
- sggrid2.e2e.js: per-species seagrass grid and shared squares
- three.e2e.js: map zoom-to-me, location at survey start, Back to setup
- info.e2e.js: info panels on the random points screens
- feedback.e2e.js: feedback form fields, phone type and opt-in usage summary (the send is intercepted)
- setup.e2e.js: "Works best from your home screen" tip (steps per device, opens from its i, hidden by "Hide this tip", never shown when installed)
- sw.e2e.js: offline cache (app loads offline; replies from other sites are never cached)
- inat.e2e.js / fixed.e2e.js: photo details (EXIF) in exports; fixed points
- custom.e2e.js: custom survey (template editor, all four scoring methods, quadrat details, share/import
  a template file, editing, empty quadrats, CSV and Darwin Core exports, backup and restore of templates)
