/*
 * FILE: assets/js/components/nav.js
 * ROLE: Controls navigation dropdown behavior for desktop & mobile.
 * NOTE: Works with dynamic nav_builder.js
 */

export function initNav() {
    console.info("[nav] Initializing navigation dropdown behavior…");
    /* Smooth delay timers */
    const closeTimers = {};
    
    let navItems = document.querySelectorAll(".nav-item--has-dropdown");

    if (!navItems || navItems.length === 0) {
        console.warn("[nav] No dropdown nav items found — retrying in 50ms…");
        setTimeout(initNav, 50);
        return;
    }

    const desktopQuery = window.matchMedia("(min-width: 981px)");

    /* Roots for 2-tier menus */
    const finEdRoot = document.querySelector("#nav-financial_education");
    const protectionRoot = document.querySelector("#nav-protection_products");

    const tier1Items = finEdRoot?.querySelectorAll(".tier1-item") || [];
    const tier2Panes = finEdRoot?.querySelectorAll(".submenu-pane") || [];

    const ppTier1 = protectionRoot?.querySelectorAll(".tier1-item") || [];
    const ppTier2Panes = protectionRoot?.querySelectorAll(".submenu-pane") || [];


    /* --------------------------------------------------------------
       Close all dropdowns (Tier-1 + Tier-2)
    -------------------------------------------------------------- */
    function closeAllDropdowns() {
        navItems.forEach(item => {
            item.querySelector(".caret-toggle")?.setAttribute("aria-expanded", "false");
            item.querySelector(".dropdown-pane")?.classList.remove("open");
        });

        closeTier2();
    }

    /* --------------------------------------------------------------
       Close Tier-2 only
    -------------------------------------------------------------- */
    function closeTier2() {
        tier2Panes.forEach(p => p.classList.remove("open"));
        ppTier2Panes.forEach(p => p.classList.remove("open"));
    }



    /* ====================================================================
       DESKTOP MODE — Hover Behavior
       ==================================================================== */
    function enableDesktopBehavior() {
        console.info("[nav] Desktop mode enabled");

        navItems.forEach(item => {
            const caretBtn = item.querySelector(".caret-toggle");
            const pane = item.querySelector(".dropdown-pane");

            if (!caretBtn || !pane) return;

            item.addEventListener("mouseenter", () => {
                closeAllDropdowns();
                caretBtn.setAttribute("aria-expanded", "true");
                pane.classList.add("open");
            });

            item.addEventListener("mouseleave", () => {
                caretBtn.setAttribute("aria-expanded", "false");
                pane.classList.remove("open");
                closeTier2();
            });

            caretBtn.addEventListener("click", e => {
                e.preventDefault();
                const isOpen = caretBtn.getAttribute("aria-expanded") === "true";
                closeAllDropdowns();
                caretBtn.setAttribute("aria-expanded", String(!isOpen));
                pane.classList.toggle("open", !isOpen);
            });
        });


        /* ----------------------------------------------------------------
           TIER-1 → TIER-2 FLYOUTS (Financial Education)
        ---------------------------------------------------------------- */
        if (finEdRoot) {
            console.groupCollapsed("[nav][debug] Tier-2 Debug — Financial Education");
            console.log("finEdRoot:", finEdRoot);
            console.log("tier1Items:", tier1Items.length);
            console.log("tier2Panes:", tier2Panes.length);
            console.groupEnd();

            tier1Items.forEach((item, index) => {
                const submenuId = item.dataset.submenu;
                const pane = finEdRoot.querySelector(`#submenu-${submenuId}`);

                if (!pane) {
                    console.warn(`[nav][debug] ❌ Missing pane for ${submenuId}`);
                    return;
                }

                /* ---------------------------
                   Hover INTO Tier-1 item
                --------------------------- */
                item.addEventListener("mouseenter", () => {
                    closeTier2();

                    const itemRect = item.getBoundingClientRect();
                    const containerRect = finEdRoot.querySelector(".card-tier1").getBoundingClientRect();
                    const offset = itemRect.top - containerRect.top;

                    pane.style.setProperty("--submenu-offset", offset + "px");
                    pane.classList.add("open");

                    console.log(`[nav][debug] Tier1→Tier2 open:`, submenuId, "offset:", offset);
                });

                /* ---------------------------
                   Hover OUT of Tier-1 item
                   (SAFE-ZONE FIX APPLIED HERE)
                --------------------------- */
                item.addEventListener("mouseleave", e => {
                    const to = e.relatedTarget;

                    const tier1Card = finEdRoot.querySelector(".card-tier1");

                    const safeZones = [
                        pane,
                        tier1Card,
                        item
                    ];

                    if (safeZones.some(zone => zone && zone.contains(to))) {
                        console.log(`[nav][debug] ✔ Safe zone for ${submenuId} — keeping open`);
                        return;
                    }

                    console.log(`[nav][debug] ❌ Closing ${submenuId} — pointer left dropdown area`);
                    pane.classList.remove("open");
                });

                /* Keep pane open while hovering inside */
                pane.addEventListener("mouseenter", () => pane.classList.add("open"));
                pane.addEventListener("mouseleave", () => {
                    console.log(`[nav][debug] mouseleave Tier2 → close ${submenuId}`);
                    pane.classList.remove("open");
                });
            });
        }


        /* ----------------------------------------------------------------
           TIER-1 → TIER-2 FLYOUTS (Protection Products)
        ---------------------------------------------------------------- */
        if (protectionRoot) {
            ppTier1.forEach(item => {
                const submenuId = item.dataset.submenu;
                const pane = protectionRoot.querySelector(`#submenu-${submenuId}`);
                if (!pane) return;

                item.addEventListener("mouseenter", () => {
                    closeTier2();

                    const itemRect = item.getBoundingClientRect();
                    const containerRect = protectionRoot.querySelector(".card-tier1").getBoundingClientRect();
                    const offset = itemRect.top - containerRect.top;

                    pane.style.setProperty("--submenu-offset", offset + "px");
                    pane.classList.add("open");
                });

                item.addEventListener("mouseleave", e => {
                    const to = e.relatedTarget;

                    const safeZones = [
                        pane,
                        protectionRoot.querySelector(".card-tier1"),
                        item
                    ];

                    if (safeZones.some(z => z && z.contains(to))) return;

                    pane.classList.remove("open");
                });

                pane.addEventListener("mouseenter", () => pane.classList.add("open"));
                pane.addEventListener("mouseleave", () => pane.classList.remove("open"));
            });
        }
    }



    /* ====================================================================
       MOBILE MODE — Click-to-open
       ==================================================================== */
    function enableMobileBehavior() {
        console.info("[nav] Mobile mode enabled");

        navItems.forEach(item => {
            const caretBtn = item.querySelector(".caret-toggle");
            const pane = item.querySelector(".dropdown-pane");
            if (!caretBtn || !pane) return;

            caretBtn.addEventListener("click", e => {
                e.preventDefault();
                const isOpen = pane.classList.contains("open");
                closeAllDropdowns();
                pane.classList.toggle("open", !isOpen);
            });
        });

        /* Mobile accordion for tier-2 */
        if (finEdRoot) {
            tier1Items.forEach(item => {
                const pane = finEdRoot.querySelector(`#submenu-${item.dataset.submenu}`);
                if (!pane) return;

                item.addEventListener("click", e => {
                    e.preventDefault();
                    const isOpen = pane.classList.contains("open");
                    closeTier2();
                    pane.classList.toggle("open", !isOpen);
                });
            });
        }
    }



    /* ====================================================================
       MODE SWITCHING (Desktop ↔ Mobile)
       ==================================================================== */
    function applyBehavior(e) {
        closeAllDropdowns();

        if (e.matches) enableDesktopBehavior();
        else enableMobileBehavior();
    }

    applyBehavior(desktopQuery);
    desktopQuery.addEventListener("change", applyBehavior);

    console.info("[nav] ✅ Navigation initialized with Tier-2 support");
}
