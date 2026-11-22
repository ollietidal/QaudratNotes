// Custom survey: template editor (all measures and detail types), share and import a template file,
// recording, editing, empty quadrats, data view, CSV / Darwin Core exports and backups.
// Run: node custom.e2e.js <output-folder>
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const ROOT = process.env.QN_ROOT || require("path").resolve(__dirname, "../.."), OUT = process.argv[2] || require("path").join(require("os").tmpdir(), "qn-e2e", "custom");
fs.mkdirSync(OUT, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8791);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
let fails = 0;
const check = (label, ok, extra) => { if (!ok) fails++; log((ok ? "  ok   " : "  FAIL ") + label + (extra !== undefined ? " | " + extra : "")); };
const unzip = (zip, dir) => { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); execSync("cd '" + dir + "' && unzip -o -q '" + zip + "'"); };
const csv = f => fs.readFileSync(f, "utf8").trim().split(/\r?\n/).map(l => l.split(","));
const findFile = (dir, re) => { const all = []; const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? walk(path.join(d, e.name)) : all.push(path.join(d, e.name))); walk(dir); return all.find(f => re.test(f)); };
fs.writeFileSync(path.join(OUT, "dune.quadratnotes-template.json"), JSON.stringify({ app: "QuadratNotes", kind: "survey-template", format: 1,
  template: { id: "dune-1", name: "Dune slack", measure: "presence", species: ["Salix repens", "Epipactis palustris", "Salix repens", "  "], fields: [{ id: "w", label: "Standing water", type: "yesno" }, { id: "bad", label: "Bad choice", type: "choice", options: [] }] } }));
