/*
 * FILE: assets/js/pages/home.js
 * ROLE: JavaScript logic specific to the Home page (index.html).
 * HOW TO MODIFY: Add logic for hero animations, carousels, or interactive elements unique to the homepage.
 * EXTENSION POINTS: None.
 */

document.querySelectorAll('.accordion-btn').forEach(button => {
    button.addEventListener('click', () => {
        const expanded = button.getAttribute('aria-expanded') === 'true';
        const content = button.nextElementSibling;

        // Close all others (optional but recommended)
        document.querySelectorAll('.accordion-btn').forEach(btn => {
            if (btn !== button) {
                btn.setAttribute('aria-expanded', 'false');
                btn.nextElementSibling.classList.remove('open');
            }
        });

        // Toggle current
        button.setAttribute('aria-expanded', !expanded);
        content.classList.toggle('open', !expanded);
    });
});
