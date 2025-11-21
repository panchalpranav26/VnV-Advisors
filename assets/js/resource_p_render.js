console.log("%c[resources-p] MODULE LOADED", "color:#4caf50;font-weight:bold;");

/* -------------------------------------------------------------
   BUILD HTML (<p> renderer)
------------------------------------------------------------- */
export async function buildCombinedResourceHTML_P(attrs) {
    console.group("[resources-p] Building Combined HTML (p renderer)");

    let html = "";

    for (const pageId of attrs.pageIdArray) {
        for (const subId of attrs.subcategoryIdArray) {
            for (const secId of attrs.sectionIdArray) {

                const typeList = attrs.typeArray.length ? attrs.typeArray : [null];

                console.log(`→ Combos: page:${pageId}, sub:${subId}, sec:${secId}, types:`, typeList);

                for (const t of typeList) {
                    console.log("   → Fetching resources for type:", t);

                    const r = await window.getPageResources(pageId, subId, secId, t);

                    if (r) {
                        console.log("   ✔ Match found:", r);
                        html += `<p class="resource">${r}</p>`;
                    } else {
                        console.log("   ✖ No match");
                    }
                }
            }
        }
    }

    console.groupEnd();
    return html;
}


/* -------------------------------------------------------------
   INITIALIZER — finds all <p>-render containers and fills them
------------------------------------------------------------- */
export async function initResourcePRenderer() {
    console.group("%c[resources-p] INIT", "color:#03a9f4;font-weight:bold;");

    console.log("[resources-p] Ensuring trusted data…");
    await window.ensureTrustedData();
    console.log("[resources-p] Trusted data ready");

    const containers = document.querySelectorAll(".page-resources[data-render='p']");
    console.log(`[resources-p] Found ${containers.length} <p>-render containers`);

    if (containers.length === 0) {
        console.warn("[resources-p] ⚠ No containers found with data-render='p'");
        console.groupEnd();
        return;
    }

    for (const el of containers) {
        console.group("[resources-p] Processing element", el);

        const attrs = window.readResourceAttributes(el);
        console.log("[resources-p] Parsed attributes:", attrs);

        if (!attrs) {
            console.warn("[resources-p] ⚠ Invalid attributes — skipping");
            console.groupEnd();
            continue;
        }

        const html = await buildCombinedResourceHTML_P(attrs);
        console.log("[resources-p] Final HTML:", html);

        el.innerHTML = html || "";
        console.log("✔ Inserted into element");

        console.groupEnd();
    }

    console.groupEnd();
}


/* -------------------------------------------------------------
   AUTO-INIT WHEN INCLUDED
------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", initResourcePRenderer);
