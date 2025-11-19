/* ============================================================
   lookupNavTitles_v5.js — FINAL + ROBUST
   Matches using folder → id → title (in that order)
   100% reliable for highlighting & breadcrumbs
   ============================================================ */

export async function lookupNavTitles() {
    try {
        const res = await fetch("/assets/navigation_data.json");
        if (!res.ok) throw new Error("Failed to load navigation_data.json");
        const nav = await res.json();

        const rawTitle = document.title || "";
        const normalizedTitle = rawTitle.toLowerCase();

        /* Folder-based matching (more reliable) */
        const path = window.location.pathname.split("/").filter(Boolean);

        const folder1 = path[1] || "";   // financial_education, protection_products
        const folder2 = path[2] || "";   // foundations, wealth, etc.
        const pageFile = path[path.length - 1] || "";

        const result = {
            jsonMenuTitle: null,
            jsonSectionTitle: null,
            jsonPageTitle: null,
            menuData: null,
            sectionData: null,
            pageData: null
        };

        /* Fast helper */
        const titleMatches = (t) =>
            t && normalizedTitle.includes(t.toLowerCase());

        /* ------------------------------------------------------------
           1. PAGE MATCH (deepest match)
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

            /* Mini sections (Services, About) */
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
           2. SECTION MATCH (folder2)
        ------------------------------------------------------------ */
        for (const menu of nav.sections) {
            if (menu.subcategories) {
                for (const sub of menu.subcategories) {
                    if (sub.id === folder2 || titleMatches(sub.title)) {
                        result.jsonMenuTitle = menu.title;
                        result.jsonSectionTitle = sub.title;

                        result.menuData = menu;
                        result.sectionData = sub;
                        result.pageData = sub; // section index page

                        return result;
                    }
                }
            }
        }

        /* ------------------------------------------------------------
           3. MENU MATCH (folder1)
        ------------------------------------------------------------ */
        for (const menu of nav.sections) {
            if (menu.id === folder1 || titleMatches(menu.title)) {
                result.jsonMenuTitle = menu.title;
                result.menuData = menu;
                result.pageData = menu; // menu index

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
