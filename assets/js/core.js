/*
 * FILE: assets/js/core.js
 * ROLE: Bootstraps layout, loads header/footer, and dynamically
 *       switches between Desktop Nav and Mobile Nav based on screen size.
 *
 * NAV LOGIC:
 *   - Desktop (≥ 981px): initNav()
 *   - Mobile (< 981px): initMobileNav()
 *   - Hard resets when switching modes to avoid duplicate listeners
 */

import { initNav } from './components/nav.js';
import { initMobileNav } from './components/mobile_nav.js';
import { initPageTOC } from './components/page_toc.js';
import { TaxonomyManager } from "/assets/js/taxonomy/taxonomy_manager.js";
import { PageMetadata } from "/assets/js/taxonomy/page_metadata.js";

let currentNavMode = null;      // "desktop" or "mobile"
let mobileNavAPI = null;        // stores return object from initMobileNav()

window.VVResourceStore = {
    data: null,
    loaded: false
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1) Load header & footer HTML fragments
        await loadHeaderFooter();
        await window.loadTrustedResources();
        console.info("[core] Trusted Resources Loaded");
        attachResourceIcons();
        fixHomeLinks();
        initExtLinkModals();
        attachExtLinkResourceModalHandlers();

        // 2) Load Taxonomy FIRST (because other loaders may use it)
        // Load taxonomy + page metadata
        await TaxonomyManager.load();
        await PageMetadata.load();
        PageMetadata.applyBadges();
        console.info("[core] Taxonomy + Page Metadata applied.");

    } catch (e) {
        console.error('[core] Init failed:', e);
    }
});

import { buildDynamicNav } from './components/nav_builder.js';   // add import

document.addEventListener("header-loaded", async () => {
    console.info("[core] 🔔 Header-loaded event received — building dynamic nav…");

    // 1️⃣ Build dynamic menu (AFTER header.html is loaded)
    await buildDynamicNav();
    console.info("[core] ✅ Dynamic nav inserted into DOM");

    // 2️⃣ Now apply Desktop/Mobile behavior
    initScreenSizeWatcher();

    // 3️⃣ UI Effects (icons, reveal, etc)
    initUIEffects();

    // 4️⃣ Instantiate TOC
    initPageTOC();


    // Get all accordion buttons AFTER header loads
    const buttons = document.querySelectorAll('.accordion-btn');

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {

            const isOpen = btn.getAttribute("aria-expanded") === "true";

            // Close all other accordions
            buttons.forEach(b => {
                b.setAttribute("aria-expanded", "false");
                b.nextElementSibling.classList.remove("open");
            });

            // Open clicked accordion (if it wasn't already open)
            if (!isOpen) {
                btn.setAttribute("aria-expanded", "true");
                btn.nextElementSibling.classList.add("open");
            }
        });
    });

    console.log("✔ Accordion initialized successfully AFTER header load");

});


/**
 * Detects current screen mode (Desktop vs Mobile) and switches nav behavior accordingly
 * Includes detailed debug logs to trace mode changes
 */
function initScreenSizeWatcher() {
    const mq = window.matchMedia("(min-width: 981px)");
    let switchCount = 0;
    let lastTrigger = "init";

    function applyNavMode(e) {
        const isDesktop = e.matches;
        const newMode = isDesktop ? "desktop" : "mobile";
        const oldMode = currentNavMode;

        console.groupCollapsed(`[ScreenMode] Triggered by: ${lastTrigger}`);
        console.debug("[ScreenMode] Viewport Width:", window.innerWidth + "px");
        console.debug("[ScreenMode] MediaQuery Matches:", isDesktop);
        console.debug("[ScreenMode] Previous Mode:", oldMode);
        console.debug("[ScreenMode] New Mode:", newMode);

        if (newMode !== oldMode) {
            switchCount++;
            console.info(`[ScreenMode] 🔄 Switching NAV mode: ${oldMode} → ${newMode}`);
            console.debug("[ScreenMode] Switch Count:", switchCount);

            if (isDesktop) {
                switchToDesktopNav();
            } else {
                switchToMobileNav();
            }

            currentNavMode = newMode;
        } else {
            console.info(`[ScreenMode] 🟦 No Change — Still in ${oldMode} mode`);
        }

        console.groupEnd();
        lastTrigger = "resize";
    }

    // Run once on load
    console.log("%c[ScreenMode] Initializing screen size watcher...", "color:#4db6ac;font-weight:600;");
    applyNavMode(mq);

    // Listen for changes
    mq.addEventListener("change", applyNavMode);
}


