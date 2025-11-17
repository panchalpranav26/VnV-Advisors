/**
 * FILE: netlify/functions/submit-contact.ts
 * PURPOSE: Receives contact form data and sends emails via Brevo (Transactional API)
 * FLOW:
 *  1) Send admin notification (always)
 *  2) Send branded confirmation to user (always)
 * ENV VARS (Netlify UI > Site Settings > Environment):
 *  - BREVO_API_KEY
 *  - BREVO_FROM_EMAIL        (verified sender, e.g., no-reply@vnvbrothers.com)
 *  - BREVO_TO_EMAIL          (admin inbox, e.g., info@vnvbrothers.com)
 */

import type { Handler } from "@netlify/functions";

interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    topic: string;
    message: string;
}

const { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_TO_EMAIL } = process.env;

// Convert comma-separated emails into array
const ADMIN_EMAILS = (BREVO_TO_EMAIL || "")
    .split(",")
    .map(e => e.trim())
    .filter(Boolean);

// ---- Brand constants (BC1 palette) ----
const BRAND = {
    nameFrom: "V&V Global Team",
    primaryNavy: "#0A2A43",
    accentTeal: "#0DB2AF",
    bgLight: "#F5F7FA",
    textDark: "#1A1A1A",
    logoUrl: "https://via.placeholder.com/180x60?text=VnV+Global+LLC",
    calendly: "https://calendly.com/your-link",
    footerLines: [
        "V&V Global LLC — Empowering families through financial literacy.",
        "© 2025 V&V Global LLC. All rights reserved.",
        "This email was sent by V&V Global LLC in response to your inquiry.",
    ],
};

