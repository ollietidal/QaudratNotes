// Runs every browser test in turn and fails if any script crashes, exits with an error,
// reports page errors, or (custom.e2e.js) has a failed check.
// Most scripts print a readout to compare by eye; this runner checks the parts that can be
// judged automatically. Usage (from tests/): npm run e2e
const { spawnSync } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");

const only = process.argv.slice(2);
const scripts = fs.readdirSync(__dirname).filter(f => f.endsWith(".e2e.js")).sort()
  .filter(f => !only.length || only.includes(f.replace(".e2e.js", "")));
const outRoot = path.join(os.tmpdir(), "qn-e2e");
let failed = [];
for (const s of scripts) {
  const name = s.replace(".e2e.js", "");
  const started = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, s), path.join(outRoot, name)], { encoding: "utf8", timeout: 240000 });
  const out = (r.stdout || "") + (r.stderr || "");
  const pageErrors = out.split("\n").filter(l => /errors:/.test(l) && !/errors: none/.test(l));
  const checkFails = out.split("\n").filter(l => /^\s*FAIL\b/.test(l));
  const passMarker = /errors: none|ALL PASSED/.test(out);
  const ok = r.status === 0 && !r.error && !pageErrors.length && !checkFails.length && passMarker;
  console.log((ok ? "ok    " : "FAIL  ") + name + "  (" + ((Date.now() - started) / 1000).toFixed(0) + " s)");
  if (!ok) {
    failed.push(name);
    console.log(out.split("\n").map(l => "      " + l).join("\n"));
    if (r.error) console.log("      " + r.error.message);
  }
}
console.log("\n" + (failed.length ? failed.length + " of " + scripts.length + " browser tests failed: " + failed.join(", ") : "All " + scripts.length + " browser tests passed"));
process.exit(failed.length ? 1 : 0);
