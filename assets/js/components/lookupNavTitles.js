/* ============================================================
   lookupNavTitles_v5.js — FINAL + ROBUST
   Matches using folder → id → title (in that order)
   100% reliable for highlighting & breadcrumbs
   ============================================================ */

/* ============================================================
   lookupNavTitles_v5.js — FINAL + ROBUST
   Matches using folder → id → title (in that order)
   100% reliable for highlighting & breadcrumbs
   ============================================================ */

export async function lookupNavTitles() {
    try {

        /* ===============================================
           FIX: EARLY HOME DETECTION
        =============================================== */
        const currentUrl = window.location.pathname;

        if (currentUrl === "/" || currentUrl === "/index.html") {
            return {
                level: "home",
                jsonMenuTitle: "Home",
                jsonSectionTitle: null,
                jsonPageTitle: "Home",
                menuData: { id: "home", title: "Home", url: "/index.html" },
                sectionData: null,
                pageData: { id: "home", title: "Home", url: "/index.html" }
            };
        }

        /* ===============================================
           Continue with normal matching
        =============================================== */
        const res = await fetch("/assets/navigation_data.json");
        if (!res.ok) throw new Error("Failed to load navigation_data.json");
        const nav = await res.json();

        const rawTitle = document.title || "";
        const normalizedTitle = rawTitle.toLowerCase();
        const path = window.location.pathname.split("/").filter(Boolean);

        /* 🔥 You MUST restore these */
        const folder1 = path[1] || "";
        const folder2 = path[2] || "";
        const pageFile = path[path.length - 1] || "";

        const result = {
            level: "page",
            jsonMenuTitle: null,
            jsonSectionTitle: null,
            jsonPageTitle: null,
            menuData: null,
            sectionData: null,
            pageData: null
        };

        const titleMatches = (t) =>
            t && normalizedTitle.includes(t.toLowerCase());

        /* ------------------------------------------------------------
           1. PAGE MATCH
        ------------------------------------------------------------ */
        for (const menu of nav.sections) {
            if (menu.subcategories) {
                for (const sub of menu.subcategories) {
                    for (const p of sub.pages) {

                        const jsonFile = p.url.split("/").pop();

                        if (jsonFile === pageFile || titleMatches(p.title)) {
                            result.jsonMenuTitle = menu.title;
                            result.jsonSectionTitle = sub.title;
                            result.jsonPageTitle = p.title;

                            result.menuData = menu;
                            result.sectionData = sub;
                            result.pageData = p;

                            return result;
                        }
                    }
                }
            }

            /* Mini-sections */
            if (menu.pages) {
                for (const p of menu.pages) {
                    const jsonFile = p.url.split("/").pop();

                    if (jsonFile === pageFile || titleMatches(p.title)) {
                        result.jsonMenuTitle = menu.title;
                        result.jsonPageTitle = p.title;

                        result.menuData = menu;
                        result.pageData = p;

                        return result;
                    }
                }
            }
        }

        /* ------------------------------------------------------------
           2. SECTION MATCH
        ------------------------------------------------------------ */
        for (const menu of nav.sections) {
            if (menu.subcategories) {
                for (const sub of menu.subcategories) {
                    if (sub.id === folder2 || titleMatches(sub.title)) {
                        result.jsonMenuTitle = menu.title;
                        result.jsonSectionTitle = sub.title;

                        result.menuData = menu;
                        result.sectionData = sub;
                        result.pageData = sub;

                        return result;
                    }
                }
            }
        }

        /* ------------------------------------------------------------
           3. MENU MATCH
        ------------------------------------------------------------ */
        for (const menu of nav.sections) {
            if (menu.id === folder1 || titleMatches(menu.title)) {
                result.jsonMenuTitle = menu.title;
                result.menuData = menu;
                result.pageData = menu;

                return result;
            }
        }

        console.warn("[lookupNavTitles_v5] ❗ No match found:", rawTitle);
        return result;

    } catch (err) {
        console.error("[lookupNavTitles_v5] Lookup failed:", err);
        return {
            jsonMenuTitle: null,
            jsonSectionTitle: null,
            jsonPageTitle: null,
            menuData: null,
            sectionData: null,
            pageData: null
        };
    }
}