/* ------------------------------------------
   MODE SWITCHING LOGIC
------------------------------------------- */

/**
 * Switch to Desktop navigation
 */
function switchToDesktopNav() {
    console.groupCollapsed("%c[nav-switch] 🖥️ Switch → DESKTOP", "color:#4fc3f7;font-weight:600;");
    console.info("Triggered function: switchToDesktopNav()");
    console.debug("Current nav mode BEFORE switch:", currentNavMode);

    // Validate state before switching
    if (currentNavMode === "desktop") {
        console.warn("[nav-switch] Already in DESKTOP mode — skipping re-init.");
        console.groupEnd();
        return;
    }

    // Cleanup previous mode
    if (currentNavMode === "mobile") {
        if (mobileNavAPI) {
            console.info("[nav-switch] Cleaning up MOBILE mode before switching…");
            console.debug("Calling mobileNavAPI.resetDesktop() to remove drawers, overlay, and body lock.");
            try {
                mobileNavAPI.resetDesktop();
                console.info("[nav-switch] ✅ Mobile cleanup completed.");
            } catch (err) {
                console.error("[nav-switch] ❌ Error during mobile cleanup:", err);
            }
        } else {
            console.warn("[nav-switch] No mobileNavAPI instance found — nothing to clean.");
        }
        mobileNavAPI = null;
    }

    // Init Desktop Nav
    console.info("[nav-switch] Initializing Desktop Navigation…");
    try {
        initNav();
        currentNavMode = "desktop";
        console.debug("currentNavMode set to:", currentNavMode);
        console.info("[nav-switch] ✅ Desktop Nav initialized successfully.");
    } catch (err) {
        console.error("[nav-switch] ❌ Desktop init failed:", err);
    }

    console.groupEnd();
}


/**
 * Switch to Mobile navigation
 */
function switchToMobileNav() {
    console.groupCollapsed("%c[nav-switch] 📱 Switch → MOBILE", "color:#81c784;font-weight:600;");
    console.info("Triggered function: switchToMobileNav()");
    console.debug("Current nav mode BEFORE switch:", currentNavMode);

    // Validate state before switching
    if (currentNavMode === "mobile") {
        console.warn("[nav-switch] Already in MOBILE mode — skipping re-init.");
        console.groupEnd();
        return;
    }

    // Cleanup desktop mode (future-proofing)
    if (currentNavMode === "desktop") {
        console.info("[nav-switch] (Optional) Desktop cleanup placeholder!");
        console.debug("If desktop listeners teardown needed, implement here.");
    }

    // Init Mobile Nav
    console.info("[nav-switch] Initializing Mobile Navigation…");
    try {
        setTimeout(() => {
            mobileNavAPI = initMobileNav();
            if (mobileNavAPI?.initMobileMenu) {
                mobileNavAPI.initMobileMenu();
            }
            currentNavMode = "mobile";
            console.debug("mobileNavAPI instance:", mobileNavAPI);
            console.debug("currentNavMode set to:", currentNavMode);
            console.info("[nav-switch] ✅ Mobile Nav initialized successfully.");
        });
    } catch (err) {
        console.error("[nav-switch] ❌ Mobile init failed:", err);
    }

    console.groupEnd();
}



/* ------------------------------------------
   SHARED HELPERS
------------------------------------------- */

