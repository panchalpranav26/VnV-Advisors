/*************************************************************
 * SEO AUTO LOADER — FINAL STABLE VERSION (NO ASSERT ERRORS)
 * Loads ONLY the SEO JSON for the current page.
 *************************************************************/

(async function () {

    // Load navigation_data.json safely via fetch()
    let navigationData = null;
    try {
        const res = await fetch("/assets/navigation_data.json");
        navigationData = await res.json();
    } catch (err) {
        console.error("❌ Could not load navigation_data.json", err);
    }

    /** STOP if navigation data failed **/
    if (!navigationData) {
        console.error("❌ SEO Loader aborted — navigation data missing.");
        return;
    }

    // STEP 1 — Detect current URL
    const currentPath = window.location.pathname;

    /**
     * STEP 2 — Match page in navigation_data.json
     */
    function joinPaths(dir, url) {
        const cleanDir = (dir || "").replace(/\/+$/, "");      // remove trailing slash
        const cleanUrl = (url || "").replace(/^\/+/, "");      // remove leading slash
        return cleanDir + "/" + cleanUrl;
    }

    function findNavMatch() {
        console.groupCollapsed("%c[SEO] Matching navigation…", "color:#38bdf8;font-weight:bold");
        console.log("Current Path:", currentPath);

        for (const section of navigationData.sections) {

            // Build full path using dir + url
            const sectionFullUrl = joinPaths(section.dir, section.url);
            console.log("%cChecking section:", "color:#a78bfa", section.id, "→", sectionFullUrl);

            // Match SECTION index page
            if (sectionFullUrl === currentPath) {
                console.log("%cMATCH → Section URL", "color:#4ade80;font-weight:bold");
                console.groupEnd();
                return { id: section.id, key: section.title };
            }

            // Match CHILD pages
            if (section.pages) {
                for (const page of section.pages) {

                    // Full child path = dir + page.url
                    const pageFullUrl = joinPaths(section.dir, page.url);

                    if (pageFullUrl === currentPath) {
                        console.log("%cMATCH → Page inside section", "color:#4ade80;font-weight:bold");
                        console.log("Page Title:", page.title);
                        console.groupEnd();
                        return { id: section.id, key: page.title };
                    }
                }
            }
        }

        console.warn(
            "%cNO MATCH → fallback pages_index → home",
            "color:#f87171;font-weight:bold"
        );
        console.groupEnd();

        return { id: "pages_index", key: "home" };
    }



    /********************************************
     * ✔ NOW we call findNavMatch()
     ********************************************/
    const match = findNavMatch();
    const pagesIndexIds = ["contact", "consultation", "home"];

    let categoryId = match.id;
    if (pagesIndexIds.includes(categoryId)) {
        categoryId = "pages_index";
    }
    let seoKey = match.key;


    /********************************************
     * ✔ DEBUG BLOCK — now match exists
     ********************************************/
    console.groupCollapsed("%c[SEO] Key Normalization & Resolution", "color:#38bdf8;font-weight:bold");

    console.log("📌 match.id:", match.id);
    console.log("📌 match.key (raw):", match.key);
    console.log("📌 currentPath:", currentPath);

    // Normalize
    seoKey = seoKey.toLowerCase();
    console.log("🔤 Normalized seoKey:", seoKey);

    const isHome = categoryId === "pages_index";
    const sectionObj = navigationData.sections.find(s => s.id === categoryId);
    const isSectionIndex = match.key === sectionObj?.title;

    console.log("🏡 isHome:", isHome);
    console.log("📚 isSectionIndex:", isSectionIndex);
    console.log("📁 categoryId:", categoryId);
    console.log("📄 section.title:", sectionObj?.title);

    // Apply final SEO key logic
    if (!isHome && isSectionIndex) {
        seoKey = categoryId.toLowerCase();
        console.log("%c✔ SECTION INDEX key:", "color:#4ade80;font-weight:bold", seoKey);
    } else if (!isHome) {
        seoKey = currentPath.split("/").pop().replace(".html", "").toLowerCase();
        console.log("✔ CHILD PAGE SLUG key:", seoKey);
    } else {
        console.log("%c✔ HOME key:", "color:#4ade80;font-weight:bold", seoKey);
    }

    console.log("🔑 %cFinal SEO Key Used:", "color:#22d3ee;font-weight:bold", seoKey);
    console.groupEnd();


    /********************************************
     * STEP 3 — Fetch SEO JSON file
     ********************************************/
    const seoFilePath = `/assets/seo_json_data/${categoryId}_seo_data.json`;

    async function loadSEOJson() {
        console.groupCollapsed(`🔍 SEO Loader: Fetching "${categoryId}" JSON`);
        console.log("➡ File:", seoFilePath);

        try {
            const res = await fetch(seoFilePath);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            console.log("✅ Loaded SEO JSON");
            console.log("📄 Keys:", Object.keys(json));
            console.groupEnd();
            return json;

        } catch (err) {
            console.error("❌ SEO Loader Failed:", err);
            console.groupEnd();
            return null;
        }
    }


    /********************************************
     * STEP 4 — Inject helpers
     ********************************************/
    function inject(tagName, attrs) {
        const el = document.createElement(tagName);
        for (const [k, v] of Object.entries(attrs)) {
            if (v !== undefined && v !== null) el.setAttribute(k, v);
        }
        document.head.appendChild(el);
    }

    function injectJSONLD(json) {
        const el = document.createElement("script");
        el.type = "application/ld+json";
        el.textContent = JSON.stringify(json);
        document.head.appendChild(el);
    }


    /********************************************
     * STEP 5 — Perform Injection
     ********************************************/
    const seoJson = await loadSEOJson();

    console.groupCollapsed("🔍 SEO Injection Debug");

    if (!seoJson) {
        console.warn("❌ No SEO JSON loaded.");
        console.groupEnd();
        return;
    }

    const seo = seoJson[seoKey];
    if (!seo) {
        console.warn("❌ No SEO entry for key:", seoKey);
        console.groupEnd();
        return;
    }

    console.log("✔ Using SEO entry:", seoKey);
    console.log("📌 Category:", categoryId);

    // TITLE
    document.title = seo.og?.title || match.key || seoKey;

    if (seo.og?.title) {
        document.title = seo.og.title;
        console.log("🏷 Title using OG:", seo.og.title);
    } else {
        document.title = match.key;
        console.log("🏷 Title using Navigation Title:", match.key);
    }

    // BASE META
    if (seo.metaDescription) inject("meta", { name: "description", content: seo.metaDescription });
    if (seo.canonical) inject("link", { rel: "canonical", href: seo.canonical });

    // OG
    if (seo.og) {
        for (const [k, v] of Object.entries(seo.og)) {
            inject("meta", { property: `og:${k}`, content: v });
        }
    }

    // TWITTER
    if (seo.twitter) {
        for (const [k, v] of Object.entries(seo.twitter)) {
            inject("meta", { name: `twitter:${k}`, content: v });
        }
    }

    // JSON-LD
    if (seo.jsonld) {
        injectJSONLD({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: seo.jsonld.pageTitle,
            description: seo.jsonld.pageDescription,
            keywords: seo.jsonld.keywords.join(", ")
        });
    }

    console.info(
        "%c✔ SEO Loaded Successfully",
        "color:#22d3ee;font-weight:bold",
        categoryId,
        "→",
        seoKey
    );

    console.groupEnd();

})(); // async IIFE

