/* ============================================================
   nav_builder_v3.js — CLEAN, FIXED, SAFE
============================================================ */

async function loadNavData() {
    const res = await fetch("/assets/navigation_data.json");
    return await res.json();
}

// Detect current path elements
const currentPathParts = window.location.pathname.split("/").filter(Boolean);

const CURRENT_SECTION = currentPathParts[1] || null;
const CURRENT_TIER1  = currentPathParts[2] || null;

// ============================================================
// MAIN ENTRY
// ============================================================
export async function buildDynamicNav() {
    const navData = await loadNavData();
    const root = document.querySelector("#dynamic-nav-root");

    if (!root) {
        console.error("[nav_builder] ❌ Missing #dynamic-nav-root");
        return;
    }

    console.groupCollapsed("%c[nav_builder] Building Menu", "color:#4db6ac");

    // HOME
    root.appendChild(makeSimpleItem(navData.home.title, navData.home.url, "home"));

    // MAIN SECTIONS
    navData.sections.forEach(section => {

        // Case 1: Tiered (Financial Ed, Protection Products)
        if (section.subcategories) {
            root.appendChild(makeTieredSection(section));
            return;
        }

        // Case 2: Mini Dropdown
        if (section.pages && section.pages.length > 0) {
            root.appendChild(makeMiniDropdown(section));
            return;
        }

        // Case 3: Simple Link
        root.appendChild(makeSimpleItem(section.title, buildUrl(section), section.id));
    });

    console.groupEnd();
}

function getRootLinkClass(section) {
    return section.id === "opportunity" ? "hgi-link" : "dd-link";
}

/* ============================================================
   URL BUILDER
============================================================ */
function buildUrl(item, parent = null) {
    if (item.dir) return item.dir + item.url.replace(/^\//, "");
    if (parent && parent.dir) return parent.dir + item.url.replace(/^\//, "");
    return item.url;
}


/* ============================================================
   SIMPLE ITEM (No dropdown)
============================================================ */
function makeSimpleItem(title, url, id) {
    const div = document.createElement("div");

    div.innerHTML = `
        <a class="menu-link"
           role="menuitem"
           data-title="${title}"
           data-nav-id="${id}"
           href="${url}">
            ${title}
        </a>
    `;

    return div;
}


/* ============================================================
   MINI DROPDOWN (Services, About Us)
============================================================ */

function getDropdownPaneClass(section) {
    const cls = section.id === "opportunity"
        ? "hgi-dropdown-pane"
        : "dropdown-pane";

    console.debug(`[nav] Dropdown pane for "${section.id}" → ${cls}`);
    return cls;
}

function getTier1LabelClass(section) {
    return section.id === "opportunity"
        ? "hgi-tier1-label"
        : "tier1-label";
}


function makeMiniDropdown(section) {
    const div = document.createElement("div");
    div.className = "menu-item nav-item--has-dropdown nav-mini";
    div.id = `nav-${section.id}`;

    div.innerHTML = `
        <div class="parent-with-caret">
            <a class="${getRootLinkClass(section)}"
               href="${buildUrl(section)}"
               data-title="${section.title}"
               data-nav-id="${section.id}"
               role="menuitem">
                ${section.title}
            </a>

            <button class="caret-toggle" aria-expanded="false">
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

        <div class="${getDropdownPaneClass(section)} dropdown-pane--mini">
            <section class="mini-card">
                <ul class="tier1-list">
                    ${section.pages.map(p => `
                        <li class="mini-tier1-item">
                            <a class="${getTier1LabelClass(section)}"
                               href="${buildUrl(p, section)}"
                               data-title="${p.title}"
                               data-nav-id="${p.title.toLowerCase().replace(/\s+/g,'_')}"
                               role="menuitem">
                                ${p.title}
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </section>
        </div>
    `;

    return div;
}


/* ============================================================
   TIERED SECTION (Financial Ed + Protection Products)
============================================================ */
function makeTieredSection(section) {
    const root = document.createElement("div");

    root.className = `menu-item nav-item--has-dropdown nav-${section.id}`;
    root.id = `nav-${section.id}`;

    root.innerHTML = `
        <div class="parent-with-caret">
            <a class="dd-link"
               href="${buildUrl(section)}"
               data-title="${section.title}"
               data-nav-id="${section.id}"
               role="menuitem">
                ${section.title}
            </a>

            <button class="caret-toggle" aria-expanded="false">
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

        <div class="dropdown-pane dropdown-pane--tier1">
            <div class="mini-card card-tier1">
                <ul class="tier1-list">
                    ${section.subcategories.map(cat => `
                        <li class="tier1-item" ${CURRENT_TIER1 === cat.id ? "nav-active-tier1" : ""}"
                            data-submenu="${cat.id}"
                            data-nav-id="${cat.id}">

                            <a class="tier1-label"
                               href="${buildUrl(cat, section)}"
                               data-title="${cat.title}"
                               data-nav-id="${cat.id}"
                               role="menuitem">
                                ${cat.icon || ""} ${cat.title}
                            </a>
                        </li>
                    `).join("")}
                </ul>
            </div>

            ${section.subcategories.map(cat => `
                <div class="submenu-pane" id="submenu-${cat.id}">
                    <div class="mini-card card-tier2">
                        <ul>
                            ${cat.pages.map(p => `
                                <li>
                                    <a href="${buildUrl(p, cat)}"
                                       role="menuitem"
                                       data-title="${p.title}"
                                       data-nav-id="${p.title.toLowerCase().replace(/\s+/g,'_')}">
                                        ${p.title}
                                    </a>
                                </li>
                            `).join("")}
                        </ul>
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    return root;
}
