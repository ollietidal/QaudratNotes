require("fake-indexeddb/auto");
const { JSDOM } = require("jsdom"); const fs = require("fs");
let html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8").replace('<script src="jszip.min.js"></script>', "");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/",
  beforeParse(w) { w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false });
    Object.defineProperty(w.navigator, "geolocation", { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} } }); } });
const d = dom.window.document; const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => { await sleep(300);
  console.log("visible cards:", [...d.querySelectorAll(".habitat-card:not(.hidden) h2")].map(h => h.textContent).join(", "));
  console.log("habitat options:", [...d.querySelectorAll('.seg[data-name="habitat"] button:not(.hidden)')].map(b => b.textContent).join(", "));
  process.exit(0); })();
