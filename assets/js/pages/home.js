/*
 * FILE: assets/js/pages/home.js
 * ROLE: JavaScript logic specific to the Home page (index.html).
 * HOW TO MODIFY: Add logic for hero animations, carousels, or interactive elements unique to the homepage.
 * EXTENSION POINTS: None.
 */

document.addEventListener("header-loaded", () => {

    // Get all accordion buttons AFTER header loads
    const buttons = document.querySelectorAll('.accordion-btn');

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {

            const isOpen = btn.getAttribute("aria-expanded") === "true";

            // Close all other accordions
            buttons.forEach(b => {
                b.setAttribute("aria-expanded", "false");
                b.nextElementSibling.classList.remove("open");
            });

            // Open clicked accordion (if it wasn't already open)
            if (!isOpen) {
                btn.setAttribute("aria-expanded", "true");
                btn.nextElementSibling.classList.add("open");
            }
        });
    });

    console.log("✔ Accordion initialized successfully AFTER header load");
});