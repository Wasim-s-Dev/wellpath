/** Auth tests against a throwaway in-memory MongoDB. They never touch the real database. */
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Session } from "../src/models/Session.js";
import { User } from "../src/models/User.js";

const app = createApp();
const REGISTER = "/api/v1/auth/register";
const LOGIN = "/api/v1/auth/login";
const REFRESH = "/api/v1/auth/refresh";
const LOGOUT = "/api/v1/auth/logout";
const ME = "/api/v1/auth/me";
const ama = { name: "Ama Khan", email: "ama@example.com", password: "correct-horse-battery" };

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

function setCookieHeader(res: request.Response): string {
  const header = res.headers["set-cookie"] as unknown as string[] | undefined;
  return header?.[0] ?? "";
}

const refreshCookie = (res: request.Response) => setCookieHeader(res).split(";")[0];
const register = () => request(app).post(REGISTER).send(ama);
const refresh = (cookie: string) => request(app).post(REFRESH).set("Cookie", cookie);

describe("register", () => {
  it("creates an account and returns a token without any password data", async () => {
    const res = await register();
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(String), name: ama.name, email: ama.email, role: "user" });
  });

  it("stores an Argon2id hash, not the password", async () => {
    await register();
    const user = await User.findOne({ email: ama.email }).select("+passwordHash");
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("sets an httpOnly refresh cookie and stores only its hash", async () => {
    const res = await register();
    const header = setCookieHeader(res);
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/Path=\/api\/v1\/auth/);
    const raw = refreshCookie(res).split("=")[1];
    expect(await Session.countDocuments({ tokenHash: raw })).toBe(0);
    expect(await Session.countDocuments()).toBe(1);
  });

  it("ignores a role sent by the client", async () => {
    const res = await request(app).post(REGISTER).send({ ...ama, role: "admin" });
    expect(res.body.user.role).toBe("user");
  });

  it("treats emails as case-insensitive and rejects duplicates", async () => {
    await register();
    const res = await request(app).post(REGISTER).send({ ...ama, email: "AMA@Example.com" });
    expect(res.status).toBe(409);
  });

  it("rejects short passwords and invalid emails", async () => {
    expect((await request(app).post(REGISTER).send({ ...ama, password: "short" })).status).toBe(400);
    expect((await request(app).post(REGISTER).send({ ...ama, email: "nope" })).status).toBe(400);
  });
});

describe("login", () => {
  it("signs in with the correct password", async () => {
    await register();
    const res = await request(app).post(LOGIN).send({ email: ama.email, password: ama.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(ama.email);
    expect(refreshCookie(res)).toContain("wellpath_refresh=");
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    await register();
    const wrong = await request(app).post(LOGIN).send({ email: ama.email, password: "wrong-password" });
    const unknown = await request(app).post(LOGIN).send({ email: "nobody@example.com", password: "wrong-password" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it("rejects a query object in place of an email", async () => {
    await register();
    const res = await request(app).post(LOGIN).send({ email: { $ne: null }, password: ama.password });
    expect(res.status).toBe(400);
  });

  it("blocks suspended accounts", async () => {
    await register();
    await User.updateOne({ email: ama.email }, { status: "suspended" });
    const res = await request(app).post(LOGIN).send({ email: ama.email, password: ama.password });
    expect(res.status).toBe(403);
  });
});

describe("current user", () => {
  it("returns the user for a valid token", async () => {
    const { body } = await register();
    const res = await request(app).get(ME).set("Authorization", `Bearer ${body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(ama.email);
  });

  it("rejects a missing token", async () => {
    expect((await request(app).get(ME)).status).toBe(401);
  });

  it("rejects tokens signed with another secret or no signature", async () => {
    const { body } = await register();
    const claims = { role: "admin", sub: body.user.id, iss: "wellpath-api" };
    const forged = jwt.sign(claims, "a-different-secret-with-32-characters!");
    const unsigned = jwt.sign(claims, "", { algorithm: "none" });
    expect((await request(app).get(ME).set("Authorization", `Bearer ${forged}`)).status).toBe(401);
    expect((await request(app).get(ME).set("Authorization", `Bearer ${unsigned}`)).status).toBe(401);
  });

  it("rejects a valid token once the account is suspended", async () => {
    const { body } = await register();
    await User.updateOne({ email: ama.email }, { status: "suspended" });
    const res = await request(app).get(ME).set("Authorization", `Bearer ${body.accessToken}`);
    expect(res.status).toBe(401);
  });
});

describe("refresh", () => {
  it("issues a new access token and rotates the cookie", async () => {
    const cookie = refreshCookie(await register());
    const res = await refresh(cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(refreshCookie(res)).not.toBe(cookie);
  });

  it("ends the whole login when a used token is replayed", async () => {
    const first = refreshCookie(await register());
    const second = refreshCookie(await refresh(first));
    expect((await refresh(first)).status).toBe(401);
    expect((await refresh(second)).status).toBe(401);
  });

  it("lets only one of two simultaneous requests spend a token", async () => {
    const cookie = refreshCookie(await register());
    const results = await Promise.all([refresh(cookie), refresh(cookie)]);
    expect(results.filter((r) => r.status === 200).length).toBeLessThanOrEqual(1);
  });

  it("rejects missing, unknown and crafted cookies", async () => {
    expect((await request(app).post(REFRESH)).status).toBe(401);
    expect((await refresh("wellpath_refresh=unknown")).status).toBe(401);
    const crafted = `wellpath_refresh=${encodeURIComponent('j:{"$ne":null}')}`;
    expect((await refresh(crafted)).status).toBe(401);
  });

  it("rejects an expired session", async () => {
    const cookie = refreshCookie(await register());
    await Session.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    expect((await refresh(cookie)).status).toBe(401);
  });

  it("stops suspended accounts from refreshing", async () => {
    const cookie = refreshCookie(await register());
    await User.updateOne({ email: ama.email }, { status: "suspended" });
    expect((await refresh(cookie)).status).toBe(401);
  });
});

describe("logout", () => {
  it("ends the session and clears the cookie", async () => {
    const cookie = refreshCookie(await register());
    const res = await request(app).post(LOGOUT).set("Cookie", cookie);
    expect(res.status).toBe(204);
    expect(setCookieHeader(res)).toMatch(/wellpath_refresh=;/);
    expect((await refresh(cookie)).status).toBe(401);
  });

  it("succeeds without a session", async () => {
    expect((await request(app).post(LOGOUT)).status).toBe(204);
  });
});
