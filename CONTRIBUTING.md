# Contributing to QuadratNotes

Thank you for helping. QuadratNotes is a free, open-source app for quadrat surveys, maintained by
one person, so clear reports and small, focused changes help most.

## Reporting a problem

Open an issue using the **Bug report** form: <https://github.com/ollietidal/quadratnotes/issues/new/choose>.
Please include:

- the app version (shown in **About** on the home screen) and your phone or computer and browser
- the habitat or survey type, and what you were doing
- what you expected, and what happened instead
- a screenshot if it helps

If you'd rather not use GitHub, email hello@quadratnotes.com or use the feedback form in the app.

**Never post survey data, exact locations of sensitive sites, or personal details in a public issue.**
If an export or backup is needed to show the problem, say so and we'll arrange to share it privately.

## Suggesting a feature

Open an issue using the **Feature request** form. Describe the survey method or problem first, then
the change you have in mind. Features are judged on whether they help real field surveys and keep the
screens simple; explanations go behind "i" buttons, in the help guide or in the README.

## Contributing code or documentation

1. Open an issue first for anything larger than a typo, so we can agree the approach.
2. Fork the repository and make your change on a branch.
3. Run the tests (below) and make sure they pass.
4. Open a pull request that explains what changed and why, and links the issue.

### How the code is organised

- `index.html` holds the whole app: markup, styles and script. It has no build step; open it through
  a local web server to try it.
- `sw.js` is the offline cache. Bump its cache name when the files it stores (`CORE`) change.
- `help.html` (user guide) and `privacy.html` (privacy notice) are plain pages.
- `docs/DATA-DICTIONARY.md` describes every exported column.
- `tests/` holds the test suites.

### Rules that keep data reliable

- **Any change to exported data** (a column, file, name or value) needs an **Export change** entry in
  `CHANGELOG.md` and an update to `docs/DATA-DICTIONARY.md`, so people's analysis scripts can be checked.
- Older backups and template files must keep importing. If a format changes in a way older versions
  can't read, raise its `format` number.
- No accounts, tracking or analytics. Any new outside service must be added to `privacy.html`.
- Keep the version in `APP_CONFIG.version` (in `index.html`) and `CITATION.cff` the same.

## Running the tests

You need Node.js 20 or later.

```sh
cd tests
npm ci
npx playwright install chromium   # first time only
npm test        # simulated-browser tests (jsdom)
npm run e2e     # real-browser tests (Playwright)
```

The same tests run automatically on GitHub for every push and pull request. See `tests/README.md`
for what each test covers. Tests that talk to outside services (weather, species look-ups, feedback)
must intercept or block those requests, so no real messages or look-ups are sent.

## Conduct

Be kind and constructive. Disagree about ideas, not people. Harassment or discrimination of any kind
isn't accepted; the maintainer may remove comments or block accounts that break this.

## Licence

By contributing, you agree that your contribution is released under the project's MIT licence. The
QuadratNotes name, logo and habitat artwork are not covered by the licence (see the README).
