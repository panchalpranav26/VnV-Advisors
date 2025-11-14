export function initPageTOC() {
    console.groupCollapsed("%c[TOC] Init Floating Page TOC", "color:#4db6ac;font-weight:600;");

    const pageTitleEl = document.querySelector('.page-title');
    const headings = document.querySelectorAll('.flashy-section h2');

    if (!headings.length) {
        console.warn("[TOC] ❌ No .flashy-section h2 elements found — TOC cancelled.");
        console.groupEnd();
        return;
    }

    // Build container
    const toc = document.createElement('nav');
    toc.className = 'page-toc page-toc--left';

    // ---- Header ----
    const header = document.createElement('div');
    header.className = 'page-toc__header';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'page-toc__title';

    titleDiv.textContent =
        pageTitleEl ? pageTitleEl.textContent.trim() : "Home";

    // Highlight title on load
    titleDiv.classList.add('active');

    header.appendChild(titleDiv);
    header.appendChild(Object.assign(document.createElement('div'), { className: 'page-toc__divider' }));
    toc.appendChild(header);

    // ---- Build list ----
    const list = document.createElement('ul');
    const tocLinks = [];

    headings.forEach((heading, index) => {
        const text = heading.textContent.trim();
        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const section = heading.closest('.flashy-section');

        if (!section) return;
        if (!section.id) section.id = slug || `section-${index}`;

        const li = document.createElement('li');
        li.innerHTML = `<a href="#${section.id}">${text}</a>`;
        const link = li.querySelector('a');
        list.appendChild(li);

        tocLinks.push({ link, section });

        link.addEventListener('click', (e) => {
            e.preventDefault();

            const y = section.getBoundingClientRect().top + window.scrollY - 60;
            window.scrollTo({ top: y, behavior: 'smooth' });

            setActiveLink(link);
            markAsUserScrolled();
        });
    });

    toc.appendChild(list);
    document.body.appendChild(toc);

    // ---- States ----
    let userHasScrolled = false;

    function markAsUserScrolled() {
        if (!userHasScrolled) userHasScrolled = true;
    }

    // Updated highlight logic
    function setActiveLink(activeLink) {
        tocLinks.forEach(item => item.link.classList.remove('active'));
        titleDiv.classList.remove('active');

        if (!activeLink) {
            titleDiv.classList.add('active'); // highlight title again
            return;
        }

        activeLink.classList.add('active');
    }

    // ---- Scroll listener ----
    window.addEventListener('scroll', () => {

        // Restore title highlight when near top
        if (window.scrollY < 80) {
            setActiveLink(null);
            return;
        }

        if (!userHasScrolled && window.scrollY > 60) {
            markAsUserScrolled();
        }

        if (userHasScrolled) runHighlightCheck();
    });

    // ---- Auto-highlight sections ----
    function runHighlightCheck() {
        const triggerLine = window.innerHeight * 0.28;

        let bestMatch = null;
        let smallestDiff = Infinity;

        tocLinks.forEach(({ link, section }) => {
            const rect = section.getBoundingClientRect();
            const distance = Math.abs(rect.top - triggerLine);

            if (rect.top <= triggerLine && distance < smallestDiff) {
                smallestDiff = distance;
                bestMatch = link;
            }
        });

        setActiveLink(bestMatch || null);
    }

    console.groupEnd();
}
