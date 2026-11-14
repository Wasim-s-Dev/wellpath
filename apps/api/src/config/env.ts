/**
 * Reads and validates environment variables once at startup.
 * If something required is missing, the app fails fast with a clear message.
 */
import "dotenv/config";
import { z } from "zod";

/** An optional setting. An empty line such as `SMTP_HOST=` in .env counts as not set. */
const optional = z.string().optional().transform((v) => v?.trim() || undefined);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: optional,
  JWT_SECRET: optional,
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
  GEMINI_API_KEY: optional,
  GROQ_API_KEY: optional,
  // Reverse proxies in front of the API. Rate limiting needs this to see real client IPs.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  // The user app's address, used in links inside emails.
  APP_URL: z.string().default("http://localhost:5173").transform((v) => v.replace(/\/+$/, "")),
  // Outgoing email. Without SMTP_HOST, development prints emails to the terminal instead.
  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: optional,
  SMTP_PASS: optional,
  MAIL_FROM: optional,
}).superRefine((vars, ctx) => {
  if (vars.NODE_ENV !== "production") return;
  const required = (key: keyof typeof vars, message = "Required in production") => {
    if (!vars[key]) ctx.addIssue({ code: "custom", path: [key], message });
  };
  required("MONGODB_URI");
  if (!vars.JWT_SECRET || vars.JWT_SECRET.length < 32) {
    ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "Must be at least 32 characters in production" });
  }
  required("SMTP_HOST", "Required in production, or password reset emails cannot be sent");
  required("MAIL_FROM");
  if (!vars.APP_URL.startsWith("https://")) {
    ctx.addIssue({ code: "custom", path: ["APP_URL"], message: "Must be the https:// address of the user app in production" });
  }
});

export function parseEnv(source: NodeJS.ProcessEnv) {
  return envSchema.safeParse(source);
}

const parsed = parseEnv(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((o) => o.trim()),
};
