require("fake-indexeddb/auto");
const { JSDOM } = require("jsdom"); const fs = require("fs");
let html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8").replace('<script src="jszip.min.js"></script>', "");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/",
  beforeParse(w) { w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false });
    Object.defineProperty(w.navigator, "geolocation", { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} } }); } });
const w = dom.window, d = w.document; const sleep = ms => new Promise(r => setTimeout(r, ms)); const $ = s => d.querySelector(s);
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input")); };
(async () => {
  await sleep(300);
  $("#btn-start-seagrass").click(); await sleep(50);
  console.log("setup:", $("#h-survey").textContent, "| region shown:", !$("#region-field").classList.contains("hidden"));
  $("#s-site").value = "Meadow"; $("#survey-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(300);
  console.log("seagrass form:", !$("#seagrass-form").classList.contains("hidden"), "| rocky hidden:", $("#rocky-form").classList.contains("hidden"));
  $('#species-chips button[data-value="Zostera marina"]').click(); type($("#f-cover"), "40"); type($("#f-shoots"), "12");
  $("#btn-save").click(); await sleep(300); console.log("saved:", $("#toast").textContent);
  $('[data-tab="data"]').click(); await sleep(300);
  console.log("stats:", $("#st-mean").textContent, $("#st-mean-l").textContent, "| list:", $("#qlist").textContent);
  let txt; w.URL.createObjectURL = b => { const fr = new w.FileReader(); fr.onload = () => txt = fr.result; fr.readAsText(b); return "blob:x"; }; w.URL.revokeObjectURL = () => {};
  $('[data-tab="export"]').click(); await sleep(200); $("#btn-sp-csv").click(); await sleep(400); console.log(txt);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
