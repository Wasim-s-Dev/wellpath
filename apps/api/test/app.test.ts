import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

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
});
