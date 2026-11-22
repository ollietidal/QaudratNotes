// Feedback form: the optional questions, phone type and opt-in usage summary reach the payload.
// The real Web3Forms endpoint is always intercepted: no message is ever sent.
const { chromium, devices } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = process.env.QN_ROOT || path.resolve(__dirname, "../..");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png" };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0])); if (f.endsWith("/")) f += "index.html";
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); }); }).listen(8804);
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (label, ok, extra) => { if (!ok) fails++; console.log((ok ? "  ok   " : "  FAIL ") + label + (extra !== undefined ? " | " + extra : "")); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices["Pixel 7"], serviceWorkers: "block", geolocation: { latitude: 50.36, longitude: -4.14, accuracy: 5 }, permissions: ["geolocation"] });
  const sent = [];
  await ctx.route(/api\.web3forms\.com/, r => { sent.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) }); });
  await ctx.route(/openstreetmap|obis|marinespecies|open-meteo|gbif/, r => r.abort());
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:8804/"); await page.waitForSelector("#btn-start-seagrass", { state: "visible" });
  // one seagrass survey with two quadrats, for the usage summary
  await page.click("#btn-start-seagrass"); await page.fill("#s-site", "Feedback test"); await page.click('#survey-form button[type="submit"]'); await sleep(800);
  for (let i = 0; i < 2; i++) { await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /None \(0%\)/.test(x.textContent)); if (b) b.click(); }); await page.click("#btn-save"); await sleep(400); }
  await page.click('.tabs button[data-tab="home"]'); await sleep(300);
  await page.click('[data-info="early-info"]');
  await page.click('#fb-send'); check("empty form refused", /Pick a number or write a message/.test(await page.textContent("#fb-status")));
  await page.click('.seg[data-name="fbsurvey"] button[data-value="seagrass"]');
  await page.click('.seg[data-name="fbfield"] button[data-value="yes, in the field"]');
  await page.click('.seg[data-name="fbrole"] button[data-value="student"]');
  await page.click('.seg[data-name="fbrating"] button[data-value="4"]');
  await page.fill("#fb-msg", "Grid was quick; GPS slow under the cliff.");
  await page.check("#fb-usage"); await sleep(300);
  check("usage preview shown before sending", /Will send: 1 survey, 2 quadrats \(seagrass 1\/2\)/.test(await page.textContent("#fb-usage-text")), await page.textContent("#fb-usage-text"));
  await page.click("#fb-send"); await sleep(600);
  const p = sent[0] || {};
  check("one message intercepted", sent.length === 1);
  check("answers in payload", p.survey_type === "seagrass" && p.used_in_field === "yes, in the field" && p.sender_type === "student" && p.rating === "4", JSON.stringify({ s: p.survey_type, f: p.used_in_field, r: p.sender_type, rating: p.rating }));
  check("phone type sent", p.phone_type === "Android", p.phone_type);
  check("usage summary sent", p.usage_summary === "1 survey, 2 quadrats (seagrass 1/2)", p.usage_summary);
  check("no location or survey data in payload", !/50\.36|-4\.14|Feedback test/.test(JSON.stringify(p)));
  check("thank-you shown, form reset", /Thank you/.test(await page.textContent("#fb-status")) && !(await page.isChecked("#fb-usage")) && (await page.$$('#fb-form .seg button[aria-pressed="true"]')).length === 0);
  // without the tick, no usage summary
  await page.fill("#fb-msg", "Second note"); await page.click("#fb-send"); await sleep(500);
  check("usage summary only when ticked", sent[1] && sent[1].usage_summary === "" && sent[1].survey_type === "", JSON.stringify(sent[1] && { u: sent[1].usage_summary, s: sent[1].survey_type }));
  check("no page errors", !errs.length, errs.join(";"));
  console.log(fails ? fails + " FAILED" : "ALL PASSED");
  await b.close(); srv.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
