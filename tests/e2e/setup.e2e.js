const { chromium, devices } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
// "Get set up" card on the home screen: right steps per device, hidden by Done, never shown when installed.
const ROOT = process.env.QN_ROOT || path.resolve(__dirname, "../..");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8802);
let fails = 0; const check = (label, ok) => { if (!ok) fails++; console.log((ok ? "  ok   " : "  FAIL ") + label); };
(async () => {
  const b = await chromium.launch();
  for (const [name, opts] of [["iphone", devices["iPhone 13"]], ["android", devices["Pixel 7"]], ["desktop", { viewport: { width: 1100, height: 900 } }]]) {
    const ctx = await b.newContext({ ...opts, serviceWorkers: "block" });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:8802/"); await page.waitForSelector("#card-custom", { state: "attached" }); await page.waitForTimeout(600);
    const vis = await page.isVisible("#setup-card");
    const step = vis ? await page.textContent("#setup-step-install") : "";
    console.log(name, "| step 1:", step);
    check(name + ": card shown with its own steps", vis && (name === "iphone" ? /Add to Home Screen/.test(step) : name === "android" ? /Install app/.test(step) : /on your phone/.test(step)));
    check(name + ": no page errors", !errs.length);
    if (vis) {
      check(name + ": steps folded away until tapped", !(await page.isVisible("#setup-steps")));
      await page.click("#setup-card .info-btn");
      check(name + ": steps open on tap", await page.isVisible("#setup-steps"));
    }
    if (name === "iphone") {
      await page.click("#btn-setup-done"); await page.waitForTimeout(300);
      await page.reload(); await page.waitForTimeout(800);
      check("hidden after Done, also after reload", !(await page.isVisible("#setup-card")));
    }
    await ctx.close();
  }
  // installed (standalone) on Android: never shown
  const ctx2 = await b.newContext({ ...devices["Pixel 7"], serviceWorkers: "block" });
  await ctx2.addInitScript(() => { const mm = window.matchMedia.bind(window); window.matchMedia = q => q.includes("standalone") ? { matches: true, addEventListener() {}, removeEventListener() {} } : mm(q); });
  const p2 = await ctx2.newPage(); await p2.goto("http://localhost:8802/"); await p2.waitForTimeout(800);
  check("never shown in the installed app", !(await p2.isVisible("#setup-card")));
  console.log(fails ? fails + " FAILED" : "ALL PASSED");
  await b.close(); srv.close();
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
