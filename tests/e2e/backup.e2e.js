const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = process.env.QN_ROOT || require("path").resolve(__dirname, "../.."), OUT = process.argv[2] || require("path").join(require("os").tmpdir(), "qn-e2e", "backup");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8770);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const errs = [];
async function phone(browser, lat) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: lat, longitude: -4.1, accuracy: 5 }, permissions: ["geolocation"], serviceWorkers: "block", acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:8770/");
  return page;
}
async function startRocky(page, site) {
  await page.click("#btn-start-rocky"); await page.fill("#s-site", site);
  await page.click('#survey-form button[type="submit"]'); await sleep(700);
}
async function saveQuadrat(page, bare, photo) {
  if (photo) { await page.setInputFiles("#f-gallery", ROOT + "/icon-512.png"); await sleep(800); }
  await page.fill("#f-bare", String(bare)); await page.click("#btn-save"); await sleep(500);
}
const toast = page => page.textContent("#toast");
async function goExport(page) { await page.click('.tabs button[data-tab="export"]'); await sleep(300); }
async function backup(page, name) {
  await goExport(page);
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#btn-backup")]);
  const f = OUT + "/" + name; await dl.saveAs(f); await sleep(300);
  log("  backup file:", dl.suggestedFilename(), "| toast:", await toast(page)); return f;
}
async function restore(page, f) {
  await goExport(page);
  await page.setInputFiles("#f-restore", f); await sleep(1500);
  return page.textContent("#restore-result");
}
const db = (page, store) => page.evaluate(st => new Promise(res => { const r = indexedDB.open("quadrat-notebook"); r.onsuccess = () => { const t = r.result.transaction(st).objectStore(st).getAll(); t.onsuccess = () => res(t.result.map(x => { const o = Object.assign({}, x); if (o.blob) o.blob = o.blob.size + " bytes " + o.blob.type; return o; })); }; }), store);

(async () => {
  const browser = await chromium.launch();
  log("PHONE A: survey with 2 quadrats and a photo");
  const A = await phone(browser, 50.31);
  await startRocky(A, "Wembury");
  await saveQuadrat(A, 40, true);
  await saveQuadrat(A, 55, false);
  await A.click('.tabs button[data-tab="data"]'); await sleep(400);
  log("  nudge on Data tab:", await A.isVisible("#backup-nudge"), "|", await A.textContent("#backup-nudge-text"));
  await A.screenshot({ path: OUT + "/b1-nudge.png", clip: { x: 0, y: 0, width: 390, height: 360 } });
  const f1 = await backup(A, "a1.zip");
  log("  status after:", await A.textContent("#backup-status"));
  await A.click('.tabs button[data-tab="data"]'); await sleep(300);
  log("  nudge hidden after backup:", !(await A.isVisible("#backup-nudge")));

  log("PHONE B: own survey at same site and date, then restore A");
  const B = await phone(browser, 50.32);
  await startRocky(B, "Wembury");
  await saveQuadrat(B, 10, false);
  log("  result:", await restore(B, f1));
  const sB = await db(B, "sessions"), qB = await db(B, "quadrats"), pB = await db(B, "photos");
  log("  B now has surveys:", sB.map(x => x.code).join(", "), "| quadrats:", qB.length, "| photos:", pB.map(x => x.blob).join(", "));
  await B.screenshot({ path: OUT + "/b2-restore.png", fullPage: true });
  log("  restore same file again:", await restore(B, f1));

  log("PHONE A edits quadrat 1, backs up again; B restores");
  await A.click('.tabs button[data-tab="data"]'); await sleep(300);
  await A.click("#qlist li >> nth=0"); await sleep(600);
  await A.fill("#f-bare", "45"); await A.fill("#f-notes", "edited after first backup"); await A.click("#btn-save"); await sleep(1200);
  log("  A toast:", await toast(A));
  const f2 = await backup(A, "a2.zip");
  log("  result:", await restore(B, f2));
  const q1 = (await db(B, "quadrats")).find(q => q.notes === "edited after first backup");
  log("  edited quadrat on B:", q1 ? "bare " + q1.bare + ", notes ok" : "MISSING");

  log("Photo on B displays");
  const ok = await B.evaluate(() => new Promise(res => { const r = indexedDB.open("quadrat-notebook"); r.onsuccess = () => { const t = r.result.transaction("photos").objectStore("photos").getAll(); t.onsuccess = () => { const b = t.result[0].blob; const i = new Image(); i.onload = () => res(i.naturalWidth + "x" + i.naturalHeight); i.onerror = () => res("broken"); i.src = URL.createObjectURL(b); }; }; }));
  log("  decoded photo:", ok);

  log("Export on B: survey ids unique");
  await goExport(B);
  await B.click('.seg[data-name="scope"] button[data-value="all"]');
  const [dl] = await Promise.all([B.waitForEvent("download"), B.click("#btn-csv")]);
  await dl.saveAs(OUT + "/b.csv");
  const rows = fs.readFileSync(OUT + "/b.csv", "utf8").trim().split(/\r\n/).slice(1).map(l => l.split(",").slice(0, 2).join(" / "));
  log("  " + rows.join("\n  "));

  log("Wrong files rejected");
  fs.writeFileSync(OUT + "/not.zip", "hello");
  await B.setInputFiles("#f-restore", OUT + "/not.zip"); await sleep(600); log("  junk:", await toast(B));
  const [dz] = await Promise.all([B.waitForEvent("download"), B.click("#btn-zip")]); await dz.saveAs(OUT + "/export.zip");
  await sleep(300);
  await B.setInputFiles("#f-restore", OUT + "/export.zip"); await sleep(800); log("  data export:", await toast(B));

  log("Fresh phone C restores everything from B");
  const fb = await backup(B, "b.zip");
  const C = await phone(browser, 50.3);
  log("  result:", await restore(C, fb));
  log("  C header:", await C.textContent("#top-site"));
  await B.screenshot({ path: OUT + "/b3-export.png", clip: { x: 0, y: 0, width: 390, height: 844 } });
  log("errors:", errs.length ? errs : "none");
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
