const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = process.env.QN_ROOT || require("path").resolve(__dirname, "../.."), OUT = process.argv[2] || require("path").join(require("os").tmpdir(), "qn-e2e", "plan");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const srv = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]));
  if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); });
}).listen(8765);
const log = (...a) => console.log(...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, geolocation: { latitude: 50.3125, longitude: -4.1050, accuracy: 4 },
    permissions: ["geolocation"], acceptDownloads: true, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/tile|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await ctx.route(/tile\.openstreetmap\.org/, r => r.abort());
  await page.goto("http://localhost:8765/");
  await page.click("#btn-start-rocky");
  await page.fill("#s-site", "Wembury test");
  await page.click('.seg[data-name="design"] button[data-value="random"]');
  log("tickbox visible:", await page.isVisible("#plan-check-wrap"));
  await page.click('.seg[data-name="design"] button[data-value="haphazard"]');
  log("tickbox hidden for haphazard:", !(await page.isVisible("#plan-check-wrap")));
  await page.click('.seg[data-name="design"] button[data-value="random"]');
  await page.check("#s-plan");
  await page.screenshot({ path: OUT + "/p0-setup.png", clip: { x: 0, y: 700, width: 390, height: 700 }, fullPage: true });
  await page.click('#survey-form button[type="submit"]');
  await page.waitForSelector("#view-plan:not(.hidden)");
  await page.waitForSelector(".leaflet-container");
  await sleep(800);
  const box = await page.locator("#plan-map").boundingBox();
  const pts = [[0.2, 0.25], [0.8, 0.2], [0.85, 0.75], [0.25, 0.8]];
  for (const [fx, fy] of pts) { await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy); await sleep(150); }
  log("area text:", await page.textContent("#plan-area"));
  await page.fill("#plan-n", "8");
  await page.fill("#plan-gap", "3");
  await page.click("#btn-plan-go");
  await sleep(300);
  log("result:", await page.textContent("#plan-result-text"));
  await page.evaluate(() => window.scrollTo(0, 0)); await sleep(2700); await page.screenshot({ path: OUT + "/p1-plan.png", fullPage: false });
  // tap map after points: should not add a corner
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  log("area after extra tap:", await page.textContent("#plan-area"));
  await page.click("#btn-plan-use");
  await page.waitForSelector("#view-record:not(.hidden)");
  await sleep(1200);
  log("start dist to p1 check");log("nav:", await page.textContent("#nav-title"), "|", await page.textContent("#nav-dist"), "|", await page.textContent("#nav-sub"));
  await page.screenshot({ path: OUT + "/p2-nav.png", clip: { x: 0, y: 0, width: 390, height: 520 } });
  const sess = await page.evaluate(() => new Promise(res => { const r = indexedDB.open("quadrat-notebook"); r.onsuccess = () => { const t = r.result.transaction("sessions").objectStore("sessions").getAll(); t.onsuccess = () => res(t.result); }; }));
  const plan = sess[0].plan;
  log("plan:", JSON.stringify({ method: plan.method, area: plan.areaM2, n: plan.n, gap: plan.gap, seed: plan.seed, npts: plan.points.length }));
  // all points inside polygon & spacing check done in node
  const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [yi, xi] = poly[i], [yj, xj] = poly[j]; if ((yi > pt[0]) !== (yj > pt[0]) && pt[1] < (xj - xi) * (pt[0] - yi) / (yj - yi) + xi) c = !c; } return c; };
  const R = 6371008.8, rad = d => d * Math.PI / 180;
  const dm = (a, b) => { const h = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  let minGap = Infinity;
  plan.points.forEach((p, i) => plan.points.forEach((q, j) => { if (i < j) minGap = Math.min(minGap, dm([p.lat, p.lon], [q.lat, q.lon])); }));
  log("all inside:", plan.points.every(p => inPoly([p.lat, p.lon], plan.corners)), "min spacing m:", minGap.toFixed(2));
  // walk to point 1 (offset ~2 m)
  const p1 = plan.points[0];
  await ctx.setGeolocation({ latitude: p1.lat + 0.00001, longitude: p1.lon, accuracy: 4 });
  await sleep(1500);
  log("at p1:", await page.textContent("#nav-title"), "| arrived class:", await page.getAttribute("#nav-card", "class"));
  await page.screenshot({ path: OUT + "/p3-arrived.png", clip: { x: 0, y: 0, width: 390, height: 420 } });
  // record a rocky quadrat: tap first species chip if needed
  await page.fill("#f-bare", "40"); await page.click("#btn-save");
  await sleep(600);
  log("toast:", await page.textContent("#toast"));
  log("nav now:", await page.textContent("#nav-title"), "|", await page.textContent("#nav-left"));
  // skip point 2
  await page.click("#btn-nav-skip");
  await page.click('.seg[data-name="skipwhy"] button[data-value="submerged"]');
  await page.click("#btn-skip-ok");
  await sleep(300);
  log("after skip:", await page.textContent("#toast"), "|", await page.textContent("#nav-title"), "|", await page.textContent("#nav-left"));
  // save far away: not linked
  await ctx.setGeolocation({ latitude: 50.33, longitude: -4.10, accuracy: 5 });
  await sleep(1500);
  await page.fill("#f-bare", "40"); await page.click("#btn-save");
  await sleep(500);
  log("far toast:", await page.textContent("#toast"));
  // map view
  await page.click("#btn-nav-map");
  await sleep(900);
  log("view sum:", await page.textContent("#plan-view-sum"));
  await page.screenshot({ path: OUT + "/p4-mapview.png" });
  await page.click("#btn-plan-back");
  // exports
  await page.click('.tabs button[data-tab="export"]');
  await page.click("details.more-formats summary, #view-export details summary").catch(() => {});
  for (const id of ["#btn-geojson", "#btn-kml"]) {
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click(id)]);
    const f = OUT + "/" + dl.suggestedFilename(); await dl.saveAs(f); log("saved", f);
  }
  const [dz] = await Promise.all([page.waitForEvent("download"), page.click("#btn-zip")]);
  await dz.saveAs(OUT + "/" + dz.suggestedFilename()); log("zip", dz.suggestedFilename());
  log("errors:", errs.length ? errs : "none");
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
