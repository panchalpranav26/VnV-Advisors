/* ----------------------------------------------------------
   AUTO PAGE-ID INJECTOR (Corrected for navigation_data.json)
   navigation_data.json → sections[] → subcategories[] → pages[]
---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Load navigation data once
        if (!window.VVNavigationData) {
            const res = await fetch("/assets/navigation_data.json");
            window.VVNavigationData = await res.json();
            console.info("[auto-page-id] Loaded navigation_data.json");
        }

        const nav = window.VVNavigationData;
        const path = window.location.pathname;
        console.log("[auto-page-id] Current path:", path);

        /* ----------------------------------------------------------
           1. Determine pageIdFromURL
        ---------------------------------------------------------- */
        let file = path.split("/").pop();
        let pageIdFromURL = file.replace(".html", "");

        // For index.html pages → use parent folder as pageId
        if (pageIdFromURL === "index") {
            const parts = path.split("/").filter(Boolean);

            if (parts.length >= 2) {
                pageIdFromURL = parts[parts.length - 2];
            } else {
                pageIdFromURL = "home";
            }
        }

        console.log("[auto-page-id] pageIdFromURL:", pageIdFromURL);

        let matchedPageId = null;

        /* ----------------------------------------------------------
           2. MATCH AGAINST navigation_data.json STRUCTURE
              nav.sections[] 
                 → subcategories[] → pages[]
                 → pages[]
        ---------------------------------------------------------- */
        const sections = nav.sections || [];

        outerLoop:
            for (const section of sections) {

                // SECTION-LEVEL MATCH (index pages)
                if (section.id === pageIdFromURL) {
                    matchedPageId = section.id;
                    break outerLoop;
                }

                // Check subcategories
                if (section.subcategories) {
                    for (const sub of section.subcategories) {

                        // SUBCATEGORY index match
                        if (sub.id === pageIdFromURL) {
                            matchedPageId = sub.id;
                            break outerLoop;
                        }

                        // subcategory → pages
                        if (sub.pages) {
                            for (const p of sub.pages) {
                                if (p.id === pageIdFromURL) {
                                    matchedPageId = p.id;
                                    break outerLoop;
                                }
                            }
                        }
                    }
                }

                // section → pages
                if (section.pages) {
                    for (const p of section.pages) {
                        if (p.id === pageIdFromURL) {
                            matchedPageId = p.id;
                            break outerLoop;
                        }
                    }
                }
            }

        /* ----------------------------------------------------------
           3. APPLY TO BODY
        ---------------------------------------------------------- */
        if (matchedPageId) {
            document.body.setAttribute("data-page-id", matchedPageId);
            console.info("[auto-page-id] Applied data-page-id:", matchedPageId);
        } else {
            console.warn("[auto-page-id] No matching page_id found:", pageIdFromURL);
        }

    } catch (err) {
        console.error("[auto-page-id] ERROR:", err);
    }
});
