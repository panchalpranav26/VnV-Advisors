


export function addJSONLDSchema({
                                    pageTitle,
                                    pageDescription,
                                    pageUrl,
                                    keywords = [],
                                    businessName = "V & V Advisors",
                                    city = "Tracy",
                                    state = "CA",
                                    country = "US"
                                }) {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": ["FinancialService", "EducationalOrganization"],
                "name": businessName,
                "description":
                    pageDescription ||
                    "Empowering families with financial literacy, protection, and wealth-building strategies.",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": city,
                    "addressRegion": state,
                    "addressCountry": country
                },
                "areaServed": country,
                "url": pageUrl || window.location.href,
                "keywords": keywords.join(", ")
            },
            {
                "@type": "WebPage",
                "name": pageTitle || document.title,
                "description": pageDescription,
                "url": pageUrl || window.location.href
            }
        ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
}

// Auto-inject schema on page load
window.addEventListener("DOMContentLoaded", () => {
    addJSONLDSchema({
        pageTitle: document.title,
        pageDescription:
            document.querySelector('meta[name="description"]')?.content ||
            "Learn financial foundations and strategies with V & V Advisors.",
        keywords: [
            "financial education",
            "budgeting",
            "wealth building",
            "life insurance",
            "V & V Advisors"
        ]
    });
});
