require("fake-indexeddb/auto");
const { JSDOM } = require("jsdom"); const fs = require("fs");
let html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8").replace('<script src="jszip.min.js"></script>', "");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/",
  beforeParse(w) { w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false });
    Object.defineProperty(w.navigator, "geolocation", { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} } }); } });
const w = dom.window, d = w.document; const sleep = ms => new Promise(r => setTimeout(r, ms)); const $ = s => d.querySelector(s);
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input")); };
async function start(site, region) {
  $('[data-tab="home"]').click(); await sleep(50);
  $("#btn-start-rocky").click(); await sleep(50);
  $(`.seg[data-name="rkregion"] button[data-value="${region}"]`).click();
  $("#s-site").value = site; $("#survey-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(300);
}
(async () => {
  await sleep(300);
  await start("Cape shore", "global");
  console.log("global chips:", [...d.querySelectorAll("#rk-picker button")].map(b => b.textContent).join(", "), "|", $("#btn-rk-more").textContent);
  $('#rk-picker button[data-value="Patellogastropoda"]').click();
  d.querySelector("#rk-rows .step:last-child").click();
  $("#btn-save").click(); await sleep(300);
  await start("Wembury", "nea");
  console.log("nea first chips:", [...d.querySelectorAll("#rk-picker button")].slice(0, 3).map(b => b.textContent).join(", "));
  let txt; w.URL.createObjectURL = b => { const fr = new w.FileReader(); fr.onload = () => txt = fr.result; fr.readAsText(b); return "blob:x"; }; w.URL.revokeObjectURL = () => {};
  $('[data-tab="export"]').click(); await sleep(200);
  $('.seg[data-name="scope"] button[data-value="all"]').click();
  $("#btn-csv").click(); await sleep(400);
  const L = txt.trim().split("\r\n"); const H = L[0].split(","); console.log("region col:", L.slice(1).map(l => l.split(",")[H.indexOf("region")]).join(" | "));
  $("#btn-sp-csv").click(); await sleep(400); console.log(txt.trim().split("\r\n")[1]);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