fs.writeFileSync(path.join(OUT, "not-a-template.json"), JSON.stringify({ hello: 1 }));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 50.36, longitude: -4.14, accuracy: 4 }, permissions: ["geolocation"], serviceWorkers: "block", acceptDownloads: true });
  await ctx.route(/tile\.openstreetmap|api\.web3forms\.com|api\.obis\.org|marinespecies\.org|open-meteo/, r => r.abort());
  let gbifDown = false, gbifCalls = 0;
  const GBIF = { "Festuca ovina": { matchType: "EXACT", canonicalName: "Festuca ovina", rank: "SPECIES", status: "ACCEPTED" },
    "Thymus drucei": { matchType: "EXACT", canonicalName: "Thymus drucei", rank: "SPECIES", status: "SYNONYM" },
    "Lotus corniculatus": { matchType: "EXACT", canonicalName: "Lotus corniculatus", rank: "SPECIES", status: "ACCEPTED" },
    "Lotus corniculatis": { matchType: "FUZZY", canonicalName: "Lotus corniculatus", rank: "SPECIES", status: "ACCEPTED" },
    "festuca rubra": { matchType: "EXACT", canonicalName: "Festuca rubra", rank: "SPECIES", status: "ACCEPTED" },
    "Cepaea sp.": { matchType: "HIGHERRANK", canonicalName: "Cepaea", rank: "GENUS", status: "ACCEPTED" },
    "Snails": { matchType: "NONE", confidence: 100 } };
  await ctx.route(/api\.gbif\.org/, r => { gbifCalls++; if (gbifDown) return r.abort();
    const name = new URL(r.request().url()).searchParams.get("name");
    r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(GBIF[name] || { matchType: "NONE" }) }); });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  const toast = async () => { await sleep(250); return page.textContent("#toast"); };
  const dl = async (sel, name) => { const [d] = await Promise.all([page.waitForEvent("download"), page.click(sel)]); await d.saveAs(path.join(OUT, name)); return path.join(OUT, name); };
  await page.goto("http://localhost:8791/");

  log("1. Setup");
  check("home card shown", await page.waitForSelector("#card-custom", { state: "visible", timeout: 5000 }).then(() => true, () => false));
  await page.click("#btn-start-custom");
  check("template field shown, regions hidden", await page.isVisible("#custom-template-field") && !(await page.isVisible("#region-field")) && !(await page.isVisible("#rocky-region-field")));
  check("heading", (await page.textContent("#h-survey")) === "Start a custom survey");
  await page.fill("#s-site", "Castle Hill");
  await page.click('#survey-form button[type="submit"]');
  check("no template refused", /template first/.test(await toast()));

  log("2. Template editor");
  await page.click("#btn-tpl-new");
  check("editor open, delete hidden", await page.isVisible("#view-template") && !(await page.isVisible("#btn-t-delete")));
  await page.click("#btn-t-save"); check("needs a name", /name/.test(await toast()));
  await page.fill("#t-name", "Chalk grassland");
  await page.click("#btn-t-save"); check("needs species or detail", /at least one/.test(await toast()));
  await page.fill("#t-species", "Festuca ovina\nThymus drucei\nLotus corniculatus\nfestuca ovina\n");
  for (let i = 0; i < 4; i++) await page.click("#btn-t-addfield");
  const tf = n => "#t-fields .tfield:nth-child(" + n + ")";
  await page.fill(tf(1) + " .tfield-top input", "Soil depth"); await page.fill(tf(1) + " input[placeholder^='Unit']", "cm");
  await page.fill(tf(2) + " .tfield-top input", "Aspect"); await page.selectOption(tf(2) + " select", "choice");
  await page.fill(tf(3) + " .tfield-top input", "Grazed"); await page.selectOption(tf(3) + " select", "yesno");
  await page.fill(tf(4) + " .tfield-top input", "Turf"); await page.selectOption(tf(4) + " select", "text");
  await page.click("#btn-t-save"); check("choice needs options", /options for Aspect/.test(await toast()));
  await page.fill(tf(2) + " input[placeholder^='Options']", "N, E, S, W, N");
  await page.click(tf(4) + " .linkish"); await page.click("#btn-t-addfield");
  await page.fill(tf(4) + " .tfield-top input", "Turf height"); await page.selectOption(tf(4) + " select", "number"); await page.fill(tf(4) + " input[placeholder^='Unit']", "cm");
  await page.click("#btn-t-addfield"); await page.fill(tf(5) + " .tfield-top input", "turf height"); await page.fill(tf(5) + " input[placeholder^='Unit']", "cm");
  await page.click("#btn-t-save"); check("duplicate detail names refused", /same name/.test(await toast()));
  await page.click(tf(5) + " .linkish");
  await page.click("#btn-t-save");
  check("saved, back on setup", /saved/.test(await toast()) && await page.isVisible("#view-survey"));
  check("summary", (await page.textContent("#tpl-summary")) === "% cover, 3 species, 4 quadrat details", await page.textContent("#tpl-summary"));

  log("2b. Name check (GBIF mocked)");
  await page.click("#btn-tpl-edit");
  await page.fill("#t-species", "Festuca ovina\nThymus drucei\nLotus corniculatis\nfestuca rubra\nCepaea sp.");
  await page.fill("#t-counts", "Snails");
  gbifDown = true; await page.click("#btn-t-check"); await sleep(600);
  check("no signal message", /Couldn't reach GBIF/.test(await page.textContent("#t-check-sum")), await page.textContent("#t-check-sum"));
  gbifDown = false; await page.click("#btn-t-check"); await sleep(800);
  check("summary", (await page.textContent("#t-check-sum")) === "1 of 6 names matched. Have a look at these:", await page.textContent("#t-check-sum"));
  const issues = await page.$$eval("#t-check-list li", ls => ls.map(l => l.textContent.replace(/\s+/g, " ").trim()));
  check("issues listed", issues.length === 5 && /Thymus drucei.*synonym/.test(issues[0]) && /Lotus corniculatis.*spelling slip.*Use Lotus corniculatus/.test(issues[1]) && /festuca rubra.*Usual spelling/.test(issues[2]) && /Cepaea sp\..*genus Cepaea/.test(issues[3]) && /Snails.*Common name, or not found/.test(issues[4]), issues.join(" || "));
  await page.click("#t-check-list li:nth-child(2) button"); await page.click("#t-check-list li:nth-child(3) button");
  check("suggestions applied", (await page.inputValue("#t-species")) === "Festuca ovina\nThymus drucei\nLotus corniculatus\nFestuca rubra\nCepaea sp.", JSON.stringify(await page.inputValue("#t-species")));
  const calls = gbifCalls; await page.click("#btn-t-check"); await sleep(600);
  check("repeat check uses cache for unchanged names", gbifCalls - calls === 2, gbifCalls - calls);
  await page.click("#btn-t-cancel");
  await page.click("#btn-tpl-edit"); await sleep(300);
  check("results cleared on reopen", (await page.$$("#t-check-list li")).length === 0 && (await page.inputValue("#t-species")) === "Festuca ovina\nThymus drucei\nLotus corniculatus", (await page.$$eval("#t-check-list li", l => l.map(x => x.textContent).join("/"))) + " " + JSON.stringify(await page.inputValue("#t-species")));
  await page.click("#btn-t-cancel");

  log("3. Recording");
  await page.fill("#s-site", "Castle Hill"); await page.fill("#s-surveyor", "OT");
  await page.click('#survey-form button[type="submit"]'); await sleep(800);
  check("custom form shown, others hidden", await page.isVisible("#custom-form") && !(await page.isVisible("#seagrass-form")) && !(await page.isVisible("#salt-form")));
  check("species buttons", (await page.$$eval("#cu-picker button", bs => bs.map(x => x.textContent).join("|"))) === "Festuca ovina|Thymus drucei|Lotus corniculatus");
  check("details rendered", (await page.$$("#cu-fields .field")).length === 4);
  await page.click('#cu-picker button[data-value="Festuca ovina"]'); await page.click('#cu-picker button[data-value="Thymus drucei"]');
  await page.fill('#cu-rows input[aria-label="Percent cover of Festuca ovina"]', "40");
  await page.click('#cu-rows .rrow:nth-child(2) .gbtn'); await page.click("#gs-grid button:nth-child(1)"); await page.click("#gs-grid button:nth-child(2)"); await page.click("#gs-done");
  check("grid sets cover", (await page.inputValue('#cu-rows input[aria-label="Percent cover of Thymus drucei"]')) === "8");
  await page.click("#btn-cu-other"); await page.fill("#cu-other-name", "Cirsium acaule"); await page.click("#btn-cu-other-add");
  await page.fill('#cu-rows input[aria-label="Percent cover of Cirsium acaule"]', "150");
  await page.click('#cu-rows .rrow:nth-child(1) .gbtn'); await sleep(200);
  check("other species' squares shaded, still tappable", (await page.$$eval("#gs-grid button.other", b => b.map(x => x.getAttribute("aria-label")).join())) === "Square 1,Square 2" && /Plants can overlap/.test(await page.textContent("#gs-hint")));
  await page.click("#gs-cancel");
  const fid = await page.$$eval("#cu-fields input, #cu-fields .seg", els => els.map(e => e.id || e.dataset.name));
  await page.fill("#" + fid[0], "12.5");
  await page.click('#cu-fields .seg button[data-value="S"]');
  await page.click('#cu-fields .seg button[data-value="yes"]');
  await page.click('#cu-fields .seg button[data-value="yes"]'); await page.click('#cu-fields .seg button[data-value="no"]');
  await page.fill("#f-notes", "Q1 notes");
  await page.click("#btn-save");
  check("Q1 saved", /Quadrat 1 saved/.test(await toast()), await page.textContent("#toast"));
  check("species kept for next quadrat, values cleared", (await page.$$eval("#cu-rows input", is => is.map(i => i.value).join("|"))) === "||");
  check("details cleared", (await page.inputValue("#" + fid[0])) === "" && (await page.$$('#cu-fields button[aria-pressed="true"]')).length === 0);
  await page.fill('#cu-rows input[aria-label="Percent cover of Festuca ovina"]', "20");
  await page.click("#btn-save"); check("Q2 saved", /Quadrat 2 saved/.test(await toast()));
  await page.click('#cu-picker button[data-value="Festuca ovina"]'); await page.click('#cu-picker button[data-value="Thymus drucei"]'); await page.click('#cu-picker button[data-value="Cirsium acaule"]');
  await page.click("#btn-save"); check("empty quadrat asks first", /Tap Save again/.test(await toast()));
  await page.click("#btn-save"); check("empty quadrat saved on second tap", /Quadrat 3 saved/.test(await toast()));

  log("4. Data view and editing");
  await page.click('.tabs button[data-tab="data"]'); await sleep(400);
  const items = await page.$$eval("#qlist li", ls => ls.map(l => l.textContent.replace(/\s+/g, " ").trim()));
  check("data list", items.length === 3 && /Soil depth 12.5 cm/.test(items[0]) && /Aspect S/.test(items[0]) && /Grazed no/.test(items[0]), items.join(" || "));
  check("taxa stat", (await page.textContent("#st-mean")) === "3", await page.textContent("#st-mean"));
  await page.click("#qlist li:nth-child(1) button"); await sleep(400);
  check("edit loads species", (await page.inputValue('#cu-rows input[aria-label="Percent cover of Cirsium acaule"]')) === "100" && (await page.inputValue('#cu-rows input[aria-label="Percent cover of Thymus drucei"]')) === "8");
  check("edit loads details", (await page.inputValue("#" + fid[0])) === "12.5" && (await page.getAttribute('#cu-fields .seg button[data-value="S"]', "aria-pressed")) === "true");
  await page.fill('#cu-rows input[aria-label="Percent cover of Festuca ovina"]', "45");
  await page.click("#btn-save"); check("edit saved", /Changes saved to quadrat 1/.test(await toast()));

  log("5. Share the template, then edit it (survey keeps its copy)");
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-custom");
  await page.click("#btn-tpl-edit");
  check("editor loads", (await page.inputValue("#t-name")) === "Chalk grassland" && (await page.$$("#t-fields .tfield")).length === 4);
  const tfile = await dl("#btn-t-share", "shared.json");
  const shared = JSON.parse(fs.readFileSync(tfile, "utf8"));
  check("template file", shared.kind === "survey-template" && shared.template.species.length === 3 && shared.template.fields[1].options.join() === "N,E,S,W", JSON.stringify(shared.template.fields[1]));
  check("file name", (await (async () => fs.existsSync(tfile))()) && true);
  await page.fill("#t-species", "Festuca ovina\nThymus drucei\nLotus corniculatus\nPlantago media");
  await page.click("#btn-t-save"); await sleep(400);
  check("summary updated", /4 species/.test(await page.textContent("#tpl-summary")));

  log("6. Import a template file");
  await page.setInputFiles("#f-tpl-import", path.join(OUT, "not-a-template.json")); check("bad file refused", /isn't a QuadratNotes template/.test(await toast()));
  await page.setInputFiles("#f-tpl-import", path.join(OUT, "dune.quadratnotes-template.json")); check("imported", /Added template Dune slack/.test(await toast()));
  check("picker shows both, imported selected", (await page.$$eval("#s-template option", o => o.map(x => x.textContent).join("|"))) === "Chalk grassland|Dune slack" && (await page.inputValue("#s-template")) === "dune-1");
  check("imported cleaned", (await page.textContent("#tpl-summary")) === "Present / absent, 2 species, 2 quadrat details", await page.textContent("#tpl-summary"));
  await page.setInputFiles("#f-tpl-import", path.join(OUT, "dune.quadratnotes-template.json")); check("re-import updates", /Updated template Dune slack/.test(await toast()));

  log("7. Presence survey");
  await page.fill("#s-site", "Braunton Burrows"); await page.click('#survey-form button[type="submit"]'); await sleep(800);
  check("presence hint", /Species you don't tap are recorded as absent/.test(await page.textContent("#cu-empty")) && (await page.$$("#cu-rows .rrow")).length === 0);
  await page.click('#cu-picker button[data-value="Salix repens"]');
  await page.click('#cu-fields .seg button[data-value="yes"]');
  await page.click("#btn-save"); check("presence Q1 saved", /Quadrat 1 saved/.test(await toast()));
  check("presence selection cleared", (await page.$$('#cu-picker button[aria-pressed="true"]')).length === 0);
  await page.click('#cu-picker button[data-value="Epipactis palustris"]');
  await page.click("#btn-save"); check("presence Q2 saved", /Quadrat 2 saved/.test(await toast()));
  await page.click('.tabs button[data-tab="export"]'); await sleep(300);
  unzip(await dl("#btn-zip", "dune.zip"), OUT + "/dune");
  const dsp = csv(findFile(OUT + "/dune", /species\.csv$/));
  const pi = dsp[0].indexOf("presence"), si = dsp[0].indexOf("species");
  check("presence and absence rows", dsp.slice(1).map(r => r[si] + "=" + r[pi]).join(" ") === "Salix repens=1 Epipactis palustris=0 Salix repens=0 Epipactis palustris=1", dsp.slice(1).map(r => r[si] + "=" + r[pi]).join(" "));
  const dq = csv(findFile(OUT + "/dune", /quadrats\.csv$/));
  check("yes/no detail column", dq[0].includes("cf_standing_water") && dq[1][dq[0].indexOf("cf_standing_water")] === "yes" && dq[2][dq[0].indexOf("cf_standing_water")] === "", dq[0].slice(-3).join());

  log("8. Cover scale template (Braun-Blanquet)");
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-custom"); await page.click("#btn-tpl-new");
  await page.fill("#t-name", "Heath BB"); await page.click('.seg[data-name="tmeasure"] button[data-value="scale"]');
  check("scale options shown", await page.isVisible("#t-scale-seg"));
  await page.click('.seg[data-name="tmeasure"] button[data-value="scale"]');
  check("measure doesn't toggle off", (await page.getAttribute('.seg[data-name="tmeasure"] button[data-value="scale"]', "aria-pressed")) === "true");
  await page.click('.seg[data-name="tscale"] button[data-value="bb"]');
  await page.fill("#t-species", "Calluna vulgaris\nErica cinerea");
  await page.fill("#t-counts", "Snails\ncalluna vulgaris");
  await page.click("#btn-t-save"); check("same name in both lists refused", /both lists/.test(await toast()));
  await page.fill("#t-counts", "Snails\nSnails");
  await page.click("#btn-t-save"); await sleep(300);
  check("summary with counts", (await page.textContent("#tpl-summary")) === "Braun-Blanquet scale, 2 species, 1 counted, 0 quadrat details".replace(", 0 quadrat details", ""), await page.textContent("#tpl-summary"));
  await page.fill("#s-site", "Dartmoor"); await page.click('#survey-form button[type="submit"]'); await sleep(800);
  await page.click('#cu-picker button[data-value="Calluna vulgaris"]'); await page.click('#cu-picker button[data-value="Erica cinerea"]');
  await page.selectOption('#cu-rows select[aria-label="Braun-Blanquet class for Calluna vulgaris"]', "4");
  await page.click("#btn-save"); check("class required", /Pick a Braun-Blanquet class for Erica cinerea/.test(await toast()));
  await page.selectOption('#cu-rows select[aria-label="Braun-Blanquet class for Erica cinerea"]', "+");
  check("count block shown", await page.isVisible("#cu-count-block") && (await page.$$eval("#cu-cpicker button", b => b.map(x => x.textContent).join("|"))) === "Snails");
  await page.click('#cu-cpicker button[data-value="Snails"]'); await page.fill('#cu-crows input[aria-label="Count of Snails"]', "3");
  await page.click("#btn-cu-cother"); await page.fill("#cu-cother-name", "Calluna vulgaris"); await page.click("#btn-cu-cother-add");
  check("can't count a listed species", /already in the species list/.test(await toast()));
  await page.fill("#cu-cother-name", "Ants"); await page.press("#cu-cother-name", "Enter");
  check("field-added count focused", (await page.evaluate(() => document.activeElement.getAttribute("aria-label"))) === "Count of Ants");
  await page.keyboard.type("5");
  await page.click("#btn-cu-cother"); await page.fill("#cu-cother-name", "snail"); await page.click("#btn-cu-cother-add");
  check("'snail' matched to Snails", /Added Snails/.test(await toast()) && (await page.$$eval("#cu-cpicker button", b => b.length)) === 2);
  await page.click("#btn-save"); check("scale Q1 saved", /Quadrat 1 saved/.test(await toast()));
  check("counts stay listed, cleared", (await page.$$eval("#cu-cpicker button", b => b.map(x => x.textContent).join("|"))) === "Snails|Ants" && (await page.$$eval("#cu-crows input", i => i.map(x => x.value).join("|"))) === "|");
  await page.click('#cu-picker button[data-value="Calluna vulgaris"]'); await page.click('#cu-picker button[data-value="Erica cinerea"]');
  await page.click("#btn-save"); check("scale Q2 saved (counts 0 = absent)", /Quadrat 2 saved/.test(await toast()));
  await page.click('.tabs button[data-tab="export"]'); await sleep(300);
  unzip(await dl("#btn-zip", "bb.zip"), OUT + "/bb");
  const bsp = csv(findFile(OUT + "/bb", /species\.csv$/));
  const B = bsp[0];
  check("braun_blanquet + counts", bsp.slice(1).map(r => r[B.indexOf("quadrat")] + ":" + r[B.indexOf("species")] + "=" + (r[B.indexOf("braun_blanquet")] || r[B.indexOf("count")])).join(" ") === "1:Calluna vulgaris=4 1:Erica cinerea=+ 1:Snails=3 1:Ants=5 2:Calluna vulgaris=4 2:Erica cinerea=+ 2:Snails=0 2:Ants=0".replace("2:Calluna vulgaris=4 2:Erica cinerea=+ ", ""), bsp.slice(1).map(r => r.join("|")).join(" || "));

  log("9. Count template");
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-custom"); await page.click("#btn-tpl-new");
  await page.fill("#t-name", "Orchid count"); await page.click('.seg[data-name="tmeasure"] button[data-value="count"]');
  await page.fill("#t-species", "Anacamptis pyramidalis");
  await page.click("#btn-t-save"); await sleep(300);
  await page.fill("#s-site", "Castle Hill"); await page.click('.seg[data-name="qsize"] button[data-value="1"]');
  if ((await page.getAttribute('.seg[data-name="design"] button[data-value="transect"]', "aria-pressed")) !== "true") await page.click('.seg[data-name="design"] button[data-value="transect"]');
  await page.click('#survey-form button[type="submit"]'); await sleep(800);
  await page.fill("#f-transect", "T1"); await page.focus("#f-notes"); await sleep(400); await page.fill("#f-dist", "10");
  await page.click('#cu-picker button[data-value="Anacamptis pyramidalis"]');
  await page.fill('#cu-rows input[aria-label="Count of Anacamptis pyramidalis"]', "7.6");
  await page.click("#btn-save"); check("count saved", /Quadrat 1 saved/.test(await toast()));

  log("10. All-surveys export and Darwin Core");
  await page.click('.tabs button[data-tab="export"]'); await sleep(300);
  await page.click('.seg[data-name="scope"] button[data-value="all"]').catch(() => {});
  unzip(await dl("#btn-zip", "all.zip"), OUT + "/all");
  const aq = csv(findFile(OUT + "/all", /quadrats\.csv$/)), H = aq[0];
  const tdir = fs.existsSync(OUT + "/all/templates") ? fs.readdirSync(OUT + "/all/templates").sort() : [];
  check("template files in zip", tdir.join() === "chalk-grassland.quadratnotes-template.json,dune-slack.quadratnotes-template.json,heath-bb.quadratnotes-template.json,orchid-count.quadratnotes-template.json", tdir.join());
  const tj = JSON.parse(fs.readFileSync(OUT + "/all/templates/heath-bb.quadratnotes-template.json", "utf8"));
  check("template file re-importable shape", tj.kind === "survey-template" && tj.template.counts.join() === "Snails" && tj.template.scale === "bb");
  check("standard + detail columns", H[6] === "survey_template" && ["cf_soil_depth_cm", "cf_aspect", "cf_grazed", "cf_turf_height_cm", "cf_standing_water"].every(c => H.includes(c)), H.filter(c => c.startsWith("cf_")).join());
  const castle = aq.filter(r => r[2] === "Castle Hill" && r[H.indexOf("survey_template")] === "Chalk grassland");
  check("chalk rows", castle.length === 3 && castle[0][H.indexOf("cf_soil_depth_cm")] === "12.5" && castle[0][H.indexOf("cf_aspect")] === "S" && castle[0][H.indexOf("cf_grazed")] === "no" && castle[0][H.indexOf("habitat")] === "Custom survey" && castle[0][H.indexOf("region")] === "", castle[0] && castle[0].join("|"));
  check("n_species", castle.map(r => r[H.indexOf("n_species")]).join() === "3,1,0", castle.map(r => r[H.indexOf("n_species")]).join());
  const asp = csv(findFile(OUT + "/all", /species\.csv$/)), S = asp[0];
  const ch = asp.filter(r => r[S.indexOf("survey_id")] === castle[0][0]);
  check("chalk cover rows", ch.filter(r => r[S.indexOf("quadrat")] === "1").map(r => r[S.indexOf("species")] + "=" + r[S.indexOf("species_cover_pct")] + "/" + r[S.indexOf("grid_squares")]).join(" ") === "Festuca ovina=45/ Thymus drucei=8/1;2 Cirsium acaule=100/",
    ch.filter(r => r[S.indexOf("quadrat")] === "1").map(r => r.join("|")).join(" || "));
  check("empty quadrat row", ch.some(r => r[S.indexOf("quadrat")] === "3" && r[S.indexOf("species")] === "None" && r[S.indexOf("species_cover_pct")] === ""));
  const orch = asp.find(r => r[S.indexOf("species")] === "Anacamptis pyramidalis");
  const oq = aq.find(r => r[H.indexOf("survey_template")] === "Orchid count");
  check("transect on custom survey", oq && oq[H.indexOf("transect")] === "T1" && oq[H.indexOf("distance_from_start_m")] === "10" && oq[H.indexOf("sampling_design")] === "transect", oq && oq.join("|"));
  check("count rounded, density", orch && orch[S.indexOf("count")] === "8" && orch[S.indexOf("count_density_m2")] === "8", orch && orch.join("|"));
  // Darwin Core
  await page.click(".more-formats summary").catch(() => {});
  if (!(await page.isVisible("#btn-dwc"))) await page.click("#btn-show-dwc").catch(() => {});
  let dwcOk = true;
  try { unzip(await dl("#btn-dwc", "dwc.zip"), OUT + "/dwc"); } catch (e) { dwcOk = false; log("   dwc download:", e.message); }
  if (dwcOk) {
    const tsv = f => fs.readFileSync(findFile(OUT + "/dwc", f), "utf8").trim().split("\n").map(l => l.split("\t"));
    const ev = tsv(/event\.txt$/), oc = tsv(/occurrence\.txt$/), mf = tsv(/extendedmeasurementorfact\.txt$/);
    const E = ev[0], O = oc[0], M = mf[0];
    check("event habitat and protocol", ev.some(r => r[E.indexOf("habitat")] === "Chalk grassland" && /using the "Chalk grassland" template, species scored as percent cover/.test(r[E.indexOf("samplingProtocol")])),
      ev.filter(r => /Chalk/.test(r.join())).slice(0, 2).map(r => r[E.indexOf("samplingProtocol")]).join(" || "));
    check("presence absences", oc.filter(r => /Epipactis/.test(r[O.indexOf("scientificName")])).map(r => r[O.indexOf("occurrenceStatus")]).join() === "absent,present");
    check("absent in Q2 for species seen elsewhere", oc.some(r => /Thymus drucei/.test(r[O.indexOf("scientificName")]) && r[O.indexOf("occurrenceStatus")] === "absent"));
    check("kingdom left blank", oc.slice(1).filter(r => /Festuca/.test(r.join())).every(r => r[O.indexOf("kingdom")] === ""));
    check("detail measurements", mf.some(r => r[M.indexOf("measurementType")] === "Soil depth" && r[M.indexOf("measurementValue")] === "12.5" && r[M.indexOf("measurementUnit")] === "cm") &&
      mf.some(r => r[M.indexOf("measurementType")] === "Standing water" && r[M.indexOf("measurementValue")] === "yes"));
    check("BB class measurement", mf.some(r => r[M.indexOf("measurementType")] === "Braun-Blanquet cover-abundance class" && r[M.indexOf("measurementValue")] === "+"));
    const eml = fs.readFileSync(findFile(OUT + "/dwc", /eml\.xml$/), "utf8");
    check("EML title for mixed templates", /<title xml:lang="en">Quadrat surveys: /.test(eml) && /surveyor's own template/.test(eml), (eml.match(/<title[^>]*>[^<]*/) || [""])[0]);
  }

  log("11. Backup carries templates");
  unzip(await dl("#btn-backup", "backup.zip"), OUT + "/backup");
  const bj = JSON.parse(fs.readFileSync(findFile(OUT + "/backup", /\.json$/), "utf8"));
  check("templates in backup", (bj.templates || []).map(t => t.name).sort().join() === "Chalk grassland,Dune slack,Heath BB,Orchid count");
  check("survey keeps its own copy", bj.sessions.find(x => x.site === "Castle Hill" && x.template && x.template.name === "Chalk grassland").template.species.length === 3);
  // Restore on a fresh phone
  const p2 = await ctx.browser().newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await p2.route(/tile\.openstreetmap|api\.web3forms\.com|api\.obis\.org|marinespecies\.org|open-meteo/, r => r.abort());
  const pg2 = await p2.newPage(); pg2.on("pageerror", e => errs.push("phone2: " + e.message));
  await pg2.goto("http://localhost:8791/"); await pg2.click('.tabs button[data-tab="export"]').catch(() => {});
  await pg2.setInputFiles("#f-restore", path.join(OUT, "backup.zip")); await sleep(1500);
  await pg2.click('.tabs button[data-tab="home"]'); await pg2.click("#btn-start-custom"); await sleep(300);
  check("templates restored", (await pg2.$$eval("#s-template option", o => o.map(x => x.textContent).join("|"))) === "Chalk grassland|Dune slack|Heath BB|Orchid count");

  log("12. Other habitats unaffected");
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-seagrass");
  check("seagrass setup normal", await page.isVisible("#region-field") && !(await page.isVisible("#custom-template-field")));
  await page.fill("#s-site", "Wilcove"); await page.click('#survey-form button[type="submit"]'); await sleep(800);
  check("seagrass form shown", await page.isVisible("#seagrass-form") && !(await page.isVisible("#custom-form")));
  await page.screenshot({ path: OUT + "/seagrass-after.png" });

  check("no page errors", errs.length === 0, errs.join(" ; "));
  log(fails ? fails + " FAILED" : "ALL PASSED");
  await b.close(); srv.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
