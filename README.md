# 🏦 V & V Advisors: Multi-Page Static Site

This project implements the multi-page static website for **V & V Advisors**, featuring modular HTML/CSS/JS architecture, SEO-optimized metadata, and Netlify serverless functions for contact and consultation form submissions.

---

## 📂 Project Structure

| File | Directory | Purpose |
| :--- | :--- | :--- |
| `index.html` | `/` | Home page – hero, mission, values, CTAs. |
| `financial_ed.html` | `/pages/` | Financial literacy basics (budgeting, debt, savings). |
| `protecting.html` | `/pages/` | Insurance education (term vs. whole, riders, beneficiaries). |
| `wealth.html` | `/pages/` | Long-term investing and wealth-building. |
| `family.html` | `/pages/` | Family financial wellness & education. |
| `services.html` | `/pages/` | Services overview – consultations & workshops. |
| `stories.html` | `/pages/` | Testimonials and success stories. |
| `about.html` | `/pages/` | About – mission, credentials, ethics. |
| `contact.html` | `/pages/` | Contact form integrated with Netlify Function. |
| `consultation.html` | `/pages/` | Consultation booking form. |
| `assets/css/` | `/` | Modular CSS (core, layout, components, pages). |
| `assets/js/` | `/` | Core logic and page-specific scripts. |
| `netlify/functions/` | `/` | TypeScript serverless functions for form handling. |
| `netlify.toml` | `/` | Netlify build and routing configuration. |
| `package.json` | `/` | Dependencies and CLI scripts. |
| `tsconfig.json` | `/` | TypeScript compiler configuration. |

---

## 💻 How to Open Locally

**Option 1:** Double-click `index.html` to open in a browser.  
**Option 2 (Recommended):** Use VS Code with the **Live Server** extension.  
**Option 3:** Use Netlify CLI for full local environment (see below).

---

## ⚙️ Local Development & Deployment

### 1. Install

```bash
npm install -g netlify-cli
npm install
2. Run Locally
bash
Copy code
netlify dev
Serves pages at http://localhost:8888

Functions available at /api/save-form and /api/get-submissions

3. Deploy to Netlify
bash
Copy code
netlify deploy --prod
Or upload the zipped project via Netlify Drop.

🧩 Netlify Function: Form Submission
How It Works
/assets/js/pages/contact_consult.js posts form data via
fetch("/api/save-form")

The function save-form.ts validates input and stores the record in:

/tmp/submissions.txt (simple, temporary), or

Netlify Blobs (persistent storage)

Optionally sends an email notification through Resend API.

Optional Environment Variables
Set these in Netlify → Site Settings → Environment Variables if using email notifications:

Key	Description
RESEND_API_KEY	Resend API key
NOTIFY_TO	Recipient email address
NOTIFY_FROM	From address (e.g. no-reply@vnvbrothers.com)

🚀 Final Deployment Notes
All internal links use root-relative paths (/pages/...).

Serverless functions run only on a deployed Netlify environment (not via file://).

Redirects in netlify.toml map /api/* → /.netlify/functions/*.

CORS and security headers are already configured.

© 2025 V & V Advisors
Empowering families with financial literacy, protection, and sustainable wealth.

yaml
Copy code

---

✅ **Usage:**  
Save this as `README.md` in your project root — it will render perfectly on GitHub, Netlify, or any Markdown viewer.