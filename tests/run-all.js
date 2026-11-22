// Runs each test in turn and prints its output. Usage: npm install, then npm test
const { execFileSync } = require("child_process");
const path = require("path");
const tests = ["sg", "rocky", "salt", "grid", "sq", "add", "glob", "hide", "mud"];
let failed = 0;
for (const t of tests) {
  console.log("\n=== " + t + " ===");
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, t + ".test.js")], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    console.log(out.split("\n").filter(l => l && !l.includes("Not implemented") && !l.startsWith("    at ")).join("\n"));
  } catch (e) { failed++; console.log("FAILED\n" + (e.stdout || "") + (e.stderr || "")); }
}
console.log("\n" + (failed ? failed + " test file(s) failed" : "All test files ran"));
process.exit(failed ? 1 : 0);
