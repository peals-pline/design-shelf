import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../js/import-utils.js", import.meta.url), "utf8");
const context = { window: { DS: {} } };
vm.runInNewContext(source, context);

const { analyzeImportJSON, mergeImportedItems } = context.window.DS;

test("analyzes valid, duplicate, and rejected backup items without mutating data", () => {
  const current = [{ id: "existing", type: "font", title: "Inter" }];
  const backup = JSON.stringify({
    app: "DesignShelf",
    version: 1,
    items: [
      { id: "existing", type: "font", title: "Inter copy" },
      { id: "new", type: "palette", title: "Calm palette" },
      { id: "broken", type: "unknown", title: "" },
    ],
  });

  const preview = analyzeImportJSON(backup, current);

  assert.equal(preview.valid.length, 1);
  assert.equal(preview.duplicates.length, 1);
  assert.equal(preview.rejected.length, 1);
  assert.deepEqual(current, [{ id: "existing", type: "font", title: "Inter" }]);
});

test("keeps legacy array exports importable and supports explicit merge or replace", () => {
  const current = [{ id: "existing", type: "font", title: "Inter" }];
  const preview = analyzeImportJSON(
    JSON.stringify([{ id: "new", type: "system", title: "Polaris" }]),
    current,
  );

  assert.deepEqual(
    Array.from(mergeImportedItems(current, preview, "merge"), (item) => item.id),
    ["new", "existing"],
  );
  assert.deepEqual(
    Array.from(mergeImportedItems(current, preview, "replace"), (item) => item.id),
    ["new"],
  );
});

test("returns a useful error for malformed backups", () => {
  assert.throws(
    () => analyzeImportJSON("{bad json", []),
    /valid JSON/,
  );
  assert.throws(
    () => analyzeImportJSON(JSON.stringify({ app: "Other", items: [] }), []),
    /DesignShelf/,
  );
});
