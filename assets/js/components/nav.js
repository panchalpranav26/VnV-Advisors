/*
 * FILE: assets/js/components/nav.js
 * ROLE: Dropdown behavior + Active Highlighting
 * ALIGNED WITH: nav_builder_v3.js
 */

import { lookupNavTitles } from "./lookupNavTitles.js";

export function initNav() {
    console.groupCollapsed("%c[nav] 🔧 Init Navigation", "color:#4db6ac;font-weight:600;");

    /* ============================================================
       1. FIND DROPDOWN ROOTS
    ============================================================ */
    let navItems = document.querySelectorAll(".nav-item--has-dropdown");

    if (!navItems || navItems.length === 0) {
        console.warn("[nav] ❌ Nav not ready — retrying in 50ms");
        setTimeout(initNav, 50);
        console.groupEnd();
        return;
    }

    const desktopQuery = window.matchMedia("(min-width: 981px)");

    const finEdRoot = document.querySelector("#nav-financial_education");
    const protectionRoot = document.querySelector("#nav-protection_products");

    const tier1Items = finEdRoot?.querySelectorAll(".tier1-item") || [];
    const tier2Panes = finEdRoot?.querySelectorAll(".submenu-pane") || [];

    const ppTier1 = protectionRoot?.querySelectorAll(".tier1-item") || [];
    const ppTier2Panes = protectionRoot?.querySelectorAll(".submenu-pane") || [];

    /* ============================================================
       2. CLOSE HELPERS
    ============================================================ */
    function closeAllDropdowns() {
        navItems.forEach(item => {
            item.querySelector(".caret-toggle")?.setAttribute("aria-expanded", "false");
            item.querySelector(".dropdown-pane")?.classList.remove("open");
        });
        closeTier2();
    }

    function closeTier2() {
        tier2Panes.forEach(p => p.classList.remove("open"));
        ppTier2Panes.forEach(p => p.classList.remove("open"));
    }

    /* ============================================================
       3. DESKTOP BEHAVIOR (with safe-zone corridor)
    ============================================================ */
    function enableDesktopBehavior() {

        /* --- Open/Close Top Level --- */
        navItems.forEach((item) => {
            const caret = item.querySelector(".caret-toggle");
            // NEW — support either default or HGI dropdown class
            const pane =
                item.querySelector(".hgi-dropdown-pane") ||
                item.querySelector(".dropdown-pane");

            if (!caret || !pane) {
                return;
            }

            /* ----------------------------------
               MOUSEENTER
            ---------------------------------- */
            item.addEventListener("mouseenter", () => {
                closeAllDropdowns();
                caret.setAttribute("aria-expanded", "true");
                pane.classList.add("open");
            });

            /* ----------------------------------
               MOUSELEAVE
            ---------------------------------- */
            item.addEventListener("mouseleave", e => {
                const to = e.relatedTarget;

                const goingToTier1 =
                    !!to &&
                    pane.contains(to) &&
                    !to.classList.contains("submenu-pane") &&
                    !to.closest(".submenu-pane");

                const allTier2Panes = document.querySelectorAll(`#${item.id} .submenu-pane`);
                const goingToTier2 = [...allTier2Panes].some(p => p.contains(to));

                if (goingToTier1 || goingToTier2) {
                    return;
                }

                caret.setAttribute("aria-expanded", "false");
                pane.classList.remove("open");
                closeTier2();
            });

            /* ----------------------------------
               CARET CLICK
            ---------------------------------- */
            caret.addEventListener("click", e => {
                e.preventDefault();
                const open = caret.getAttribute("aria-expanded") === "true";

                closeAllDropdowns();
                caret.setAttribute("aria-expanded", String(!open));
                pane.classList.toggle("open", !open);
            });
        });


        /* ============================================================
           SAFE-ZONE LOGIC
        ============================================================ */
        function applySafeZone(item, pane) {
            if (!item || !pane) return;

            item.addEventListener("mouseleave", e => {
                const to = e.relatedTarget;
                if (pane.contains(to) || item.contains(to)) return;

                const T1 = item.getBoundingClientRect();
                const T2 = pane.getBoundingClientRect();

                const inSafeCorridor =
                    e.clientX >= T1.right - 10 &&
                    e.clientX <= T2.left + 10 &&
                    e.clientY >= Math.min(T1.top, T2.top) - 20 &&
                    e.clientY <= Math.max(T1.bottom, T2.bottom) + 20;

                if (inSafeCorridor) return;

                pane.classList.remove("open");
            });

            pane.addEventListener("mouseenter", () => pane.classList.add("open"));
            pane.addEventListener("mouseleave", () => pane.classList.remove("open"));
        }


        /* ============================================================
           Tier2 Flyouts — Financial Education
        ============================================================ */
        if (finEdRoot) {
            tier1Items.forEach((item) => {
                const submenuId = item.dataset.submenu;
                const pane = finEdRoot.querySelector(`#submenu-${submenuId}`);

                if (!pane) return;

                item.addEventListener("mouseenter", () => {
                    closeTier2();
                    pane.classList.add("open");

                    const itemRect = item.getBoundingClientRect();
                    const cardRect = finEdRoot
                        .querySelector(".card-tier1")
                        .getBoundingClientRect();

                    const top = itemRect.top - cardRect.top;
                    pane.style.setProperty("--submenu-offset", `${top}px`);
                });

                applySafeZone(item, pane);
            });
        }


        /* ============================================================
           Tier2 Flyouts — Protection Products
        ============================================================ */
        if (protectionRoot) {
            ppTier1.forEach((item) => {
                const submenuId = item.dataset.submenu;
                const pane = protectionRoot.querySelector(`#submenu-${submenuId}`);

                if (!pane) return;

                item.addEventListener("mouseenter", () => {
                    closeTier2();
                    pane.classList.add("open");

                    const itemRect = item.getBoundingClientRect();
                    const cardRect = protectionRoot
                        .querySelector(".card-tier1")
                        .getBoundingClientRect();

                    const top = itemRect.top - cardRect.top;
                    pane.style.setProperty("--submenu-offset", `${top}px`);
                });

                applySafeZone(item, pane);
            });
        }
    }


    /* ============================================================
       4. MOBILE BEHAVIOR
    ============================================================ */
    function enableMobileBehavior() {
        console.groupCollapsed("%c[nav][mode] 📱 Mobile Enabled", "color:#81c784");

        navItems.forEach(item => {
            const caret = item.querySelector(".caret-toggle");
            const pane = item.querySelector(".dropdown-pane");
            if (!caret || !pane) return;

            caret.addEventListener("click", e => {
                e.preventDefault();
                const open = pane.classList.contains("open");
                closeAllDropdowns();
                pane.classList.toggle("open", !open);
            });
        });

        if (finEdRoot) {
            tier1Items.forEach(item => {
                const pane = finEdRoot.querySelector(`#submenu-${item.dataset.submenu}`);
                if (!pane) return;

                item.addEventListener("click", e => {
                    e.preventDefault();
                    const open = pane.classList.contains("open");
                    closeTier2();
                    pane.classList.toggle("open", !open);
                });
            });
        }

        console.groupEnd();
    }

    /* ============================================================
       5. MODE SWITCHING
    ============================================================ */
    function applyBehavior(e) {
        closeAllDropdowns();
        if (e.matches) enableDesktopBehavior();
        else enableMobileBehavior();
    }

    applyBehavior(desktopQuery);
    desktopQuery.addEventListener("change", applyBehavior);

    /* ============================================================
       6. ACTIVE HIGHLIGHTING (JSON-driven)
       ============================================================ */

    lookupNavTitles().then(match => {

        console.groupCollapsed(
            "%c[nav][highlight] 🎯 Starting highlight process",
            "color:#ffd54f;font-weight:600;"
        );

        console.log("[nav][highlight] Full lookup match:", match);

        const { menuData, sectionData, pageData } = match;

        /* ============================================================
           TOP-LEVEL MENU HIGHLIGHT
        ============================================================ */
        console.groupCollapsed(
            "%c[nav][highlight] 🔵 Top-Level Menu",
            "color:#4fc3f7;font-weight:600;"
        );

        if (menuData?.id) {
            console.log(`[nav][highlight] Matched menuData.id = "${menuData.id}"`);
            const topEl = document.querySelector(
                `.dd-link[data-nav-id="${menuData.id}"]`
            );

            console.log("[nav][highlight] topEl found:", topEl);

            if (topEl) {
                topEl.classList.add("active-nav");
                console.info(`[nav][highlight] ✅ Applied .active-nav to TOP menu "${menuData.title}"`);
            } else {
                console.warn(`[nav][highlight] ❌ Could not find top-level element for "${menuData.id}"`);
            }
        } else {
            console.warn("[nav][highlight] ⚠ No menuData.id from lookup");
        }

        console.groupEnd();


        /* ============================================================
           TIER-1 CATEGORY HIGHLIGHT
        ============================================================ */
        console.groupCollapsed(
            "%c[nav][highlight] 🟢 Tier-1 Category",
            "color:#81c784;font-weight:600;"
        );

        if (sectionData?.id) {
            console.log(`[nav][highlight] Matched sectionData.id = "${sectionData.id}"`);

            const tier1El = document.querySelector(
                `.tier1-label[data-nav-id="${sectionData.id}"]`
            );

            console.log("[nav][highlight] tier1El found:", tier1El);

            if (tier1El) {
                tier1El.classList.add("active-nav");
                console.info(
                    `[nav][highlight] ✅ Added .active-nav for Tier-1 "${sectionData.title}"`
                );

                const parentLi = tier1El.closest(".tier1-item");
                console.log("[nav][highlight] parent <li> =", parentLi);

                if (parentLi) {
                    parentLi.classList.add("active-parent");
                    console.info(
                        `[nav][highlight] 📌 Marked parent <li> as .active-parent (helps open Tier-2 alignment)`
                    );
                }
            } else {
                console.warn(
                    `[nav][highlight] ❌ Could not find Tier-1 element for "${sectionData.id}"`
                );
            }

        } else {
            console.warn("[nav][highlight] ⚠ No sectionData.id from lookup");
        }

        console.groupEnd();


        /* ============================================================
           TIER-2 PAGE HIGHLIGHT
        ============================================================ */
        console.groupCollapsed(
            "%c[nav][highlight] 🟣 Tier-2 Page",
            "color:#ce93d8;font-weight:600;"
        );

        if (pageData?.title) {
            console.log(`[nav][highlight] Looking for pageData.title = "${pageData.title}"`);

            const pageEl = document.querySelector(
                `.submenu-pane a[data-title="${pageData.title}"]`
            );

            console.log("[nav][highlight] pageEl found:", pageEl);

            if (pageEl) {
                pageEl.classList.add("active-nav");
                console.info(
                    `[nav][highlight] ✅ Applied .active-nav to Tier-2 page "${pageData.title}"`
                );
            } else {
                console.warn(
                    `[nav][highlight] ❌ Could not find tier-2 link for "${pageData.title}"`
                );
            }

        } else {
            console.warn("[nav][highlight] ⚠ No pageData.title from lookup");
        }

        console.groupEnd();


        console.groupEnd(); // end highlight master group
    });

    /* ============================================================ */
    console.info("[nav] ✅ Navigation fully initialized.");
    console.groupEnd();
}
