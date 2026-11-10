import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { parseEnv } from "../src/config/env.js";

const app = createApp();

describe("API", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /api/v1/plan/preview returns targets", async () => {
    const res = await request(app).post("/api/v1/plan/preview").send({
      sex: "male", age: 30, heightCm: 180, weightKg: 80, activityLevel: "moderate", goal: "lose_weight",
    });
    expect(res.status).toBe(200);
    expect(res.body.targets.calories).toBe(2259);
  });

  it("rejects invalid input with 400", async () => {
    const res = await request(app).post("/api/v1/plan/preview").send({ age: 5 });
    expect(res.status).toBe(400);
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await request(app).post("/api/v1/plan/preview").set("Content-Type", "application/json").send("{bad json");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request");
  });

  it("rejects an oversized body with 413", async () => {
    const res = await request(app).post("/api/v1/plan/preview").send({ padding: "a".repeat(200_000) });
    expect(res.status).toBe(413);
    expect(res.body.error).toBe("Request body too large");
  });
});

describe("parseEnv", () => {
  const production = { NODE_ENV: "production" as const, MONGODB_URI: "mongodb://db/wellpath", JWT_SECRET: "x".repeat(32) };

  it("accepts a complete production config", () => {
    expect(parseEnv(production).success).toBe(true);
  });

  it("requires MONGODB_URI in production", () => {
    expect(parseEnv({ ...production, MONGODB_URI: undefined }).success).toBe(false);
  });

  it("rejects a missing or short JWT_SECRET in production", () => {
    expect(parseEnv({ ...production, JWT_SECRET: undefined }).success).toBe(false);
    expect(parseEnv({ ...production, JWT_SECRET: "short" }).success).toBe(false);
  });

  it("does not require secrets in development", () => {
    expect(parseEnv({ NODE_ENV: "development" }).success).toBe(true);
  });
});
