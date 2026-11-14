/**
 * Checks the email settings in apps/api/.env and sends previews of the password emails.
 *   npm run test-email -- you@gmail.com
 * Never prints the password.
 */
import { env } from "../src/config/env.js";
import { createSmtpTransport, mailFrom } from "../src/services/mailer.js";
import { passwordChangedEmail, resetEmail } from "../src/services/passwordReset.js";

const to = process.argv.slice(2).find((a) => !a.startsWith("--"));
const ok = (msg: string) => console.log(`  [ok]   ${msg}`);
const fail = (msg: string, fix: string): never => {
  console.log(`  [fix]  ${msg}\n         -> ${fix}\n`);
  process.exit(1);
};

console.log("\nWellPath email check\n");
if (!to) fail("No address to send to", "Run: npm run test-email -- you@gmail.com");

const host = env.SMTP_HOST ?? fail("SMTP_HOST is empty in apps/api/.env", "Add SMTP_HOST=smtp.gmail.com, then save the file.");
ok(`Server: ${host}, port ${env.SMTP_PORT}`);
const user = env.SMTP_USER ?? fail("SMTP_USER is empty", "Set SMTP_USER to your full Gmail address.");
ok(`Login: ${user}`);
const pass = env.SMTP_PASS?.replace(/\s+/g, "") ?? "";
if (!pass) fail("SMTP_PASS is empty", "Paste your 16-letter Google app password (not your normal Gmail password).");
const isGmail = host.includes("gmail");
if (isGmail && pass.length !== 16) {
  fail(`SMTP_PASS is ${pass.length} characters, but Google app passwords are 16`, "Create a new app password and paste all 16 letters. Your normal Gmail password will not work.");
}
ok(`App password set (${pass.length} characters)`);
const from = mailFrom() ?? user;
ok(`Sender: ${from}`);
if (isGmail && !from.toLowerCase().includes(user.toLowerCase())) {
  console.log(`  [note] Gmail sends from ${user} even if MAIL_FROM says otherwise. Use: MAIL_FROM=WellPath <${user}>`);
}

const transport = createSmtpTransport()!;
console.log("\nLogging in to the mail server...");
try {
  await transport.verify();
  ok("Logged in");
} catch (err) {
  const e = err as { code?: string; responseCode?: number; message?: string };
  if (e.code === "EAUTH" || e.responseCode === 535) {
    fail("Gmail rejected the login", "Check SMTP_USER is your full Gmail address and SMTP_PASS is an app password. 2-Step Verification must be on. School or work accounts may block app passwords: use a personal Gmail.");
  }
  if (e.code === "ETIMEDOUT" || e.code === "ECONNECTION" || e.code === "ESOCKET") {
    fail(`Could not reach ${env.SMTP_HOST}:${env.SMTP_PORT} (${e.code})`, "Your network may block this port. Try SMTP_PORT=465, or another network such as a mobile hotspot.");
  }
  fail(`Login failed: ${e.message?.split("\n")[0]}`, "Paste this line to Claude (it contains no password).");
}

// Sends both real templates, marked as previews. The reset link is a dummy and will not work.
const recipient = { name: "there", email: to! };
const previews = [
  resetEmail(recipient, `${env.APP_URL}/reset-password#token=preview-only-this-link-does-not-work`),
  passwordChangedEmail(recipient),
];
try {
  for (const mail of previews) {
    const info = await transport.sendMail({ from, ...mail, subject: `[Preview] ${mail.subject}` });
    ok(`Sent "${mail.subject}" to ${to} (message ${info.messageId})`);
  }
  console.log("\nCheck the inbox, and the spam folder the first time. Then restart npm run dev so the API uses the new settings.\n");
} catch (err) {
  fail(`Sending failed: ${(err as Error).message.split("\n")[0]}`, "Paste this line to Claude (it contains no password).");
} finally {
  transport.close();
}
