/* ============================================================
   page_toc_v4.js
   Clean TOC — Powered by lookupNavTitles_v7.js
   Pure lookup-driven breadcrumbs, no guessing.
   ============================================================ */

import { lookupNavTitles } from "./lookupNavTitles.js";

export async function initPageTOC() {
    console.groupCollapsed(
        "%c[TOC] Init Floating Page TOC (LEVEL-AWARE)",
        "color:#4db6ac;font-weight:600;"
    );

    /* ------------------------------------------------------------
       1. LOOKUP NAV TITLES (STRICT URL + DIR MATCHING)
    ------------------------------------------------------------ */
    const lookup = await lookupNavTitles();
    console.log("[TOC] Lookup:", lookup);

    const {
        level,
        jsonMenuTitle,
        jsonSectionTitle,
        jsonPageTitle,
        menuData,
        sectionData,
        pageData
    } = lookup;

    const isHomePage = level === "home";

    /* ------------------------------------------------------------
       2. RESOLVE PAGE TITLE (after lookup!)
    ------------------------------------------------------------ */
    const htmlTitle = (document.title || "")
        .replace("– V & V Advisors", "")
        .trim();

    let pageTitle = lookup.jsonPageTitle;

// If it's a section index, fallback appropriately
    if (!pageTitle) {
        pageTitle = lookup.jsonSectionTitle || lookup.jsonMenuTitle || htmlTitle;
    }

    console.log("[TOC] Final Resolved Page Title:", pageTitle);

    /* ------------------------------------------------------------
       3. FIND <h2> HEADINGS
    ------------------------------------------------------------ */
    const headings = document.querySelectorAll(".flashy-section h2");
    if (!headings.length) {
        console.warn("[TOC] No .flashy-section h2 headings → TOC cancelled.");
        console.groupEnd();
        return;
    }

    /* ------------------------------------------------------------
       4. BUILD TOC CONTAINER
    ------------------------------------------------------------ */
    const toc = document.createElement("nav");
    toc.className = "page-toc page-toc--left";

    const header = document.createElement("div");
    header.className = "page-toc__header";

    /* Always add HOME at top */
    const homeTop = document.createElement("a");
    homeTop.className = "page-toc__title btn-toc-glow--headers";
    homeTop.textContent = "Home";
    homeTop.href = "/index.html";
    header.appendChild(homeTop);

    /* ------------------------------------------------------------
       5. BREADCRUMBS
    ------------------------------------------------------------ */
    console.groupCollapsed(
        "%c[TOC][breadcrumbs] Rendering Breadcrumbs",
        "color:#ffc107;font-weight:700;"
    );
    console.log("[isHomePage]:", isHomePage);
    console.log("[jsonMenuTitle]:", jsonMenuTitle);
    console.log("[jsonSectionTitle]:", jsonSectionTitle);
    console.log("[jsonPageTitle]:", jsonPageTitle);
    console.log("[pageTitle]:", pageTitle);

    if (!isHomePage) {

        /* MENU LEVEL */
        if (jsonMenuTitle) {
            console.log(
                `%c[breadcrumb] MENU → ${jsonMenuTitle}`,
                "color:#4caf50;font-weight:600;"
            );
            header.appendChild(
                makeCrumb(jsonMenuTitle, buildUrl(menuData), "menu")
            );
        }

        /* SECTION LEVEL */
        if (jsonSectionTitle) {
            console.log(
                `%c[breadcrumb] SECTION → ${jsonSectionTitle}`,
                "color:#2196f3;font-weight:600;"
            );
            header.appendChild(
                makeCrumb(jsonSectionTitle, buildUrl(sectionData), "section")
            );
        }

        /* PAGE TITLE LEVEL (only if unique) */
        let skipPageTitle =
            !pageTitle ||
            pageTitle.toLowerCase() === "home" ||
            pageTitle === jsonMenuTitle ||
            pageTitle === jsonSectionTitle;

// NEW FIX — If the menu is Home, skip page-title in TOC
        if (jsonMenuTitle === "Home") skipPageTitle = true;

        console.log("[page-title skip?]:", skipPageTitle);


        if (!skipPageTitle) {
            console.log(`[breadcrumb] PAGE TITLE → ${pageTitle}`);

            const titleBtn = document.createElement("button");
            titleBtn.className = "page-toc__title btn-toc-glow--title active";
            titleBtn.textContent = pageTitle;

            titleBtn.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setActiveLink(null);
            });

            header.appendChild(titleBtn);
        }


    }

    console.groupEnd();

    /* Divider */
    header.appendChild(
        Object.assign(document.createElement("div"), {
            className: "page-toc__divider"
        })
    );

    toc.appendChild(header);

    /* ------------------------------------------------------------
       6. SECTION ANCHORS
    ------------------------------------------------------------ */
    const list = document.createElement("ul");
    const tocLinks = [];

    headings.forEach((heading, idx) => {
        const text = heading.textContent.trim();
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const section = heading.closest(".flashy-section");

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
       7. CTA
    ------------------------------------------------------------ */
    const tocCTA = document.createElement("div");
    tocCTA.className = "btn-toc-consult";
    tocCTA.innerHTML = `<a href="/pages/consultation.html">Book Consultation</a>`;
    toc.appendChild(tocCTA);

    document.body.appendChild(toc);

    /* ------------------------------------------------------------
       8. ACTIVE HIGHLIGHT
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
}

/* ============================================================
   HELPERS
============================================================ */
function buildUrl(item) {
    if (!item) return "#";
    return item.dir
        ? item.dir + item.url.replace(/^\//, "")
        : item.url;
}

function makeCrumb(title, url, level = "menu") {
    const currentUrl = window.location.pathname;
    const a = document.createElement("a");
    a.className = "page-toc__title btn-toc-glow--headers";

    let icon = "";
    if (level === "menu") icon = "› ";
    if (level === "section") icon = "» ";

    a.textContent = icon + title;

    /* -----------------------------------------------
       CASE: User is already on this page
       → convert crumb to scroll-to-top
    -------------------------------------------------*/
    if (url === currentUrl) {
        console.log(`[breadcrumb] SELF → ${title} (scroll to top)`);

        a.href = "#";
        a.addEventListener("click", e => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        return a;
    }

    /* -----------------------------------------------
       Normal navigation
    -------------------------------------------------*/
    a.href = url;
    return a;
}

