/* ============================================================
   lookupNavTitles_v3.js
   Title-aware lookup for menu → section → page
   Matches using <title>…</title> instead of folder names.
   ============================================================ */

export async function lookupNavTitles() {
    try {
        /* ----------------------------------------------
           1. READ <title> FROM HTML
        ---------------------------------------------- */
        const rawTitle = document.title || "";
        const pageTitle = rawTitle.replace("– V & V Advisors", "").trim();

        console.groupCollapsed(
            "%c[lookupNavTitles_v3] Page Title Detected",
            "color:#4db6ac;font-weight:600;"
        );
        console.log("HTML <title>:", rawTitle);
        console.log("Normalized:", pageTitle);
        console.groupEnd();


        /* ----------------------------------------------
           2. LOAD navigation_data.json
        ---------------------------------------------- */
        const res = await fetch("/assets/navigation_data.json");
        if (!res.ok) throw new Error("Failed to load navigation_data.json");

        const nav = await res.json();


        /* ----------------------------------------------
           3. DEFAULT RETURN OBJECT
        ---------------------------------------------- */
        let match = {
            jsonMenuTitle: null,
            jsonSectionTitle: null,
            jsonPageTitle: null,

            menuId: null,
            sectionId: null,
            pageUrl: null
        };


        /* ----------------------------------------------
           4. TOP-LEVEL PAGES (Success Stories, Contact…)
        ---------------------------------------------- */
        for (const sec of nav.sections) {
            if (sec.isFolderOnly && sec.title === pageTitle) {
                match.jsonMenuTitle = sec.title;
                match.menuId = sec.id;
                match.pageUrl = sec.url;

                return match;
            }
        }


        /* ----------------------------------------------
           5. MENU → SECTION → PAGE MATCHING
        ---------------------------------------------- */

        for (const menu of nav.sections) {
            /* 5A — PAGE directly under menu (Services/About) */
            if (menu.pages) {
                for (const p of menu.pages) {
                    if (p.title === pageTitle) {
                        match.jsonMenuTitle = menu.title;
                        match.jsonPageTitle = p.title;
                        match.menuId = menu.id;
                        match.pageUrl = p.url;
                        return match;
                    }
                }
            }

            /* 5B — CHECK SUBCATEGORIES (Financial Ed, Protection Products…) */
            if (menu.subcategories) {
                for (const sub of menu.subcategories) {
                    // Subcategory index page
                    if (sub.title === pageTitle) {
                        match.jsonMenuTitle = menu.title;
                        match.jsonSectionTitle = sub.title;

                        match.menuId = menu.id;
                        match.sectionId = sub.id;

                        match.pageUrl = sub.url;
                        return match;
                    }

                    // Subcategory child pages
                    if (sub.pages) {
                        for (const p of sub.pages) {
                            if (p.title === pageTitle) {
                                match.jsonMenuTitle = menu.title;
                                match.jsonSectionTitle = sub.title;
                                match.jsonPageTitle = p.title;

                                match.menuId = menu.id;
                                match.sectionId = sub.id;
                                match.pageUrl = p.url;

                                return match;
                            }
                        }
                    }
                }
            }
        }


        /* ----------------------------------------------
           6. NO MATCH FOUND
        ---------------------------------------------- */
        console.warn("[lookupNavTitles_v3] No matching title found in JSON for:", pageTitle);
        return match;

    } catch (err) {
        console.error("[lookupNavTitles_v3] Lookup failed:", err);
        return {
            jsonMenuTitle: null,
            jsonSectionTitle: null,
            jsonPageTitle: null,
            menuId: null,
            sectionId: null,
            pageUrl: null
        };
    }
}