export const handler: Handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "OK" };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ ok: false, error: "Method Not Allowed" }),
        };
    }

    if (!event.body) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ ok: false, error: "Missing request body" }),
        };
    }

    try {
        const data: ContactFormData = JSON.parse(event.body);

        // Basic validation
        if (!data.name || !data.email || !data.topic || !data.message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ ok: false, error: "Missing required fields" }),
            };
        }

        if (!BREVO_API_KEY || !BREVO_FROM_EMAIL || !BREVO_TO_EMAIL) {
            console.error("❌ Missing Brevo environment variables.");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ ok: false, error: "Email service is not configured." }),
            };
        }

        // ---------------------------
        // 1) Admin Notification Email
        // ---------------------------
        const adminEmailPayload = {
            sender: { name: BRAND.nameFrom, email: BREVO_FROM_EMAIL },
            to: ADMIN_EMAILS.map(email => ({ email, name: "V&V Global Admin" })),
            replyTo: { email: data.email, name: data.name },
            subject: `New Contact Form Submission — ${data.name}`,
            htmlContent: `
        <h2 style="font-family:Arial,Helvetica,sans-serif;margin:0 0 12px 0;color:${BRAND.primaryNavy};">
          New Contact Form Submission
        </h2>
        <p style="font-family:Arial,Helvetica,sans-serif;margin:6px 0;"><strong>Name:</strong> ${escapeHtml(
                data.name
            )}</p>
        <p style="font-family:Arial,Helvetica,sans-serif;margin:6px 0;"><strong>Email:</strong> ${escapeHtml(
                data.email
            )}</p>
        <p style="font-family:Arial,Helvetica,sans-serif;margin:6px 0;"><strong>Phone:</strong> ${escapeHtml(
                data.phone || "Not Provided"
            )}</p>
        <p style="font-family:Arial,Helvetica,sans-serif;margin:6px 0;"><strong>Topic:</strong> ${escapeHtml(
                data.topic
            )}</p>
        <p style="font-family:Arial,Helvetica,sans-serif;margin:12px 0;"><strong>Message:</strong></p>
        <div style="font-family:Arial,Helvetica,sans-serif;white-space:pre-line;background:${BRAND.bgLight};padding:12px;border-radius:6px;border:1px solid #e5e7eb;">
          ${escapeHtml(data.message)}
        </div>
        <p style="font-family:Arial,Helvetica,sans-serif;margin-top:16px;color:#6b7280;">
          Submitted via V&V Global LLC website.
        </p>
      `,
            textContent: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not Provided"}
Topic: ${data.topic}

Message:
${data.message}

Submitted via V&V Global LLC website.
      `,
        };

        const adminRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(adminEmailPayload),
        });

        if (!adminRes.ok) {
            const t = await adminRes.text();
            console.error("❌ Brevo Admin Email Error:", t);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ ok: false, error: "Failed to send admin email" }),
            };
        }

        // -----------------------------------------
        // 2) Branded Confirmation Email to the User
        // -----------------------------------------
        const userHtml = brandedUserHtml({
            logoUrl: BRAND.logoUrl,
            primaryNavy: BRAND.primaryNavy,
            accentTeal: BRAND.accentTeal,
            bgLight: BRAND.bgLight,
            textDark: BRAND.textDark,
            calUrl: BRAND.calendly,
            name: data.name,
            topic: data.topic,
            message: data.message,
            footerLines: BRAND.footerLines,
        });

        const userEmailPayload = {
            sender: { name: BRAND.nameFrom, email: BREVO_FROM_EMAIL },
            to: [{ email: data.email, name: data.name }],
            subject: "Thanks for contacting V&V Global — We received your message",
            htmlContent: userHtml,
            textContent: `
Hi ${data.name},

Thank you for reaching out to V&V Global LLC. We’ve received your message and will be in touch shortly.

Topic: ${data.topic}

Your message:
${data.message}

You can also book a consultation here:
${BRAND.calendly}

${BRAND.footerLines.join("\n")}
      `,
        };

        const userRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(userEmailPayload),
        });

        if (!userRes.ok) {
            const t = await userRes.text();
            console.error("⚠️ Brevo User Email Error:", t);
            // We still consider overall success if admin email went through
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ok: true, message: "Emails sent successfully" }),
        };
    } catch (error: any) {
        console.error("❌ Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ ok: false, error: error.message || "Internal Server Error" }),
        };
    }
};

// -------------------------
// Helpers
// -------------------------

function escapeHtml(input: string) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function brandedUserHtml(opts: {
    logoUrl: string;
    primaryNavy: string;
    accentTeal: string;
    bgLight: string;
    textDark: string;
    calUrl: string;
    name: string;
    topic: string;
    message: string;
    footerLines: string[];
}) {
    const { logoUrl, primaryNavy, accentTeal, bgLight, textDark, calUrl, name, topic, message, footerLines } = opts;

    // table-based layout for maximum email client compatibility
    return `
  <table role="presentation" style="background:${bgLight};padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:${primaryNavy};padding:20px 24px;" align="left">
              <img src="${logoUrl}" width="180" height="60" alt="V&V Global LLC" style="display:block;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;color:${textDark};font-size:20px;line-height:1.4;">
                Thanks for reaching out, ${escapeHtml(name)}!
              </h1>
              <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;color:${textDark};font-size:14px;line-height:1.6;">
                We’ve received your message and a member of the V&V Global Team will contact you shortly.
              </p>

              <table role="presentation" style="margin:12px 0 16px 0;">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${textDark};padding:8px 0;">
                    <strong>Topic:</strong> ${escapeHtml(topic)}
                  </td>
                </tr>
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${textDark};padding:8px 0;">
                    <strong>Your message:</strong>
                    <div style="white-space:pre-line;background:${bgLight};padding:12px;border-radius:6px;border:1px solid #e5e7eb;margin-top:6px;">
                      ${escapeHtml(message)}
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="margin-top:8px;">
                <tr>
                  <td align="center" bgcolor="${accentTeal}" style="border-radius:6px;">
                    <a href="${calUrl}"
                      style="display:inline-block;padding:12px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#ffffff;text-decoration:none;border-radius:6px;"
                      target="_blank" rel="noopener">
                      Book a Consultation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;line-height:1.6;">
                If you didn’t submit this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-top:1px solid #e5e7eb;padding:12px 24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:11px;line-height:1.6;">
                ${footerLines[0]}<br/>
                ${footerLines[1]}<br/>
                ${footerLines[2]}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}