/**
 * Loads header.html & footer.html into containers
 */
async function loadHeaderFooter() {
    const headerContainer = document.getElementById("site-header");
    const footerContainer = document.getElementById("site-footer");

    if (!headerContainer && !footerContainer) return;

    try {
        if (headerContainer) {
            const headerRes = await fetch(resolvePath("/pages/components/header.html"));
            const headerHTML = await headerRes.text();
            headerContainer.innerHTML = headerHTML;

            // ✅ Notify that header HTML is now in the DOM
            document.dispatchEvent(new Event("header-loaded"));
            console.info("[include] ✅ Header loaded + event dispatched");
        }

        if (footerContainer) {
            const footerRes = await fetch(resolvePath("/pages/components/footer.html"));
            const footerHTML = await footerRes.text();
            footerContainer.innerHTML = footerHTML;
        }

    } catch (e) {
        console.error("[include] ❌ Failed to load header/footer:", e);
    }
}


/**
 * Resolves correct path for local dev vs hosted
 */
function resolvePath(path) {
    const isLocal = window.location.protocol === "file:";
    return isLocal ? `..${path}` : path;
}


/**
 * Fixes Home link paths based on directory depth
 */
function fixHomeLinks() {
    try {
        const links = document.querySelectorAll('[data-home]');
        console.debug(`[fixHomeLinks] Found ${links.length} home link(s)`);

        if (!links.length) {
            console.warn("[fixHomeLinks] No elements found with [data-home] attribute");
            return;
        }

        const path = window.location.pathname;
        const depth = path.split("/").filter(Boolean).length - 1;
        const prefix = depth > 0 ? "../".repeat(depth) : "./";

        links.forEach(link => link.setAttribute("href", prefix + "index.html"));
        console.info("[fixHomeLinks] ✅ Home links updated successfully.");
    } catch (err) {
        console.error("[fixHomeLinks] ❌ Error updating home links:", err);
    }
}


function loadFeatherIcons() {
    return new Promise((resolve, reject) => {
        if (window.feather) return resolve(); // Already loaded

        const script = document.createElement("script");
        script.src = "https://unpkg.com/feather-icons";
        script.onload = () => {
            console.info("[core] ✅ Feather Icons loaded");
            resolve();
        };
        script.onerror = () => reject("Failed to load Feather Icons");
        document.head.appendChild(script);
    });
}

function attachResourceIcons() {
    const resourceLinks = document.querySelectorAll(".resource a");

    resourceLinks.forEach(link => {
        // Skip if already injected
        if (link.querySelector("i[data-feather]")) return;

        const icon = document.createElement("i");
        icon.setAttribute("data-feather", "external-link"); // choose icon
        icon.classList.add("feather-icon");

        link.prepend(icon); // or append(icon)
    });

    // Re-run Feather replacement
    if (window.feather) feather.replace();
}

async function initUIEffects() {
    await loadFeatherIcons();
    // ✅ Render Feather Icons
    if (window.feather) {
        feather.replace();
    } else {
        console.warn("Feather icons not found. Make sure feather.min.js is loaded.");
    }

    // ✅ Scroll Reveal Animation
    const elementsToReveal = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal once
            }
        });
    }, { threshold: 0.15 });

    elementsToReveal.forEach(el => revealObserver.observe(el));
}


/* ============================================================
   UNIVERSAL MODAL HANDLER — Drop-in Reusable System
   Works for ANY modal with data-modal-target + data-modal-close
   ============================================================ */

export function initExtLinkModals() {
    console.info("[core] Modal system initialized…");

    /* OPEN MODAL HANDLERS */
    document.querySelectorAll("[data-modal-open]").forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-modal-open");
            const modal = document.getElementById(target);
            if (modal) modal.classList.remove("hidden");
        });
    });

    /* CLOSE MODAL HANDLERS */
    document.querySelectorAll("[data-modal-close]").forEach(btn => {
        btn.addEventListener("click", () => {
            const modal = btn.closest(".vv-modal");
            if (modal) modal.classList.add("hidden");
        });
    });

    /* CLICK OUTSIDE TO CLOSE */
    document.querySelectorAll(".vv-modal").forEach(modal => {
        modal.addEventListener("click", e => {
            if (e.target === modal) {
                modal.classList.add("hidden");
            }
        });
    });
}

