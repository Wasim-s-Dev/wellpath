/** Forgot password tests against a throwaway in-memory MongoDB. Emails go to testOutbox, never out. */
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { hashToken } from "../src/auth/tokens.js";
import { createApp } from "../src/app.js";
import { PasswordReset } from "../src/models/PasswordReset.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";
import { testOutbox } from "../src/services/mailer.js";

const app = createApp();
const FORGOT = "/api/v1/auth/forgot-password";
const RESET = "/api/v1/auth/reset-password";
const LOGIN = "/api/v1/auth/login";
const ama = { name: "Ama <b>Khan</b>", email: "ama@example.com", password: "old-password-123" };
const NEW_PASSWORD = "brand-new-password-456";

let db: MongoMemoryServer;

beforeAll(async () => {
  db = await MongoMemoryServer.create();
  await mongoose.connect(db.getUri());
  await Promise.all([User.init(), Session.init(), PasswordReset.init()]);
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), PasswordReset.deleteMany({})]);
  testOutbox.length = 0;
});

afterAll(async () => {
  await mongoose.disconnect();
  await db.stop();
});

const register = () => request(app).post("/api/v1/auth/register").send(ama);
const forgot = (email = ama.email) => request(app).post(FORGOT).send({ email });
const reset = (token: string, password = NEW_PASSWORD) => request(app).post(RESET).send({ token, password });
const login = (password: string) => request(app).post(LOGIN).send({ email: ama.email, password });

/** The token from the newest reset email. */
function tokenFromEmail(): string {
  const mail = testOutbox.at(-1);
  const match = mail?.text.match(/reset-password#token=([\w-]+)/);
  if (!match) throw new Error("No reset link in the last email");
  return match[1];
}

describe("forgot password", () => {
  it("gives the same answer for known and unknown emails", async () => {
    await register();
    const known = await forgot();
    const unknown = await forgot("nobody@example.com");
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(known.body).toEqual(unknown.body);
    expect(testOutbox).toHaveLength(1);
    expect(testOutbox[0].to).toBe(ama.email);
  });

  it("emails a link with the token after #, and stores only its hash", async () => {
    await register();
    await forgot("AMA@Example.com");
    const token = tokenFromEmail();
    expect(testOutbox[0].text).toContain(`http://localhost:5173/reset-password#token=${token}`);
    expect(await PasswordReset.countDocuments({ tokenHash: token })).toBe(0);
    expect(await PasswordReset.countDocuments({ tokenHash: hashToken(token) })).toBe(1);
  });

  it("escapes the user's name in the HTML email", async () => {
    await register();
    await forgot();
    expect(testOutbox[0].html).toContain("Ama &lt;b&gt;Khan&lt;/b&gt;");
    expect(testOutbox[0].html).not.toContain("<b>Khan</b>");
  });

  it("embeds the 3D icon as an inline image that the HTML points to", async () => {
    await register();
    await forgot();
    const [icon] = testOutbox[0].attachments as { cid: string; contentType: string; content: Buffer }[];
    expect(icon.contentType).toBe("image/png");
    expect(icon.content.subarray(1, 4).toString()).toBe("PNG");
    expect(testOutbox[0].html).toContain(`src="cid:${icon.cid}"`);
  });

  it("sends at most 3 emails an hour to one account", async () => {
    await register();
    for (let i = 0; i < 5; i++) expect((await forgot()).status).toBe(202);
    expect(testOutbox).toHaveLength(3);
  });

  it("sends nothing to suspended accounts", async () => {
    await register();
    await User.updateOne({ email: ama.email }, { status: "suspended" });
    await forgot();
    expect(testOutbox).toHaveLength(0);
  });

  it("rejects an invalid email", async () => {
    expect((await forgot("not-an-email")).status).toBe(400);
  });
});

describe("reset password", () => {
  it("sets the new password and the old one stops working", async () => {
    await register();
    await forgot();
    expect((await reset(tokenFromEmail())).status).toBe(204);
    expect((await login(NEW_PASSWORD)).status).toBe(200);
    expect((await login(ama.password)).status).toBe(401);
  });

  it("signs the account out everywhere and sends a 'password changed' email", async () => {
    const reg = await register();
    const cookie = (reg.headers["set-cookie"] as unknown as string[])[0].split(";")[0];
    await forgot();
    await reset(tokenFromEmail());
    expect((await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie)).status).toBe(401);
    expect(testOutbox.at(-1)?.subject).toBe("Your WellPath password was changed");
  });

  it("works only once", async () => {
    await register();
    await forgot();
    const token = tokenFromEmail();
    expect((await reset(token)).status).toBe(204);
    const again = await reset(token, "another-password-789");
    expect(again.status).toBe(400);
    expect(again.body.error).toMatch(/invalid or has expired/);
  });

  it("only accepts the newest link", async () => {
    await register();
    await forgot();
    const first = tokenFromEmail();
    await forgot();
    const second = tokenFromEmail();
    expect((await reset(first)).status).toBe(400);
    expect((await reset(second)).status).toBe(204);
  });

  it("rejects an expired link", async () => {
    await register();
    await forgot();
    await PasswordReset.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    expect((await reset(tokenFromEmail())).status).toBe(400);
  });

  it("rejects unknown tokens and weak passwords", async () => {
    await register();
    await forgot();
    expect((await reset("x".repeat(43))).status).toBe(400);
    const weak = await reset(tokenFromEmail(), "short");
    expect(weak.status).toBe(400);
    expect(weak.body.details.password[0]).toBe("Use at least 8 characters");
    expect((await login(ama.password)).status).toBe(200); // weak attempt did not use up the link or change anything
  });

  it("removes reset links when the account is deleted", async () => {
    const reg = await register();
    await forgot();
    await request(app).delete("/api/v1/auth/account").set("Authorization", `Bearer ${reg.body.accessToken}`).send({ password: ama.password });
    expect(await PasswordReset.countDocuments()).toBe(0);
  });

  it("is not available on the admin sign-in routes", async () => {
    expect((await request(app).post("/api/v1/admin/auth/forgot-password").send({ email: ama.email })).status).toBe(404);
  });
});
