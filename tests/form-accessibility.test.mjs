import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const ui = readFileSync(new URL("../js/ui.jsx", import.meta.url), "utf8");
const forms = readFileSync(new URL("../js/forms.jsx", import.meta.url), "utf8");

test("Field connects labels, descriptions, and validation messages to native controls", () => {
  assert.match(ui, /useId/);
  assert.match(ui, /htmlFor=/);
  assert.match(ui, /aria-describedby/);
  assert.match(ui, /aria-invalid/);
});

test("invalid item forms focus the first invalid control", () => {
  assert.match(forms, /querySelector\([^)]*\.invalid/);
  assert.match(forms, /\.focus\(\)/);
});
