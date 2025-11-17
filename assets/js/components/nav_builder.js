/* ============================================================
   nav_builder_v3.js
   Dynamic navigation builder (title-aware, folder-agnostic)
   Compatible with:
     - navigation_data.json (dir-aware)
     - nav.js (desktop/mobile behavior)
     - toc_lookup_v3.js
   ============================================================ */

async function loadNavData() {
    const res = await fetch("/assets/navigation_data.json");
    return await res.json();
}

/* ============================================================
   MAIN ENTRY — Build Dynamic Navigation
   ============================================================ */
export async function buildDynamicNav() {
    const navData = await loadNavData();
    const root = document.querySelector("#dynamic-nav-root");

    if (!root) {
        console.error("[nav_builder] ❌ Missing #dynamic-nav-root");
        return;
    }

    console.groupCollapsed("%c[nav_builder] Building Menu", "color:#4db6ac");

    /* ------------------------------------------------------------
       HOME BUTTON (static)
    ------------------------------------------------------------ */
    root.appendChild(makeSimpleItem(navData.home.title, navData.home.url, true));


    /* ------------------------------------------------------------
       BUILD ALL MAIN SECTIONS
    ------------------------------------------------------------ */
    navData.sections.forEach(section => {

        // CASE 1 → Complex 2-tier menu (Financial Ed + Protection Products)
        if (section.subcategories) {
            root.appendChild(makeTieredSection(section));
            return;
        }

        // CASE 2 → Mini dropdown (Services, About Us)
        if (section.pages && section.pages.length > 0) {
            root.appendChild(makeMiniDropdown(section));
            return;
        }

        // CASE 3 → Simple link (Stories, Contact, Consultation)
        root.appendChild(makeSimpleItem(section.title, buildUrl(section)));
    });

    console.groupEnd();
    console.info("[nav_builder] ✅ Menu generation complete.");
}


/* ============================================================
   URL BUILDER v4 — FULL DIR INHERITANCE
   - If item has its own dir → use it
   - If item has no dir → inherit dir from parent
   ============================================================ */
function buildUrl(item, parent = null) {
    // Direct dir on item
    if (item.dir) return item.dir + item.url.replace(/^\//, "");

    // Inherit dir from parent if exists
    if (parent && parent.dir) {
        return parent.dir + item.url.replace(/^\//, "");
    }

    // Fallback
    return item.url;
}


/* ============================================================
   SIMPLE TOP-LEVEL ITEM (Home, Stories, Contact)
   ============================================================ */
function makeSimpleItem(title, url, isHome = false) {
    const div = document.createElement("div");

    div.innerHTML = `
        <a class="menu-link"
           role="menuitem"
           ${isHome ? 'data-home="true"' : ""}
           href="${url}">
            ${title}
        </a>
    `;
    return div;
}


/* ============================================================
   MINI DROPDOWN (Services, About Us)
   — styled like your Tier-1 menu for consistency
   ============================================================ */
function makeMiniDropdown(section) {
    const div = document.createElement("div");
    div.className = "menu-item nav-item--has-dropdown nav-mini";
    div.id = `nav-${section.id}`;

    div.innerHTML = `
        <div class="parent-with-caret">
            <a class="link" href="${buildUrl(section)}" role="menuitem">
                ${section.title}
            </a>
            <button class="caret-toggle" aria-expanded="false" aria-haspopup="true">
                <span class="caret">
                    <svg width="10" height="10" viewBox="0 0 20 20">
                        <path d="M5 7l5 6 5-6"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"/>
                    </svg>
                </span>
            </button>
        </div>

        <div class="dropdown-pane dropdown-pane--mini" role="menu">
            <section class="mini-card">
                <ul class="tier1-list">
                    ${section.pages
        .map(p => `
                            <li class="mini-tier1-item">
                                <a class="tier1-label" href="${buildUrl(p, section)}" role="menuitem">
                                    ${p.title}
                                </a>
                            </li>
                        `)
        .join("")}
                </ul>
            </section>
        </div>
    `;

    return div;
}



/* ============================================================
   FULL 2-TIER SECTION (Financial Education, Protection Products)
   ============================================================ */
/* ============================================================
   FULL 2-TIER SECTION (Financial Education, Protection Products)
   DIR-AWARE VERSION
   ============================================================ */
function makeTieredSection(section) {
    const root = document.createElement("div");

    root.className = `menu-item nav-item--has-dropdown nav-${section.id}`;
    root.id = `nav-${section.id}`;

    root.innerHTML = `
        <div class="parent-with-caret">
            <a class="link" href="${buildUrl(section)}" role="menuitem">
                ${section.title}
            </a>
            <button class="caret-toggle" aria-expanded="false" aria-haspopup="true">
                <span class="caret">
                    <svg width="10" height="10" viewBox="0 0 20 20">
                        <path d="M5 7l5 6 5-6"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"/>
                    </svg>
                </span>
            </button>
        </div>

        <div class="dropdown-pane dropdown-pane--tier1" role="menu">
            <div class="mini-card card-tier1">
                <ul class="tier1-list">
                    ${section.subcategories
        .map(
            cat => `
                                <li class="tier1-item" data-submenu="${cat.id}">
                                    <a class="tier1-label" href="${buildUrl(cat, section)}" role="menuitem">
                                        ${cat.icon || ""} ${cat.title}
                                    </a>
                                </li>
                            `
        )
        .join("")}
                </ul>
            </div>

            ${section.subcategories
        .map(
            cat => `
                        <div class="submenu-pane" id="submenu-${cat.id}" role="menu">
                            <div class="mini-card card-tier2">
                                <ul>
                                    ${cat.pages
                .map(
                    p => `
                                                <li>
                                                    <a href="${buildUrl(p, cat)}" role="menuitem">
                                                        ${p.title}
                                                    </a>
                                                </li>
                                            `
                )
                .join("")}
                                </ul>
                            </div>
                        </div>
                    `
        )
        .join("")}
        </div>
    `;

    return root;
}

