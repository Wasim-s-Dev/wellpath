/** Profile tests against a throwaway in-memory MongoDB. */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";

const app = createApp();
const PROFILE = "/api/v1/profile";

const answers = {
  sex: "female",
  age: 28,
  heightCm: 163,
  weightKg: 68,
  activityLevel: "light",
  goal: "lose_weight",
  conditions: ["knee_pain"],
  pregnantOrBreastfeeding: false,
  dietType: "vegetarian",
  workoutMinutes: 30,
  healthDataConsent: true,
};

let db: MongoMemoryServer;

beforeAll(async () => {
  db = await MongoMemoryServer.create();
  await mongoose.connect(db.getUri());
  await Promise.all([User.init(), Session.init()]);
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await db.stop();
});

async function signUp(email = "sara@example.com") {
  const res = await request(app).post("/api/v1/auth/register").send({ name: "Sara", email, password: "long-enough-pw" });
  return `Bearer ${res.body.accessToken}`;
}

describe("profile", () => {
  it("requires sign-in", async () => {
    expect((await request(app).get(PROFILE)).status).toBe(401);
    expect((await request(app).put(PROFILE).send(answers)).status).toBe(401);
  });

  it("is empty before onboarding", async () => {
    const res = await request(app).get(PROFILE).set("Authorization", await signUp());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ profile: null, targets: null, notices: [] });
  });

  it("saves answers and returns targets and notices", async () => {
    const auth = await signUp();
    const res = await request(app).put(PROFILE).set("Authorization", auth).send(answers);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({ goal: "lose_weight", dietType: "vegetarian", conditions: ["knee_pain"] });
    expect(res.body.profile).not.toHaveProperty("healthDataConsent");
    expect(res.body.profile.consentedAt).toEqual(expect.any(String));
    expect(res.body.targets.calories).toBeLessThan(res.body.targets.tdee);
    expect(res.body.notices[0]).toMatch(/^Knee pain/);

    const again = await request(app).get(PROFILE).set("Authorization", auth);
    expect(again.body).toEqual(res.body);
  });

  it("keeps the original consent time when answers change", async () => {
    const auth = await signUp();
    const first = await request(app).put(PROFILE).set("Authorization", auth).send(answers);
    const second = await request(app).put(PROFILE).set("Authorization", auth).send({ ...answers, weightKg: 66 });
    expect(second.body.profile.weightKg).toBe(66);
    expect(second.body.profile.consentedAt).toBe(first.body.profile.consentedAt);
  });

  it("rejects a weight-loss goal for an underweight person", async () => {
    const res = await request(app).put(PROFILE).set("Authorization", await signUp()).send({ ...answers, weightKg: 45, heightCm: 170 });
    expect(res.status).toBe(400);
    expect(res.body.details.goal[0]).toMatch(/below the healthy range/);
  });

  it("requires consent", async () => {
    const res = await request(app).put(PROFILE).set("Authorization", await signUp()).send({ ...answers, healthDataConsent: false });
    expect(res.status).toBe(400);
    expect(res.body.details).toHaveProperty("healthDataConsent");
  });

  it("ignores fields that are not part of the profile", async () => {
    const auth = await signUp();
    await request(app).put(PROFILE).set("Authorization", auth).send({ ...answers, role: "admin", status: "suspended" });
    const user = await User.findOne({ email: "sara@example.com" });
    expect(user?.role).toBe("user");
    expect(user?.status).toBe("active");
  });

  it("keeps each user's profile private", async () => {
    await request(app).put(PROFILE).set("Authorization", await signUp("one@example.com")).send(answers);
    const other = await request(app).get(PROFILE).set("Authorization", await signUp("two@example.com"));
    expect(other.body.profile).toBeNull();
  });

  it("blocks suspended accounts", async () => {
    const auth = await signUp();
    await User.updateOne({ email: "sara@example.com" }, { status: "suspended" });
    expect((await request(app).get(PROFILE).set("Authorization", auth)).status).toBe(401);
  });
});
