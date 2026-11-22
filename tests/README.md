# Tests

Two kinds of tests, both run automatically on GitHub for every change:

- **Simulated-browser tests** (this folder): run the real `index.html` from the repository root in Node
  (jsdom with a fake on-device database), record surveys in each habitat, and check saving, editing
  and exports. Run with `npm test`.
- **Real-browser tests** (`e2e/`): run the app in Chromium with Playwright. Run with `npm run e2e`.
  See [e2e/README.md](e2e/README.md).

Setup (Node.js 20 or later), from this folder:

    npm ci
    npx playwright install chromium

| File | What it checks |
|---|---|
| sg.test.js | Seagrass survey: setup, recording, data list, species table export |
| add.test.js | Adding a species not on the list (seagrass), and editing it back |
| rocky.test.js | Rocky shore: layers, 100% checks, counts, carry-over, CSV and Darwin Core |
| glob.test.js | Rocky shore "Elsewhere (broad groups)" list and region column |
| salt.test.js | Saltmarsh: % cover, Domin classes, few/several/many, extras, exports |
| grid.test.js | Grid estimator pop-up: values, shading of taken squares, bare rock/ground |
| sq.test.js | Grid squares saved, restored on edit and exported |
| hide.test.js | Mudflat switched off: only three habitats shown |
| mud.test.js | Mudflat module (switched off in the app; test kept for when it returns) |

The output is a readout to check by eye rather than pass/fail assertions. Turning these into
proper assertions is a good step before the JOSS submission.
