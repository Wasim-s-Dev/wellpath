/**
 * The WellPath email layout: header, white card with a 3D icon, heading, text, one button,
 * a backup link and a short footer. Table-based with inline styles, because Gmail and Outlook
 * ignore most modern CSS. The icon travels as an inline attachment (cid:), since Gmail
 * blocks SVG and data: images.
 */
import type { SendMailOptions } from "nodemailer";
import { EMAIL_ICONS, type EmailIcon } from "./emailIcons.js";

type EmailContent = {
  /** Shown as the preview line in the inbox list. */
  preheader: string;
  icon: EmailIcon;
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  /** Small print under the button, such as how long a link lasts. */
  note?: string;
  /** Why the person is receiving this email. */
  reason: string;
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderEmail(c: EmailContent): { html: string; attachments: NonNullable<SendMailOptions["attachments"]> } {
  const cid = `${c.icon}@wellpath`;
  const paragraphs = c.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:24px;color:#4b5563;">${escapeHtml(p)}</p>`)
    .join("");

  const button = c.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 8px;">
        <tr><td align="center" bgcolor="#4f46e5" style="border-radius:10px;">
          <a href="${escapeHtml(c.button.url)}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(c.button.label)}</a>
        </td></tr>
      </table>`
    : "";

  const note = c.note
    ? `<p style="margin:16px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:#6b7280;">${escapeHtml(c.note)}</p>`
    : "";

  const backupLink = c.button
    ? `<tr><td style="padding:22px 0 0;border-top:1px solid #eef0f4;">
        <p style="margin:0;font-family:${FONT};font-size:12px;line-height:18px;color:#6b7280;">If the button does not work, copy and paste this link into your browser:</p>
        <p style="margin:6px 0 0;font-family:${FONT};font-size:12px;line-height:18px;word-break:break-all;"><a href="${escapeHtml(c.button.url)}" target="_blank" style="color:#4f46e5;text-decoration:underline;">${escapeHtml(c.button.url)}</a></p>
      </td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(c.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f9;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#f4f5f9;">${escapeHtml(c.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f5f9" style="background-color:#f4f5f9;">
  <tr><td align="center" style="padding:36px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
      <tr><td align="center" style="padding:0 0 22px;font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:-0.3px;color:#0f0f1a;">Well<span style="color:#4f46e5;">Path</span></td></tr>
      <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #e6e8ef;border-radius:16px;padding:40px 36px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="padding:0 0 20px;"><img src="cid:${cid}" width="96" height="96" alt="" style="display:block;width:96px;height:96px;border:0;outline:none;"></td></tr>
          <tr><td align="center">
            <h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;font-weight:700;line-height:30px;color:#0f0f1a;">${escapeHtml(c.heading)}</h1>
            ${paragraphs}
            ${button}
            ${note}
          </td></tr>
          ${backupLink ? `<tr><td style="padding-top:26px;"></td></tr>${backupLink}` : ""}
        </table>
      </td></tr>
      <tr><td align="center" style="padding:24px 24px 0;font-family:${FONT};font-size:12px;line-height:18px;color:#9ca3af;">
        <p style="margin:0 0 6px;">${escapeHtml(c.reason)}</p>
        <p style="margin:0;">WellPath &middot; Wellness guidance only, not medical advice.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  return {
    html,
    attachments: [
      { filename: `${c.icon}.png`, content: Buffer.from(EMAIL_ICONS[c.icon], "base64"), contentType: "image/png", cid, contentDisposition: "inline" },
    ],
  };
}