// Close buttons
document.addEventListener("click", e => {
    if (e.target.matches("[data-modal-close]")) {
        document.getElementById("vvModal").classList.add("hidden");
    }
});


function attachExtLinkResourceModalHandlers() {
    document.querySelectorAll("[data-modal-open]").forEach(el => {
        el.addEventListener("click", () => {
            const orgId = el.getAttribute("data-modal-id");
            const resourceUrl = el.getAttribute("data-resource-url");

            const org = window.VVResourceStore.data.find(o => o.id === orgId);
            if (!org) return;

            document.getElementById("vvModalTitle").textContent = org.name;
            document.getElementById("vvModalText").textContent = org.description;

            const btn = document.getElementById("vvModalPrimaryBtn");
            btn.href = resourceUrl;
            btn.textContent = "Visit Resource ↗";

            document.getElementById("vvModal").classList.remove("hidden");
        });
    });
}


/**
 * getPageResources(pageId)
 * Returns a formatted HTML string of resource links for a specific page.
 *
 * OUTPUT EXAMPLE:
 * <a href="URL">Resource (ORG)</a> | <a href="URL2">Resource (ORG)</a>
 */
async function getPageResources(pageId, subcategoryId, sectionId, type = null) {
    try {
        if (!window.VVResourceStore || !window.VVResourceStore.loaded) {
            await loadTrustedResources();
        }

        const allOrgs = window.VVResourceStore.data;
        const results = [];

        allOrgs.forEach(org => {

            const matchSection     = org.section_ids.includes(sectionId);
            const matchSubcategory = org.subcategory_ids.includes(subcategoryId);
            const matchPage        = org.page_ids.includes(pageId);

            console.log("ORG CHECK:", {
                org: org.id,
                sectionMatch: org.section_ids.includes(sectionId),
                subMatch: org.subcategory_ids.includes(subcategoryId),
                pageMatch: org.page_ids.includes(pageId),
                resourceTypes: org.resources.map(r => r.types)
            });

            if (matchSection && matchSubcategory && matchPage) {

                org.resources.forEach(r => {

                    const matchType = type
                        ? r.types.includes(type)
                        : true;

                    if (!matchType) return;

                    results.push({
                        url: r.url,
                        title: r.resource,
                        orgName: org.name
                    });
                });
            }
        });

        if (results.length === 0) return "";

        return results
            .map(item =>
                `<a href="${item.url}" target="_blank">
                    ${item.title} (${item.orgName})
                 </a>`
            )
            .join(" | ");

    } catch (err) {
        console.error("[getPageResources] Error:", err);
        return "";
    }
}

// ➜ Expose globally for inline scripts


/* ============================================================
   Load Trusted Resources JSON One Time (Global Store)
   ============================================================ */
window.loadTrustedResources = async function () {
    if (!window.VVResourceStore) {
        window.VVResourceStore = { loaded: false, data: [] };
    }

    // Already loaded → skip re-fetch
    if (window.VVResourceStore.loaded) {
        return window.VVResourceStore.data;
    }

    try {
        const res = await fetch("/assets/trusted_resources_data.json");
        const json = await res.json();

        window.VVResourceStore.data = json;
        window.VVResourceStore.loaded = true;

        console.info("[VVResourceStore] Loaded trusted resources");
        return json;

    } catch (err) {
        console.error("[VVResourceStore] Failed to load:", err);
        return [];
    }
};

window.attachExtLinkResourceModalHandlers = attachExtLinkResourceModalHandlers;
window.getPageResources = getPageResources;