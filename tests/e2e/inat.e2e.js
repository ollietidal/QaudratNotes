// Photo details for iNaturalist: export a zip and check each photo carries its quadrat's
// GPS position, time and species list as EXIF. Read the result with check-exif.py.
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = process.env.QN_ROOT || require("path").resolve(__dirname, "../.."), OUT = process.argv[2] || require("path").join(require("os").tmpdir(), "qn-e2e", "inat");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8783);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 52.8712345, longitude: -4.6123456, accuracy: 3.5 }, permissions: ["geolocation"], serviceWorkers: "block", acceptDownloads: true, timezoneId: "Europe/London" });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:8783/");
  await page.click("#btn-start-seagrass"); await page.fill("#s-site", "Porth Llŷn");
  await page.click('#survey-form button[type="submit"]'); await sleep(1500);
  // Q1: live GPS, two species, one photo
  await page.fill("#f-cover", "40"); await page.click("text=Z. marina"); await page.click("text=Z. noltei");
  await page.setInputFiles("#f-gallery", ROOT + "/docs/social-preview.jpg"); await sleep(800);
  await page.click("#btn-save"); await sleep(700); console.log("save:", await page.textContent("#toast"));
  // Q2: no position, one photo
  await page.fill("#f-lat", ""); await page.fill("#f-lon", "");
  await page.fill("#f-cover", "15"); await page.click("text=Z. marina");
  await page.setInputFiles("#f-gallery", ROOT + "/icon-512.png"); await sleep(800);
  await page.click("#btn-save"); await sleep(700); console.log("save:", await page.textContent("#toast"));
  await page.click('.tabs button[data-tab="export"]'); await sleep(300);
  console.log("note shown:", await page.isVisible("#inat-hint"));
  console.log("quadrats:", await page.textContent("#storage-line"));
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }).catch(async e => { console.log("toast:", await page.textContent("#toast"), "| errs:", errs); throw e; }), page.click("#btn-zip")]);
  await dl.saveAs(OUT + "/export.zip");
  console.log("zip saved; errors:", errs.length ? errs : "none");
  await b.close(); srv.close(); process.exit(0);
})();
