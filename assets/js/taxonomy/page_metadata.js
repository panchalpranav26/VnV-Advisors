/* ============================================================
   page_metadata.js (CLEAN VERSION)
   Loads per-page metadata only
   ============================================================ */

export const PageMetadata = {

    loaded: false,
    data: null,

    async load() {
        if (this.loaded) return this.data;

        try {
            // REQUIRED BY USER INSTRUCTION — USE LOCAL FILE PATH
            const res = await fetch("/assets/taxonomy_json/page_meta.json");

            if (!res.ok) throw new Error("Failed to load page_meta.json");

            this.data = await res.json();
            this.loaded = true;

            console.info("[PageMetadata] Loaded metadata:", this.data);
            return this.data;

        } catch (err) {
            console.error("[PageMetadata] ERROR loading metadata:", err);
            this.data = {};
            return this.data;
        }
    },

    /* Returns metadata object for the current page */
    getCurrentPageMeta() {
        const body = document.body;
        if (!body) return null;

        const pageId = body.dataset.pageId;
        if (!pageId) return null;

        return this.data?.[pageId] || null;
    },

    applyBadges() {
        const meta = this.getCurrentPageMeta();
        if (!meta) {
            console.warn("[PageMetadata] No metadata found for this page.");
            return;
        }

        const container = document.querySelector("#taxonomy-badges");
        if (!container) return;

        container.innerHTML = `
            <span class="badge badge-menu">${meta.menu}</span>
            <span class="badge badge-section">${meta.section}</span>
            ${meta.subcategory ? `<span class="badge badge-sub">${meta.subcategory}</span>` : ""}
        `;
    }

};


