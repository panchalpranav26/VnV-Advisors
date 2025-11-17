/* ============================================================
   page_toc_v3.js
   Title-aware Floating Page TOC
   Uses lookupNavTitles_v3.js for breadcrumb resolution.
   ============================================================ */

import { lookupNavTitles } from "./lookupNavTitles.js";

export async function initPageTOC() {
    console.groupCollapsed(
        "%c[TOC] Init Floating Page TOC (title-aware)",
        "color:#4db6ac;font-weight:600;"
    );

    /* ------------------------------------------------------------
       1. GET PAGE TITLE (normalize)
    ------------------------------------------------------------ */
    const fullTitle = document.title || "";
    const cleanPageTitle = fullTitle.replace("– V & V Advisors", "").trim();

    console.log("[TOC][debug] HTML Title:", cleanPageTitle);


    /* ------------------------------------------------------------
       2. LOOKUP JSON MENU/SECTION/PAGE TITLES
    ------------------------------------------------------------ */
    const lookup = await lookupNavTitles();
    console.log("[TOC][debug] Lookup Result:", lookup);

    const {
        jsonMenuTitle,
        jsonSectionTitle,
        jsonPageTitle,
        pageUrl
    } = lookup;


    /* ------------------------------------------------------------
       3. SELECT ALL SECTIONS <h2>
    ------------------------------------------------------------ */
    const headings = document.querySelectorAll(".flashy-section h2");
    if (!headings.length) {
        console.warn("[TOC] No .flashy-section h2 headings found → TOC cancelled.");
        console.groupEnd();
        return;
    }

    const toc = document.createElement("nav");
    toc.className = "page-toc page-toc--left";

    const header = document.createElement("div");
    header.className = "page-toc__header";


    /* ------------------------------------------------------------
       4. CREATE BREADCRUMBS BASED ON MATCH TYPE (DIR-AWARE)
    ------------------------------------------------------------ */

    const menuURL    = buildUrlTOC(lookup.menuData);
    const sectionURL = buildUrlTOC(lookup.sectionData, lookup.menuData);
    const pageURL    = buildUrlTOC(lookup.pageData, lookup.sectionData);


    /** CASE A — HOME PAGE */
    if (cleanPageTitle === "Home") {
        // no breadcrumbs
    }

    /** CASE B — TOP LEVEL PAGE (Stories, Contact, etc.) */
    else if (jsonMenuTitle && !jsonSectionTitle) {
        header.appendChild(makeCrumb("Home", "/index.html"));
        header.appendChild(makeCrumb(jsonMenuTitle, menuURL));
    }

    /** CASE C — MENU INDEX PAGE */
    else if (jsonMenuTitle && cleanPageTitle === jsonMenuTitle) {
        header.appendChild(makeCrumb("Home", "/index.html"));
        header.appendChild(makeCrumb(jsonMenuTitle, menuURL));
    }

    /** CASE D — SECTION INDEX PAGE */
    else if (jsonMenuTitle && jsonSectionTitle && cleanPageTitle === jsonSectionTitle) {
        header.appendChild(makeCrumb("Home", "/index.html"));
        header.appendChild(makeCrumb(jsonMenuTitle, menuURL));
        header.appendChild(makeCrumb(jsonSectionTitle, sectionURL));
    }

    /** CASE E — CONTENT PAGE */
    else if (jsonPageTitle) {
        header.appendChild(makeCrumb("Home", "/index.html"));
        header.appendChild(makeCrumb(jsonMenuTitle, menuURL));

        if (jsonSectionTitle) {
            header.appendChild(makeCrumb(jsonSectionTitle, sectionURL));
        }
    }


    /* Divider line */
    header.appendChild(
        Object.assign(document.createElement("div"), {
            className: "page-toc__divider"
        })
    );


    /* ------------------------------------------------------------
       5. ADD PAGE TITLE (avoid duplicates)
    ------------------------------------------------------------ */
    const shouldHidePageTitle =
        cleanPageTitle === jsonMenuTitle ||
        cleanPageTitle === jsonSectionTitle;

    if (!shouldHidePageTitle) {
        const titleBtn = document.createElement("button");
        titleBtn.className = "page-toc__title btn-toc-glow--title active";
        titleBtn.textContent = cleanPageTitle;

        titleBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setActiveLink(null);
        });

        header.appendChild(titleBtn);
    }

    toc.appendChild(header);


    /* ------------------------------------------------------------
       6. BUILD ANCHOR LIST FROM <h2> HEADINGS
    ------------------------------------------------------------ */
    const list = document.createElement("ul");
    const tocLinks = [];

    headings.forEach((heading, idx) => {
        const text = heading.textContent.trim();
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        const section = heading.closest(".flashy-section");
        if (!section) return;

        if (!section.id) section.id = slug || `section-${idx}`;

        const li = document.createElement("li");
        li.innerHTML = `<a href="#${section.id}">${text}</a>`;

        const link = li.querySelector("a");
        list.appendChild(li);

        tocLinks.push({ link, section });

        link.addEventListener("click", e => {
            e.preventDefault();
            const y = section.getBoundingClientRect().top + window.scrollY - 60;
            window.scrollTo({ top: y, behavior: "smooth" });
            setActiveLink(link);
        });
    });

    toc.appendChild(list);



    /* ------------------------------------------------------------
       8. ADD FREE CONSULTATION CTA AT BOTTOM OF TOC
    ------------------------------------------------------------ */
    const tocCTA = document.createElement("div");
    tocCTA.className = "btn-glow md";

    tocCTA.innerHTML = `
    <a href="/pages/consultation.html" class="btn-glow sm toc-cta-btn">
        Free Consultation
    </a>
    `;

// Append CTA *after* the heading list
    toc.appendChild(tocCTA);

    document.body.appendChild(toc);


    /* ------------------------------------------------------------
       7. SCROLL-BASED ACTIVE HIGHLIGHT
    ------------------------------------------------------------ */
    function setActiveLink(activeLink) {
        tocLinks.forEach(item => item.link.classList.remove("active"));

        if (!activeLink) {
            document
                .querySelector(".page-toc__title.btn-toc-glow--title")
                ?.classList.add("active");
            return;
        }
        activeLink.classList.add("active");
    }

    window.addEventListener("scroll", () => {
        if (window.scrollY < 80) {
            setActiveLink(null);
            return;
        }

        const trigger = window.innerHeight * 0.28;

        let bestMatch = null;
        let smallestDiff = Infinity;

        tocLinks.forEach(({ link, section }) => {
            const rect = section.getBoundingClientRect();
            const diff = Math.abs(rect.top - trigger);

            if (rect.top <= trigger && diff < smallestDiff) {
                smallestDiff = diff;
                bestMatch = link;
            }
        });

        setActiveLink(bestMatch || null);
    });

    console.groupEnd();



    /* ============================================================
       HELPERS
    ============================================================ */
    function makeCrumb(title, url) {
        const a = document.createElement("a");
        a.className = "page-toc__title btn-toc-glow--headers";
        a.textContent = title;
        a.href = url;
        return a;
    }
}


/* ============================================================
   DIR-AWARE URL BUILDER for TOC (matches nav_builder_v3)
   ============================================================ */
function buildUrlTOC(item, parent = null) {
    if (!item) return "#";

    // 1. If JSON entry has absolute dir → use it
    if (item.dir) {
        return item.dir + item.url.replace(/^\//, "");
    }

    // 2. Inherit dir from parent
    if (parent && parent.dir) {
        return parent.dir + item.url.replace(/^\//, "");
    }

    // 3. Fallback: use url as-is
    return item.url;
}
