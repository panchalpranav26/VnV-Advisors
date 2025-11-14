/**
 * FILE: netlify/functions/submit_consultation.ts
 * PURPOSE: Handles Consultation Form submissions and sends emails via Brevo
 */

import type { Handler } from "@netlify/functions";

interface ConsultationFormData {
    name: string;
    email: string;
    phone?: string;
    topic: string;
    message: string;
}

const { BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_TO_EMAIL } = process.env;

export const handler: Handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Content-Type": "application/json",
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
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
        const data: ConsultationFormData = JSON.parse(event.body);

        if (!data.name || !data.email || !data.topic || !data.message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ ok: false, error: "Missing required fields" }),
            };
        }

        if (!BREVO_API_KEY || !BREVO_FROM_EMAIL || !BREVO_TO_EMAIL) {
            console.error("❌ Missing required Brevo environment variables", {
                BREVO_API_KEY: !!BREVO_API_KEY,
                BREVO_FROM_EMAIL: !!BREVO_FROM_EMAIL,
                BREVO_TO_EMAIL: !!BREVO_TO_EMAIL,
            });
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ ok: false, error: "Email service not configured" }),
            };
        }

        const adminEmails = BREVO_TO_EMAIL.split(",").map((email) => ({
            email: email.trim(),
        }));


        const footerLines = [
            "V & V Advisors — Financial Education & Protection",
            "Empowering families for generational growth.",
            "Tracy, CA • contact@vnvbrothers.com • vnvbrothers.com"
        ];

// Build branded HTML + plain text
        const userHtml = brandedConsultationUserHtml({
            name: data.name,
            topic: data.topic,
            message: data.message,
            footerLines,
            // (colors already default to your chosen palette; override if needed)
        });

        const userText = [
            `Hi ${data.name},`,
            ``,
            `Thank you for requesting a consultation with V & V Advisors.`,
            `Session Type: ${data.topic}`,
            ``,
            `Your message:`,
            data.message,
            ``,
            `A member of our advisory team will reach out shortly.`,
            ``,
            `— V & V Advisors`,
            `Financial Education & Protection`,
            `Tracy, CA • contact@vnvbrothers.com • vnvbrothers.com`,
        ].join("\n");


        // ---------------- EMAIL to ADMIN ----------------
        const adminPayload = {
            sender: { name: "V&V Global Website", email: BREVO_FROM_EMAIL },
            to: adminEmails,
            replyTo: { email: data.email, name: data.name },
            subject: `New Consultation Request — ${data.name}`,
            htmlContent: `
        <h2>📬 New Consultation Request</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
        <p><strong>Session Type:</strong> ${data.topic}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, "<br>")}</p>
      `,
        };

        const adminRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(adminPayload),
        });

        if (!adminRes.ok) {
            const errText = await adminRes.text();
            console.error("❌ Failed to send admin email:", errText);
        }

        // ---------------- EMAIL to USER ----------------
// ---------------- EMAIL to USER ----------------
        const userPayload = {
            sender: { name: "V&V Global LLC", email: BREVO_FROM_EMAIL },
            to: [{ email: data.email, name: data.name }],
            subject: "We Received Your Consultation Request ✅",
            htmlContent: userHtml,
            textContent: userText
        };

        const userRes = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY!,
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify(userPayload),
        });

        if (!userRes.ok) {
            const errText = await userRes.text();
            console.error("❌ Failed to send user email:", errText);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ok: true, message: "Consultation request received" }),
        };
    } catch (error: any) {
        console.error("❌ submit_consultation ERROR:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ ok: false, error: error.message || "Internal Server Error" }),
        };
    }
};


function escapeHtml(str: string = ""): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function brandedConsultationUserHtml(opts: {
    primaryNavy?: string;
    accentTeal?: string;
    bgLight?: string;
    textDark?: string;
    name: string;
    topic: string;
    message: string;
    footerLines: string[];
}) {
    const {
        primaryNavy = "#132D4E",         // Standard Navy (your pick)
        accentTeal = "#14B8A6",          // Teal accent (brand-friendly)
        bgLight = "#F5F7FB",             // Soft light gray/blue
        textDark = "#111827",            // Near-black text
        name,
        topic,
        message,
        footerLines,
    } = opts;

    // table-based layout for maximum email client compatibility
    return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${bgLight};padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <!-- Header (Text-based logo, centered) -->
          <tr>
            <td style="background:${primaryNavy};padding:22px 24px;text-align:center;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-weight:700;color:#ffffff;font-size:18px;letter-spacing:0.5px;">
                V &amp; V Global LLC
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;color:${textDark};font-size:20px;line-height:1.4;">
                Thank you for your consultation request, ${escapeHtml(name)}.
              </h1>
              <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;color:${textDark};font-size:14px;line-height:1.6;">
                We’ve received your request and a member of the <strong>V &amp; V Global</strong> advisory team will review your details and reach out shortly.
              </p>
              <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;color:${textDark};font-size:14px;line-height:1.6;">
                Our mission is to empower families with financial literacy, protection, and wealth-building strategies—one step at a time.
              </p>

              <!-- Details box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 16px 0;border:1px solid #e5e7eb;border-radius:8px;">
                <tr>
                  <td style="padding:12px 16px;background:${bgLight};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${textDark};">
                    <div style="margin:0 0 8px 0;"><strong>Session Type:</strong> ${escapeHtml(topic)}</div>
                    <div>
                      <strong>Your message:</strong>
                      <div style="white-space:pre-line;background:#ffffff;padding:12px;border-radius:6px;border:1px solid #e5e7eb;margin-top:6px;">
                        ${escapeHtml(message)}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;line-height:1.6;">
                If you didn’t submit this request, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#ffffff;border-top:1px solid #e5e7eb;padding:12px 24px;">
              <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:11px;line-height:1.6;">
                ${escapeHtml(footerLines[0] || "")}<br/>
                ${escapeHtml(footerLines[1] || "")}<br/>
                ${escapeHtml(footerLines[2] || "")}
              </p>
              <div style="height:2px;width:100%;background:${accentTeal};opacity:0.15;border-radius:2px;"></div>
              <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:11px;line-height:1.6;">
                © ${new Date().getFullYear()} V &amp; V Global LLC. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}
