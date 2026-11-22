// Fixed points: mark with GPS averaging, import CSV/GeoJSON/KML, tap the map, guidance and linking,
// skip, exports, copying to a later survey and re-importing the downloaded points file.
// Test files are written to OUT by the script itself.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = process.env.QN_ROOT || require("path").resolve(__dirname, "../.."), OUT = process.argv[2] || require("path").join(require("os").tmpdir(), "qn-e2e", "fixed");
fs.mkdirSync(OUT, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8788);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const files = {
  "plots.csv": "point_id,latitude,longitude\nA1,52.8713000,-4.6121000\nA2,52.8714000,-4.6119000\nP01,52.8700000,-4.6100000\nBAD,abc,-4.6\nGRID,252000,341000\n",
  "plots.geojson": JSON.stringify({ type: "FeatureCollection", features: [
    { type: "Feature", properties: { name: "G1" }, geometry: { type: "Point", coordinates: [-4.6118, 52.8715] } },
    { type: "Feature", properties: { name: "Line" }, geometry: { type: "LineString", coordinates: [[-4.61, 52.87], [-4.62, 52.88]] } }] }),
  "plots.kml": '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>K1</name><Point><coordinates>-4.6117,52.8716,0</coordinates></Point></Placemark></Document></kml>',
  "bng.csv": "site,easting,northing\nS1,252000,341000\n",
  "nohead.csv": "52.8720,-4.6130,N1\n52.8721,-4.6131,N2\n"
};
Object.entries(files).forEach(([n, c]) => fs.writeFileSync(path.join(OUT, n), c));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 52.8712, longitude: -4.6123, accuracy: 4 }, permissions: ["geolocation"], serviceWorkers: "block", acceptDownloads: true });
  await ctx.route(/tile\.openstreetmap/, r => r.abort());
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  const toast = async () => { await sleep(250); return page.textContent("#toast"); };
  const pickDesign = async v => { const sel = '.seg[data-name="design"] button[data-value="' + v + '"]'; if ((await page.getAttribute(sel, "aria-pressed")) !== "true") await page.click(sel); };
  const names = () => page.$$eval("#fx-list li b", els => els.map(e => e.textContent).join(","));
  await page.goto("http://localhost:8788/");
  // 1. start a fixed-plot survey with guidance
  await page.click("#btn-start-seagrass"); await page.fill("#s-site", "Porth Dinllaen");
  await pickDesign("fixed");
  log("1. fixed option shown:", await page.isVisible("#s-fixed"), "| random option hidden:", !(await page.isVisible("#s-plan")));
  await page.check("#s-fixed"); await page.click('#survey-form button[type="submit"]'); await sleep(1200);
  log("   opened fixed view:", await page.isVisible("#view-fixed"), "| next name:", await page.inputValue("#fx-label"), "| map:", await page.locator("#fx-map .leaflet-container, #fx-map.leaflet-container").count());
  // 2. mark here with averaging: three readings
  await page.click("#btn-fx-mark"); await sleep(300);
  for (const [la, lo, acc] of [[52.87121, -4.61231, 3], [52.87119, -4.61229, 5], [52.87120, -4.61230, 2]]) { await ctx.setGeolocation({ latitude: la, longitude: lo, accuracy: acc }); await sleep(600); }
  log("2. averaging panel:", await page.textContent("#fx-avg-text"));
  await page.click("#btn-fx-avg-stop"); log("   saved:", await toast());
  log("   list:", await page.textContent("#fx-list li small"));
  // duplicate name refused
  await page.fill("#fx-label", "P01"); await page.click("#btn-fx-mark"); log("   duplicate name:", await toast());
  // 3. imports
  const imp = async f => { await page.setInputFiles("#fx-file", path.join(OUT, f)); return toast(); };
  log("3. CSV:", await imp("plots.csv"));
  log("   GeoJSON:", await imp("plots.geojson"));
  log("   KML:", await imp("plots.kml"));
  log("   BNG only:", await imp("bng.csv"));
  log("   no header:", await imp("nohead.csv"));
  log("   names now:", await names());
  // 4. tap the map
  await page.check("#fx-tap"); await page.fill("#fx-label", "T1");
  const mb = await page.locator("#fx-map").boundingBox();
  await page.mouse.click(mb.x + mb.width * 0.3, mb.y + mb.height * 0.7); log("4. map tap:", await toast());
  await page.uncheck("#fx-tap");
  await page.screenshot({ path: OUT + "/fixed-view.png", fullPage: true });
  // 5. go to A1, record a quadrat there
  await page.click('#fx-list button[aria-label="Go to A1"]'); await sleep(400);
  log("5. record view nav:", await page.textContent("#nav-title"));
  await ctx.setGeolocation({ latitude: 52.8713001, longitude: -4.6121002, accuracy: 3 }); await sleep(800);
  log("   arrived:", await page.textContent("#nav-title"), "|", await page.textContent("#nav-dist"));
  await page.fill("#f-cover", "35"); await page.click("text=Z. marina"); await page.click("#btn-save"); await sleep(700);
  log("   saved:", await page.textContent("#toast"), "| next target:", await page.textContent("#nav-title"));
  // 6. skip current target
  const skipName = (await page.textContent("#nav-title")).replace("Go to ", "");
  await page.click("#btn-nav-skip"); await page.click('.seg[data-name="skipwhy"] button[data-value="submerged"]'); await page.click("#btn-skip-ok"); log("6. skip:", await toast());
  // pick list shows names
  log("   picker:", await page.$$eval("#nav-pick option", o => o.slice(0, 4).map(x => x.textContent).join(" | ")));
  // Map button opens fixed view
  await page.click("#btn-nav-map"); await sleep(400); log("   Map button opens fixed view:", await page.isVisible("#view-fixed"));
  // 7. exports
  const [d1] = await Promise.all([page.waitForEvent("download"), page.click("#btn-fx-download")]); await d1.saveAs(OUT + "/fixed_points.csv");
  const fxcsv = fs.readFileSync(OUT + "/fixed_points.csv", "utf8").trim().split(/\r?\n/);
  log("7. points file:", fxcsv.length - 1, "points | header:", fxcsv[0]);
  log("   rows:", fxcsv.slice(1, 4).join(" || "));
  await page.click('.tabs button[data-tab="export"]'); await sleep(300);
  const [d2] = await Promise.all([page.waitForEvent("download"), page.click("#btn-zip")]); await d2.saveAs(OUT + "/export.zip");
  await page.click(".more-formats summary");
  const [d3] = await Promise.all([page.waitForEvent("download"), page.click("#btn-kml")]); await d3.saveAs(OUT + "/map.kml");
  const kml = fs.readFileSync(OUT + "/map.kml", "utf8");
  log("   KML fixed folder:", kml.includes("<name>Fixed points</name>"), "| A1 placemark:", kml.includes("<name>A1</name>"));
  // 8. later survey: copy points
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-seagrass"); await page.fill("#s-site", "Porth Dinllaen");
  await pickDesign("fixed"); await page.check("#s-fixed"); await page.click('#survey-form button[type="submit"]'); await sleep(1200);
  log("8. copy options:", await page.$$eval("#fx-copy option", o => o.map(x => x.textContent).join(" | ")));
  const val = await page.$eval("#fx-copy option:nth-child(2)", o => o.value);
  await page.selectOption("#fx-copy", val); log("   copy:", await toast(), "| statuses all to visit:", await page.$$eval("#fx-list small", s => s.every(x => !/done|skipped/.test(x.textContent))));
  // 9. third survey: re-import the downloaded points file
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-seagrass"); await page.fill("#s-site", "Porth Dinllaen B");
  await pickDesign("fixed"); await page.check("#s-fixed"); await page.click('#survey-form button[type="submit"]'); await sleep(1200);
  log("9. re-import own file:", await imp("fixed_points.csv"), "| names:", await names());
  // removing needs a second tap
  const before = (await names()).split(",").length;
  await page.click('#fx-list button[aria-label="Remove T1"]'); await sleep(200);
  const mid = (await names()).split(",").length;
  await page.click('#fx-list button[aria-label="Remove T1"]'); await sleep(300);
  log("   remove asks first:", before === mid, "| removed after second tap:", (await names()).split(",").length === before - 1);
  // 10. a fixed-plot survey without guidance shows the set-up link
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-seagrass"); await page.fill("#s-site", "No points");
  await pickDesign("fixed"); await page.uncheck("#s-fixed"); await page.click('#survey-form button[type="submit"]'); await sleep(800);
  log("10. set-up link on record view:", await page.isVisible("#btn-fixed-later"), "| nav card hidden:", !(await page.isVisible("#nav-card")));
  log("errors:", errs.length ? errs : "none");
  await b.close(); srv.close(); process.exit(0);
})();
