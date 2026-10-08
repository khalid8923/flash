import { validateAll, findDuplicates } from "../src/catalog/registry.js";

const dupes = findDuplicates();
if (dupes.length > 0) {
  console.log("DUPES:" + dupes.join(","));
  process.exit(2);
}

const results = validateAll();
const failed = results.filter((r) => !r.result.valid);

if (failed.length > 0) {
  console.log("FAIL");
  for (const f of failed) {
    console.log("ERR:" + f.game + " -> " + f.result.errors.join(" | "));
  }
  process.exit(3);
}

console.log("PASS");
console.log("COUNT:" + results.length);
process.exit(0);