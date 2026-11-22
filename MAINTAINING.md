# Maintaining QuadratNotes

Notes for whoever looks after the site and releases.

## Hosting
GitHub Pages serves the `main` branch, folder `/ (root)`, at the custom domain quadratnotes.com.
The `CNAME` file holds the domain; keep it.

## Updating the app
- Replace `index.html` (and any other changed files) and commit. Phones pick up the new version the
  next time they open the app with signal.
- If you change `jszip.min.js`, the `leaflet/` files, fonts or icons, also bump the cache version in
  `sw.js` (e.g. `quadratnotes-v8` to `quadratnotes-v9`). The service worker caches only the site's own files;
  look-ups to other sites (weather, species names, map tiles) always go to the network.
- Settings such as the support link, contact email, habitats offered, version and DOI are in
  `APP_CONFIG` near the top of the script in `index.html`. Keep `version` there and in
  `CITATION.cff` the same.

## Tests
- The tests run on GitHub for every push (Actions tab, workflow "Tests"); a green tick on the latest
  commit means they passed. If they fail, open the run to see which test and why.
- Run them locally before uploading a change (see CONTRIBUTING.md): `cd tests`, `npm ci`, then
  `npm test` and `npm run e2e`.
- `tests/package-lock.json` pins the test tools. Playwright needs updating occasionally: change its
  version in `tests/package.json`, run `npm install` in `tests/`, and upload both files.

## Custom survey templates
- Templates are kept on the phone (IndexedDB `meta` store, key `templates`) and included in backups.
  Each survey stores its own copy in `session.template`, so editing a template never changes recorded data.
- A shared template file (`*.quadratnotes-template.json`) is JSON with `app: "QuadratNotes"`,
  `kind: "survey-template"`, `format: 1` and the `template` itself (`name`, `measure`, `scale`, `species`,
  `counts`, `fields`). If the structure changes in a way older versions can't read, raise `format`: older apps
  then ask the user to update instead of importing it wrongly.

## Releases and DOIs
- Publish a GitHub release (tag like `0.17.4`, no "v") after a meaningful batch of changes.
  Zenodo archives each release automatically and gives it a version DOI under the concept DOI
  10.5281/zenodo.24295028.
- Zenodo takes the title, authors (with ORCID) and description from `CITATION.cff`.

## Feedback and ratings
Feedback from the field-testers "i" panel is sent through Web3Forms to hello@quadratnotes.com.
Each message has an optional 1–5 rating (also in the email subject), the message and the app
version. The access key is `feedbackKey` in `APP_CONFIG`; it is public by design and only sends
to that address. If it is ever abused, create a new key at web3forms.com and swap it in.

To keep a record of ratings, sign in to the Web3Forms dashboard once a month and export the
submissions as CSV: the free plan only keeps 30 days. The CSV has `rating`, `message`, `app_version`,
`survey_type`, `used_in_field`, `sender_type`, `phone_type` and `usage_summary` columns, so the monthly files can be combined in R and ratings compared between
versions.
