/**
 * Reads and validates environment variables once at startup.
 * If something required is missing, the app fails fast with a clear message.
 */
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  // Reverse proxies in front of the API. Rate limiting needs this to see real client IPs.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
}).superRefine((vars, ctx) => {
  if (vars.NODE_ENV !== "production") return;
  if (!vars.MONGODB_URI) {
    ctx.addIssue({ code: "custom", path: ["MONGODB_URI"], message: "Required in production" });
  }
  if (!vars.JWT_SECRET || vars.JWT_SECRET.length < 32) {
    ctx.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "Must be at least 32 characters in production" });
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
