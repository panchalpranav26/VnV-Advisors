/*************************************************************
 * SEO AUTO LOADER — CLEAN + CORRECT FINAL VERSION
 *************************************************************/

(async function () {

    /* ----------------------------------------
       LOAD NAVIGATION DATA
    ---------------------------------------- */
    let navigationData = null;
    try {
        const res = await fetch("/assets/navigation_data.json");
        navigationData = await res.json();
    } catch (err) {
        console.error("❌ Could not load navigation_data.json", err);
    }

    if (!navigationData) return;

    const currentPath = window.location.pathname;

    /* ----------------------------------------
       Helper: Safe join of dir + url
    ---------------------------------------- */
    function joinPaths(dir, url) {
        const cleanDir = (dir || "").replace(/\/+$/, "");
        const cleanUrl = (url || "").replace(/^\/+/, "");
        return cleanDir + "/" + cleanUrl;
    }

    /* ----------------------------------------
       STEP 1 — MATCH NAV ENTRY
    ---------------------------------------- */
    function findNavMatch() {
        for (const section of navigationData.sections) {

            const sectionFullUrl = joinPaths(section.dir, section.url);

            // SECTION INDEX
            if (sectionFullUrl === currentPath) {
                return {
                    sectionId: section.id,
                    subcategoryId: null,
                    pageId: null,
                    key: section.title,
                    isSectionIndex: true,
                    isSubcategoryIndex: false
                };
            }

            // SECTION PAGES
            if (section.pages) {
                for (const page of section.pages) {
                    const full = joinPaths(section.dir, page.url);
                    if (full === currentPath) {
                        return {
                            sectionId: section.id,
                            subcategoryId: null,
                            pageId: page.id,
                            key: page.title,
                            isSectionIndex: false,
                            isSubcategoryIndex: false
                        };
                    }
                }
            }

            // SUBCATEGORIES
            if (section.subcategories) {
                for (const sub of section.subcategories) {

                    const subFullUrl = joinPaths(section.dir, sub.url);

                    // SUBCATEGORY INDEX
                    if (subFullUrl === currentPath) {
                        return {
                            sectionId: section.id,
                            subcategoryId: sub.id,
                            pageId: null,
                            key: sub.title,
                            isSectionIndex: false,
                            isSubcategoryIndex: true
                        };
                    }

                    // SUBCATEGORY CHILD PAGE
                    if (sub.pages) {
                        for (const page of sub.pages) {
                            const full = joinPaths(section.dir, page.url);
                            if (full === currentPath) {
                                return {
                                    sectionId: section.id,
                                    subcategoryId: sub.id,
                                    pageId: page.id,
                                    key: page.title,
                                    isSectionIndex: false,
                                    isSubcategoryIndex: false
                                };
                            }
                        }
                    }
                }
            }
        }

        // fallback
        return {
            sectionId: "pages_index",
            subcategoryId: null,
            pageId: null,
            key: "home",
            isSectionIndex: false,
            isSubcategoryIndex: false
        };
    }

    const match = findNavMatch();


    /* ----------------------------------------
       STEP 2 — DETERMINE WHICH SEO JSON TO LOAD
    ---------------------------------------- */
    let seoCategoryId = null;

    // HOME
    if (currentPath === "/" || currentPath === "/index.html") {
        seoCategoryId = "home";
    }

    // SECTION INDEX
    else if (match.isSectionIndex) {
        seoCategoryId = match.sectionId;
    }

    // SUBCATEGORY (index or page)
    else if (match.subcategoryId) {
        seoCategoryId = match.subcategoryId;
    }

    // SECTION CHILD PAGE
    else if (match.sectionId) {
        seoCategoryId = match.sectionId;
    }

    // fallback
    if (!seoCategoryId) seoCategoryId = "pages_index";

    const seoFilePath = `/assets/seo_json_data/${seoCategoryId}_seo_data.json`;


    /* ----------------------------------------
       STEP 3 — DETERMINE SEO KEY
    ---------------------------------------- */
    let seoKey = match.key.toLowerCase();

    const isHome =
        currentPath === "/" ||
        currentPath === "/index.html";

    // If section index
    const sectionObj = navigationData.sections.find(s => s.id === match.sectionId);
    const isSectionIndex = match.key === sectionObj?.title;

    // Detect subcategory index
    let isSubcategoryIndex = false;
    if (sectionObj?.subcategories) {
        isSubcategoryIndex = sectionObj.subcategories.some(
            sub => sub.title === match.key
        );
    }

    // FINAL KEY LOGIC
    if (isHome) {
        seoKey = "home";
    } else if (isSectionIndex) {
        seoKey = match.sectionId.toLowerCase();
    } else if (isSubcategoryIndex) {
        seoKey = match.subcategoryId || match.sectionId || "home";
    } else {
        seoKey = currentPath.split("/").pop().replace(".html", "").toLowerCase();
    }


    /* ----------------------------------------
       STEP 4 — LOAD SEO JSON
    ---------------------------------------- */
    async function loadSEOJson() {
        try {
            const res = await fetch(seoFilePath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("❌ SEO JSON Load Failed:", err);
            return null;
        }
    }

    const seoJson = await loadSEOJson();
    if (!seoJson) return;

    const seo = seoJson[seoKey];
    if (!seo) {
        console.warn("❌ No SEO entry for key:", seoKey);
        return;
    }

    /* ----------------------------------------
       STEP 5 — Inject Tags
    ---------------------------------------- */
    document.title = seo.og?.title || match.key || seoKey;

    function inject(tag, attrs) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        document.head.appendChild(el);
    }

    function injectJSONLD(json) {
        const el = document.createElement("script");
        el.type = "application/ld+json";
        el.textContent = JSON.stringify(json);
        document.head.appendChild(el);
    }

    if (seo.metaDescription)
        inject("meta", { name: "description", content: seo.metaDescription });

    if (seo.canonical)
        inject("link", { rel: "canonical", href: seo.canonical });

    if (seo.og) {
        for (const [k, v] of Object.entries(seo.og)) {
            inject("meta", { property: `og:${k}`, content: v });
        }
    }

    if (seo.twitter) {
        for (const [k, v] of Object.entries(seo.twitter)) {
            inject("meta", { name: `twitter:${k}`, content: v });
        }
    }

    if (seo.jsonld) {
        injectJSONLD({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: seo.jsonld.pageTitle,
            description: seo.jsonld.pageDescription,
            keywords: seo.jsonld.keywords.join(", ")
        });
    }

    console.info("✔ SEO Loaded Successfully:", seoCategoryId, "→", seoKey);

})();
