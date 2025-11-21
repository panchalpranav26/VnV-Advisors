/* ============================================================
   taxonomy_loader.js  — FINAL, ALIGNED VERSION
   Loads all taxonomy JSON files and returns unified dataset
   ============================================================ */

export async function loadTaxonomy() {
    try {
        const [
            productsRes,
            categoriesRes,
            canonicalRes,
            trustedRes
        ] = await Promise.all([
            fetch("/assets/taxonomy_json/taxonomy_products.json"),
            fetch("/assets/taxonomy_json/taxonomy_categories.json"),
            fetch("/assets/taxonomy_json/product_raw_to_canonical_map.json"),
            fetch("/assets/taxonomy_json/trusted_taxonomy_data.json")
        ]);

        if (!productsRes.ok) throw new Error("Failed to load taxonomy_products.json");
        if (!categoriesRes.ok) throw new Error("Failed to load taxonomy_categories.json");
        if (!canonicalRes.ok) throw new Error("Failed to load product_raw_to_canonical_map.json");
        if (!trustedRes.ok) throw new Error("Failed to load trusted_taxonomy_data.json");

        const products = await productsRes.json();
        const categories = await categoriesRes.json();
        const canonical = await canonicalRes.json();
        const trusted = await trustedRes.json();

        return {
            products,
            categories,
            canonical,
            taxonomy: trusted
        };
    } catch (err) {
        console.error("[taxonomy_loader] ERROR loading taxonomy:", err);
        return {
            products: {},
            categories: {},
            canonical: {},
            taxonomy: {}
        };
    }
}
