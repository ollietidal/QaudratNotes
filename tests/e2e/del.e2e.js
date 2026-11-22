const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = process.env.QN_ROOT || require("path").resolve(__dirname, "../.."), OUT = process.argv[2] || require("path").join(require("os").tmpdir(), "qn-e2e", "del");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8771);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 50.31, longitude: -4.1, accuracy: 5 }, permissions: ["geolocation"], serviceWorkers: "block" });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  const count = st => page.evaluate(s => new Promise(res => { const r = indexedDB.open("quadrat-notebook"); r.onsuccess = () => { const t = r.result.transaction(s).objectStore(s).count(); t.onsuccess = () => res(t.result); }; }), st);
  const start = async site => { await page.click('.tabs button[data-tab="home"]').catch(() => {}); await page.goto("http://localhost:8771/"); await page.click("#btn-start-rocky"); await page.fill("#s-site", site); await page.click('#survey-form button[type="submit"]'); await sleep(600); };
  await page.goto("http://localhost:8771/");
  // 1: accidental empty survey
  await start("Oops");
  log("1. link shown on empty survey:", await page.isVisible("#btn-del-empty"));
  await page.screenshot({ path: OUT + "/d1.png", clip: { x: 0, y: 0, width: 390, height: 300 } });
  await page.click("#btn-del-empty"); await sleep(400);
  log("   toast:", await page.textContent("#toast"), "| surveys left:", await count("sessions"), "| on survey screen:", await page.isVisible("#view-survey"), "| header:", await page.textContent("#top-site"));
  // 2: survey with quadrats + photo, delete from Data tab
  await start("Real one");
  log("2. link hidden? (empty yet):", await page.isVisible("#btn-del-empty"));
  await page.setInputFiles("#f-gallery", ROOT + "/icon-192.png"); await sleep(700);
  await page.fill("#f-bare", "30"); await page.click("#btn-save"); await sleep(500);
  log("   link hidden after first quadrat:", !(await page.isVisible("#btn-del-empty")));
  await page.fill("#f-bare", "20"); await page.click("#btn-save"); await sleep(500);
  log("   before: sessions", await count("sessions"), "quadrats", await count("quadrats"), "photos", await count("photos"));
  await page.click('.tabs button[data-tab="data"]'); await sleep(400);
  await page.click("#btn-del-survey"); log("   first tap:", await page.textContent("#btn-del-survey"));
  await page.click("#btn-del-survey"); await sleep(500);
  log("   toast:", await page.textContent("#toast"), "| after: sessions", await count("sessions"), "quadrats", await count("quadrats"), "photos", await count("photos"));
  // 3: survey list delete of a non-open survey
  await start("Keep me"); await page.fill("#f-bare", "10"); await page.click("#btn-save"); await sleep(400);
  await start("Delete me"); 
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-rocky"); await sleep(300);
  await page.screenshot({ path: OUT + "/d2.png", fullPage: true });
  const delKeep = page.locator('#survey-list li', { hasText: "Keep me" }).locator("button.btn-danger");
  await delKeep.click(); log("3. first tap on 'Keep me' (1 quadrat):", await delKeep.textContent());
  await sleep(4300); log("   resets after 4 s:", await delKeep.textContent());
  const delMe = page.locator('#survey-list li', { hasText: "Delete me" }).locator("button.btn-danger");
  await delMe.click(); await delMe.click(); await sleep(500);
  log("   list now:", (await page.locator("#survey-list strong").allTextContents()).join(", "), "| header:", await page.textContent("#top-site"));
  log("errors:", errs.length ? errs : "none"); await b.close(); srv.close();
})();
