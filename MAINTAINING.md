# Maintaining QuadratNotes

Notes for whoever looks after the site and releases.

## Hosting
GitHub Pages serves the `main` branch, folder `/ (root)`, at the custom domain quadratnotes.com.
The `CNAME` file holds the domain; keep it.

## Updating the app
- Replace `index.html` (and any other changed files) and commit. Phones pick up the new version the
  next time they open the app with signal.
- If you change `jszip.min.js`, the `leaflet/` files, fonts or icons, also bump the cache version in
  `sw.js` (e.g. `quadratnotes-v6` to `quadratnotes-v7`).
- Settings such as the support link, contact email, habitats offered, version and DOI are in
  `APP_CONFIG` near the top of the script in `index.html`. Keep `version` there and in
  `CITATION.cff` the same.

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
submissions as CSV: the free plan only keeps 30 days. The CSV has `rating`, `message` and
`app_version` columns, so the monthly files can be combined in R and ratings compared between
versions.
