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
  $("#s-site").value = "Meadow"; $("#survey-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(300);
  $('#species-chips button[data-value="Zostera marina"]').click();
  $("#btn-other-species").click(); $("#f-other-species").value = "Ruppia spiralis";
  $("#f-other-species").dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter" }));
  console.log("chips selected:", [...d.querySelectorAll('#species-chips button[aria-pressed="true"]')].map(b => b.textContent).join(", "), "| cards:", d.querySelectorAll("#taxa-cards .taxon").length, "| toast:", $("#toast").textContent);
  type($("#f-cover"), "30"); const c = d.querySelectorAll("#taxa-cards .taxon");
  type(c[0].querySelector('input[id$="c"]'), "20"); type(c[1].querySelector('input[id$="c"]'), "10");
  $("#btn-save").click(); await sleep(300);
  console.log("after save, custom chip kept:", !!$('#species-chips button[data-value="Ruppia spiralis"]'));
  $('[data-tab="data"]').click(); await sleep(300); $("#qlist button").click(); await sleep(300);
  console.log("edit selected:", [...d.querySelectorAll('#species-chips button[aria-pressed="true"]')].map(b => b.textContent).join(", "));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
