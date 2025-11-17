/* ============================================================
   lookupNavTitles_v4.js
   Title-aware lookup for menu → section → page
   Returns full JSON objects so TOC can build dir-aware URLs.
   ============================================================ */

export async function lookupNavTitles() {
    try {
        /* 1. READ AND NORMALIZE TITLE */
        const rawTitle = document.title || "";
        const pageTitle = rawTitle.replace("– V & V Advisors", "").trim();

        const res = await fetch("/assets/navigation_data.json");
        if (!res.ok) throw new Error("Failed to load navigation_data.json");

        const nav = await res.json();

        /* DEFAULT RESULT */
        let match = {
            jsonMenuTitle: null,
            jsonSectionTitle: null,
            jsonPageTitle: null,

            menuData: null,
            sectionData: null,
            pageData: null
        };

        /* ------------------------------------------------------------
           2. TOP-LEVEL ONLY PAGES (Stories, Contact, Consultation)
        ------------------------------------------------------------ */
        for (const sec of nav.sections) {
            if (sec.isFolderOnly && sec.title === pageTitle) {
                match.jsonMenuTitle = sec.title;
                match.menuData = sec;
                match.pageData = sec; // top-level page = its own page data
                return match;
            }
        }

        /* ------------------------------------------------------------
           3. MENU → SECTION → PAGE
        ------------------------------------------------------------ */

        for (const menu of nav.sections) {

            /* 3A — PAGE directly under menu (Services, About) */
            if (menu.pages) {
                for (const p of menu.pages) {
                    if (p.title === pageTitle) {
                        match.jsonMenuTitle = menu.title;
                        match.jsonPageTitle = p.title;

                        match.menuData = menu;
                        match.pageData = p;
                        return match;
                    }
                }
            }

            /* 3B — CHECK SUBCATEGORIES (Financial Ed / Protection Products) */
            if (menu.subcategories) {
                for (const sub of menu.subcategories) {

                    // Section index page matches the <title>
                    if (sub.title === pageTitle) {
                        match.jsonMenuTitle = menu.title;
                        match.jsonSectionTitle = sub.title;

                        match.menuData = menu;
                        match.sectionData = sub;
                        match.pageData = sub; // index page
                        return match;
                    }

                    // Look inside child pages
                    if (sub.pages) {
                        for (const p of sub.pages) {
                            if (p.title === pageTitle) {
                                match.jsonMenuTitle = menu.title;
                                match.jsonSectionTitle = sub.title;
                                match.jsonPageTitle = p.title;

                                match.menuData = menu;
                                match.sectionData = sub;
                                match.pageData = p;
                                return match;
                            }
                        }
                    }
                }
            }
        }

        /* No match */
        console.warn("[lookupNavTitles_v4] ❗ No title match found:", pageTitle);
        return match;

    } catch (err) {
        console.error("[lookupNavTitles_v4] Lookup failed:", err);
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
