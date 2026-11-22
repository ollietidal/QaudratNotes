require("fake-indexeddb/auto");
const { JSDOM } = require("jsdom"); const fs = require("fs");
let html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8").replace('<script src="jszip.min.js"></script>', "");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/",
  beforeParse(w) { w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false });
    Object.defineProperty(w.navigator, "geolocation", { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} } }); } });
const w = dom.window, d = w.document; const sleep = ms => new Promise(r => setTimeout(r, ms)); const $ = s => d.querySelector(s);
// Minimal CSV parser that respects quoted fields (e.g. "North Atlantic, temperate").
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const sq = i => d.querySelectorAll("#gs-grid button")[i];
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input")); };
let txt; w.URL.createObjectURL = b => { const fr = new w.FileReader(); fr.onload = () => { txt = fr.result;  }; fr.readAsText(b); return "blob:x"; }; w.URL.revokeObjectURL = () => {};
async function start(card, site) { $('[data-tab="home"]').click(); await sleep(50); $(card).click(); await sleep(50); $("#s-site").value = site; $("#survey-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(300); }
(async () => {
  await sleep(300);
  // seagrass: tap grid
  await start("#btn-start-seagrass", "Meadow");
  $('#species-chips button[data-value="Zostera marina"]').click();
  [0, 6, 12, 18, 24].forEach(i => d.querySelectorAll("#grid button")[i].click());
  $("#btn-save").click(); await sleep(300);
  // seagrass typed (no squares)
  $('#species-chips button[data-value="Zostera marina"]'); type($("#f-cover"), "40"); $("#btn-save").click(); await sleep(300);
  // edit Q1 keeps diagonal
  $('[data-tab="data"]').click(); await sleep(300); $("#qlist button").click(); await sleep(300);
  console.log("seagrass edit restores:", [...d.querySelectorAll('#grid button[aria-pressed="true"]')].length, "squares, cover", $("#f-cover").value);
  $("#btn-cancel-edit").click(); await sleep(200);
  // rocky
  await start("#btn-start-rocky", "Reef");
  $('#rk-picker button[data-value="Balanomorpha"]').click();
  d.querySelector("#rk-rows .gbtn").click(); [0, 1, 2].forEach(i => sq(i).click()); $("#gs-done").click();
  $("#g-bare").click(); [24].forEach(i => sq(i).click()); $("#gs-done").click();
  $("#btn-save").click(); await sleep(300);
  // saltmarsh
  await start("#btn-start-saltmarsh", "Marsh");
  $('#sm-picker button[data-value="Puccinellia maritima"]').click();
  d.querySelector("#sm-rows .gbtn").click(); [5, 10].forEach(i => sq(i).click()); $("#gs-done").click();
  $("#btn-save").click(); await sleep(300);
  $('[data-tab="export"]').click(); await sleep(200); $('.seg[data-name="scope"] button[data-value="all"]').click();
  $("#btn-csv").click(); await sleep(400); 
  let L = parseCsv(txt.trim()), H = L[0];
  L.slice(1).forEach(r => { console.log("Q:", r[H.indexOf("habitat")], r[H.indexOf("quadrat")], "cover_sq=" + r[H.indexOf("cover_grid_squares")], "bare_sq=" + r[H.indexOf("bare_grid_squares")]); });
  $("#btn-sp-csv").click(); await sleep(400);
  L = parseCsv(txt.trim()); H = L[0];
  L.slice(1).forEach(r => { console.log("S:", r[H.indexOf("habitat")], r[H.indexOf("quadrat")], r[H.indexOf("species")], "sq=" + r[H.indexOf("grid_squares")], "n=" + r[H.indexOf("grid_squares_n")]); });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
