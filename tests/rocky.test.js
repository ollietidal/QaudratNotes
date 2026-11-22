require("fake-indexeddb/auto");
const { JSDOM } = require("jsdom"); const fs = require("fs"); const JSZipNode = require("jszip");
let html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8").replace('<script src="jszip.min.js"></script>', "");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://example.test/",
  beforeParse(w) { w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false });
    const orig = JSZipNode.prototype.generateAsync;
    JSZipNode.prototype.generateAsync = function (o) { if (o && o.type === "blob") return orig.call(this, { type: "uint8array" }).then(u => new w.Blob([u])); return orig.call(this, o); };
    w.JSZip = JSZipNode;
    Object.defineProperty(w.navigator, "geolocation", { value: { getCurrentPosition: () => {}, watchPosition: () => 1, clearWatch: () => {} } });
    w.fetch = async () => ({ ok: true, status: 200, json: async () => ({ results: [] }) });
  } });
const w = dom.window, d = w.document; const sleep = ms => new Promise(r => setTimeout(r, ms)); const $ = s => d.querySelector(s);
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input")); };
const chip = n => $(`#rk-picker button[data-value="${n}"]`);
const row = i => d.querySelectorAll("#rk-rows .rrow")[i];
(async () => {
  await sleep(300);
  $("#btn-start-rocky").click(); await sleep(50);
  console.log("setup:", $("#h-survey").textContent, "| region hidden:", $("#region-field").classList.contains("hidden"));
  $("#s-site").value = "Wembury reef";
  $("#survey-form").dispatchEvent(new w.Event("submit", { cancelable: true })); await sleep(300);
  console.log("rocky form shown:", !$("#rocky-form").classList.contains("hidden"), "| seagrass hidden:", $("#seagrass-form").classList.contains("hidden"));
  console.log("default chips:", [...d.querySelectorAll("#rk-picker button")].length, "|", $("#btn-rk-more").textContent);
  type($("#f-lat"), "50.31"); type($("#f-lon"), "-4.10");
  $('.seg[data-name="zone"] button[data-value="Mid shore"]').click();
  $('.seg[data-name="substrate"] button[data-value="Bedrock"]').click();
  chip("Fucus vesiculosus").click(); chip("Balanomorpha").click(); chip("Patella vulgata").click(); chip("Steromphala umbilicalis").click();
  type(row(0).querySelector("input"), "60");
  type(row(1).querySelector("input"), "70");
  const plus = row(2).querySelectorAll(".step")[1]; plus.click(); plus.click(); plus.click();
  type($("#f-bare"), "40");
  console.log("sum:", $("#rk-sum").textContent);
  $("#btn-save").click(); await sleep(200);
  console.log("blocked:", $("#toast").textContent);
  type($("#f-bare"), "25");
  // custom species
  $("#btn-rk-other").click(); $("#rk-other-name").value = "Anemonia viridis";
  $('.seg[data-name="rk-other-kind"] button[data-value="count"]').click(); $("#btn-rk-other-add").click();
  type(row(4).querySelector("input"), "2");
  $("#btn-save").click(); await sleep(400);
  console.log("saved:", $("#toast").textContent);
  console.log("carried rows:", [...d.querySelectorAll("#rk-rows .rrow-name")].map(x => x.textContent).join(", "), "| values cleared:", [...d.querySelectorAll("#rk-rows input")].every(i => i.value === ""), "| zone kept:", $('.seg[data-name="zone"] button[aria-pressed="true"]').dataset.value);
  // Q2: only limpets 5, rest zero
  type(row(2).querySelector("input"), "5"); type($("#f-bare"), "100");
  $("#btn-save").click(); await sleep(400);
  $('[data-tab="data"]').click(); await sleep(300);
  console.log("stats:", $("#st-n").textContent, $("#st-mean").textContent, $("#st-mean-l").textContent, $("#st-occ").textContent, $("#st-occ-l").textContent);
  console.log("list:", [...d.querySelectorAll("#qlist li")].map(li => li.textContent).join(" | "));
  // edit Q1
  $("#qlist button").click(); await sleep(300);
  console.log("edit Q1 values:", [...d.querySelectorAll("#rk-rows input")].map(i => i.value).join(","), "| bare", $("#f-bare").value);
  $("#btn-cancel-edit").click(); await sleep(200);
  // exports
  let blobOut; w.URL.createObjectURL = b => { blobOut = b; return "blob:x"; }; w.URL.revokeObjectURL = () => {};
  const text = () => new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(blobOut); });
  $('[data-tab="export"]').click(); await sleep(200);
  $("#btn-csv").click(); await sleep(400); console.log("== quadrats\n" + await text());
  $("#btn-sp-csv").click(); await sleep(400); console.log("== species\n" + await text());
  
  $("#btn-dwc").click(); await sleep(1200);
  const buf = await new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(Buffer.from(fr.result)); fr.readAsArrayBuffer(blobOut); });
  const z = await JSZipNode.loadAsync(buf);
  for (const f of ["event.txt", "occurrence.txt", "extendedmeasurementorfact.txt"]) console.log("== " + f + "\n" + await z.file(f).async("string"));
  const eml = await z.file("eml.xml").async("string"); console.log("title:", eml.match(/<title[^>]*>(.*?)<\/title>/)[1]);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
