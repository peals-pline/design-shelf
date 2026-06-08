/* DesignShelf backup inspection and local import helpers. */
(function registerImportUtils() {
  const TYPES = new Set(["font", "palette", "reference", "snippet", "system", "image", "kit"]);

  function parseBackup(json) {
    let payload;
    try {
      payload = typeof json === "string" ? JSON.parse(json) : json;
    } catch {
      throw new Error("That file isn't valid JSON.");
    }

    if (payload && !Array.isArray(payload) && payload.app && payload.app !== "DesignShelf") {
      throw new Error("This backup was not created by DesignShelf.");
    }

    const items = Array.isArray(payload) ? payload : payload?.items;
    if (!Array.isArray(items)) {
      throw new Error("No items array found in that DesignShelf backup.");
    }

    return items;
  }

  function itemError(item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return "Item must be an object.";
    if (typeof item.id !== "string" || !item.id.trim()) return "Item id is missing.";
    if (!TYPES.has(item.type)) return "Item type is not supported.";
    if (typeof item.title !== "string" || !item.title.trim()) return "Item title is missing.";
    return "";
  }

  function analyzeImportJSON(json, currentItems = []) {
    const incoming = parseBackup(json);
    const existingIds = new Set(currentItems.map((item) => item.id));
    const seenIds = new Set();
    const preview = { valid: [], duplicates: [], rejected: [], total: incoming.length };

    incoming.forEach((item, index) => {
      const reason = itemError(item);
      if (reason) {
        preview.rejected.push({ index, reason });
        return;
      }

      if (existingIds.has(item.id) || seenIds.has(item.id)) {
        preview.duplicates.push(item);
        return;
      }

      seenIds.add(item.id);
      preview.valid.push(item);
    });

    return preview;
  }

  function mergeImportedItems(currentItems, preview, mode) {
    if (mode === "replace") {
      const byId = new Map();
      [...preview.valid, ...preview.duplicates].forEach((item) => byId.set(item.id, item));
      return [...byId.values()];
    }
    return [...preview.valid, ...currentItems];
  }

  window.DS = window.DS || {};
  Object.assign(window.DS, { analyzeImportJSON, mergeImportedItems });
})();
