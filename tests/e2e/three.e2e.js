const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = process.env.QN_ROOT || require("path").resolve(__dirname, "../.."), OUT = process.argv[2] || require("path").join(require("os").tmpdir(), "qn-e2e", "three");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8775);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, geolocation: { latitude: 50.3123, longitude: -4.1071, accuracy: 4 }, permissions: ["geolocation"], serviceWorkers: "block" });
  await ctx.route(/tile\.openstreetmap/, r => r.abort());
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:8775/");
  // 1+2: random points survey opens centred on you
  await page.click("#btn-start-seagrass"); await page.fill("#s-site", "Plan test");
  await page.click('.seg[data-name="design"] button[data-value="random"]'); await page.check("#s-plan");
  await page.click('#survey-form button[type="submit"]'); await page.waitForSelector(".leaflet-container"); await sleep(1500);
  const centre = () => page.evaluate(() => { const m = document.querySelector("#plan-map"); return null; });
  log("map view:", await page.textContent("#plan-gps"), "| locate button:", await page.locator(".locate-me").count());
  await page.screenshot({ path: OUT + "/map.png", clip: { x: 0, y: 0, width: 390, height: 700 } });
  // pan away using keyboard-free drag
  const box = await page.locator("#plan-map").boundingBox();
  await page.mouse.move(box.x + 200, box.y + 200); await page.mouse.down(); await page.mouse.move(box.x + 20, box.y + 40, { steps: 8 }); await page.mouse.up(); await sleep(300);
  const youX = async () => { const el = page.locator(".leaflet-overlay-pane path").last(); const bb = await el.boundingBox(); return bb ? Math.round(bb.x + bb.width / 2 - box.x) + "," + Math.round(bb.y + bb.height / 2 - box.y) : "none"; };
  log("blue dot after panning away (map px):", await youX());
  await page.click(".locate-me"); await sleep(500);
  log("blue dot after zoom-to-me (map centre is " + Math.round(box.width / 2) + "," + Math.round(box.height / 2) + "):", await youX());
  log("areas still 0 corners:", await page.textContent("#plan-area"));
  // 3: back from an empty survey restores the form
  await page.click("#btn-plan-skip"); await sleep(300);
  log("back link on plan survey (should be hidden):", await page.isVisible("#btn-del-empty"));
  await page.click('.tabs button[data-tab="home"]'); await page.click("#btn-start-rocky"); await sleep(200);
  await page.fill("#s-site", "Wembury"); await page.fill("#s-surveyor", "ORT");
  await page.click('.seg[data-name="qsize"] button[data-value="1"]'); await page.click('.seg[data-name="design"] button[data-value="transect"]');
  await page.fill("#s-notes", "neap tide"); await page.click('#survey-form button[type="submit"]'); await sleep(600);
  log("back link shown:", await page.isVisible("#btn-del-empty"), "|", await page.textContent("#btn-del-empty"));
  await page.screenshot({ path: OUT + "/back.png", clip: { x: 0, y: 0, width: 390, height: 260 } });
  await page.click("#btn-del-empty"); await sleep(500);
  log("on setup:", await page.isVisible("#view-survey"), "| title:", await page.textContent("#h-survey"), "| site:", await page.inputValue("#s-site"), "| surveyor:", await page.inputValue("#s-surveyor"), "| notes:", await page.inputValue("#s-notes"));
  log("qsize:", await page.getAttribute('.seg[data-name="qsize"] button[aria-pressed="true"]', "data-value"), "| design:", await page.getAttribute('.seg[data-name="design"] button[aria-pressed="true"]', "data-value"));
  log("surveys listed:", (await page.locator("#survey-list strong").allTextContents()).join(", "), "| header:", await page.textContent("#top-site"));
  // start again from the refilled form
  await page.click('#survey-form button[type="submit"]'); await sleep(600);
  log("restarted:", await page.textContent("#top-site"));
  log("errors:", errs.length ? errs : "none"); await b.close(); srv.close();
})();
