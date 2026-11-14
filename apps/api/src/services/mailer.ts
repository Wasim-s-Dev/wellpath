/**
 * Sends email over SMTP (for example Gmail with an app password).
 * Tests never send: they collect mail in testOutbox. Without SMTP_HOST in development,
 * mail is printed to the terminal so links can still be tested.
 */
import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";
import { env } from "../config/env.js";

export type Mail = { to: string; subject: string; text: string; html: string; attachments?: SendMailOptions["attachments"] };

/** Mail "sent" during tests. */
export const testOutbox: Mail[] = [];

/** A new SMTP connection from the .env settings, or null when SMTP_HOST is not set. */
export function createSmtpTransport(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // 465 uses TLS from the start; 587 upgrades with STARTTLS
    // Google shows app passwords in groups of four with spaces; the spaces are not part of it.
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS?.replace(/\s+/g, "") } : undefined,
  });
}

/** The sender address: MAIL_FROM, or the SMTP login. Gmail only sends as your own address. */
export const mailFrom = () => env.MAIL_FROM ?? env.SMTP_USER;

let transport: Transporter | null = null;

function smtp(): Transporter | null {
  transport ??= createSmtpTransport();
  return transport;
}

export async function sendMail(mail: Mail): Promise<void> {
  if (env.NODE_ENV === "test") {
    testOutbox.push(mail);
    return;
  }
  const t = smtp();
  if (!t) {
    console.log(`\n--- Email (not sent: SMTP is not set up) ---\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n---\n`);
    return;
  }
  await t.sendMail({ from: mailFrom(), ...mail });
}
