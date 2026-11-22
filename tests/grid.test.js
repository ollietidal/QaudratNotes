require("fake-indexeddb/auto");
const { JSDOM } = require("jsdom"); const fs = require("fs");
let html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8").replace('<script src="jszip.min.js"></script>', "");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/",
  beforeParse(w) { w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false });
    Object.defineProperty(w.navigator, "geolocation", { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} } }); } });
const w = dom.window, d = w.document; const sleep = ms => new Promise(r => setTimeout(r, ms)); const $ = s => d.querySelector(s);
const sq = i => d.querySelectorAll("#gs-grid button")[i];
(async () => {
  await sleep(300);
  $("#btn-start-rocky").click(); await sleep(50); $("#s-site").value = "Reef";
  $("#survey-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(300);
  $('#rk-picker button[data-value="Balanomorpha"]').click(); $('#rk-picker button[data-value="Mytilus edulis"]').click();
  let rows = d.querySelectorAll("#rk-rows .rrow");
  rows[0].querySelector(".gbtn").click();
  console.log("sheet open:", !$("#grid-sheet").classList.contains("hidden"), "| title:", $("#gs-title").textContent);
  [0, 1, 2, 3, 4, 5].forEach(i => sq(i).click()); console.log("read:", $("#gs-read").textContent);
  $("#gs-done").click(); rows = d.querySelectorAll("#rk-rows .rrow");
  console.log("barnacles value:", rows[0].querySelector('input[type="number"]').value, "| sum:", $("#rk-sum").textContent);
  rows[1].querySelector(".gbtn").click();
  console.log("others shaded for mussels:", d.querySelectorAll("#gs-grid button.other").length, "| hint:", $("#gs-hint").textContent);
  [10, 11].forEach(i => sq(i).click()); $("#gs-done").click();
  $("#g-bare").click(); console.log("others shaded for bare:", d.querySelectorAll("#gs-grid button.other").length);
  [20, 21, 22].forEach(i => sq(i).click()); $("#gs-done").click();
  console.log("bare:", $("#f-bare").value, "| sum:", $("#rk-sum").textContent);
  // reopen barnacles keeps its squares
  d.querySelectorAll("#rk-rows .rrow")[0].querySelector(".gbtn").click();
  console.log("reopen read:", $("#gs-read").textContent); $("#gs-cancel").click();
  console.log("closed:", $("#grid-sheet").classList.contains("hidden"));
  $("#btn-save").click(); await sleep(400); console.log("saved:", $("#toast").textContent);
  // saltmarsh
  $('[data-tab="home"]').click(); await sleep(50); $("#btn-start-saltmarsh").click(); await sleep(50); $("#s-site").value = "Marsh";
  $("#survey-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(300);
  $('#sm-picker button[data-value="Puccinellia maritima"]').click();
  d.querySelector("#sm-rows .gbtn").click(); [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach(i => sq(i).click()); $("#gs-done").click();
  console.log("salt value:", d.querySelector('#sm-rows input[type="number"]').value, d.querySelector("#sm-rows .domin").textContent);
  $("#g-smbare").click(); [24].forEach(i => sq(i).click()); $("#gs-done").click(); console.log("bare ground:", $("#f-smbare").value);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
