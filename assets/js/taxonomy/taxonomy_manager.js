/* ============================================================
   taxonomy_manager.js — FINAL VERSION
   Unified interface for all taxonomy datasets
   ============================================================ */

import { loadTaxonomy } from "/assets/js/taxonomy/taxonomy_loader.js";

export const TaxonomyManager = {

    loaded: false,
    data: {},

    async load() {
        if (this.loaded) return this.data;

        try {
            const taxonomy = await loadTaxonomy();

            this.data = taxonomy;
            this.loaded = true;

            console.info("[TaxonomyManager] Loaded taxonomy:", taxonomy);
            return taxonomy;

        } catch (err) {
            console.error("[TaxonomyManager] ERROR:", err);
            this.data = {};
            return this.data;
        }
    },

    // Product taxonomy
    getProducts() {
        return this.data?.products?.products || [];
    },

    getCategories() {
        return this.data?.categories?.categories || [];
    },

    getCanonicalMap() {
        return this.data?.canonical || {};
    },

    // Trusted taxonomy (topics, carriers, events, etc.)
    getTrusted() {
        return this.data?.taxonomy || {};
    },

    // Convenience accessors
    getCarriers() {
        return this.data?.taxonomy?.carriers || [];
    },

    getTopics() {
        return this.data?.taxonomy?.topics || [];
    },

    getFormats() {
        return this.data?.taxonomy?.resource_formats || [];
    },

    getPillars() {
        return this.data?.taxonomy?.pillars || [];
    },

    getLifeEvents() {
        return this.data?.taxonomy?.financial_events || [];
    }
};
