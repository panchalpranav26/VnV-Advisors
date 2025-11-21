/* -------------------------------------------------------------
   SHARED CORE ENGINE (NO HTML HERE)
------------------------------------------------------------- */

async function ensureTrustedData() {
    if (!window.VVResourceStore || !window.VVResourceStore.loaded) {
        await loadTrustedResources();
    }
}

function normalizeToArray(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input;

    const trimmed = input.trim();

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try { return JSON.parse(trimmed); } catch {}
    }

    if (trimmed.includes(",")) {
        return trimmed.split(",").map(v => v.trim());
    }

    return [trimmed];
}

function readResourceAttributes(el) {
    const rawPageId        = el.getAttribute("data-page-id");
    const rawSubcategoryId = el.getAttribute("data-subcategory-id");
    const rawSectionId     = el.getAttribute("data-section-id");
    const rawType          = el.getAttribute("data-type");

    const pageIdArray        = normalizeToArray(rawPageId);
    const subcategoryIdArray = normalizeToArray(rawSubcategoryId);
    const sectionIdArray     = normalizeToArray(rawSectionId);
    const typeArray          = normalizeToArray(rawType);

    if (!pageIdArray.length || !subcategoryIdArray.length || !sectionIdArray.length) {
        console.warn("⚠ Missing required resource attributes.");
        return null;
    }

    return { pageIdArray, subcategoryIdArray, sectionIdArray, typeArray };
}
