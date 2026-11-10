/**
 * WellPath doctor: checks apps/api/.env and the MongoDB connection.
 * Run with: npm run doctor
 * It never prints your password or secrets.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import dns from "node:dns/promises";
import dotenv from "dotenv";
import mongoose from "mongoose";

let problems = 0;
const ok = (msg: string) => console.log(`  [ok]   ${msg}`);
const bad = (msg: string, fix: string) => { problems++; console.log(`  [fix]  ${msg}\n         -> ${fix}`); };
const info = (msg: string) => console.log(`  [info] ${msg}`);

async function main() {
  console.log("\nWellPath doctor\n");
  const path = resolve(process.cwd(), ".env");

  // 1. File exists and is readable as UTF-8
  console.log("1. .env file");
  if (!existsSync(path)) {
    bad(`No .env found at ${path}`, "Copy apps/api/.env.example to apps/api/.env and fill it in.");
    return finish();
  }
  const raw = readFileSync(path);
  if (raw[0] === 0xff || raw[0] === 0xfe || raw.includes(0)) {
    bad(".env is saved as UTF-16, which cannot be read", "In Antigravity: click the encoding in the bottom bar > Save with Encoding > UTF-8.");
    return finish();
  }
  const text = raw.toString("utf8").replace(/^﻿/, "");
  if (raw[0] === 0xef) info(".env has a UTF-8 BOM. It works, but plain UTF-8 is cleaner.");
  ok(`Found ${path}`);

  if (process.env.MONGODB_URI) {
    bad("MONGODB_URI is also set as a Windows environment variable, which overrides .env", "Remove it from System Properties > Environment Variables, then open a new terminal.");
  }

  const vars = dotenv.parse(text);

  // 2. MONGODB_URI format
  console.log("\n2. MONGODB_URI");
  const uri = (vars.MONGODB_URI ?? "").trim();
  if (!uri) {
    bad("MONGODB_URI is empty", "Paste your connection string from Atlas > Connect > Drivers.");
    return finish();
  }
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) return bad("It does not start with mongodb+srv://", "Copy the full string from Atlas."), finish();
  if (/xxxxx/i.test(uri)) return bad("It still contains the example placeholder 'xxxxx'", "Copy YOUR string from Atlas > Connect > Drivers; it has your real cluster name."), finish();
  if (/[<>]/.test(uri)) return bad("It still contains < or > (for example <db_password>)", "Replace <db_password> with your real password, without the < >."), finish();
  if (/\s|["']/.test(uri)) return bad("It contains spaces or quotes", "Remove all spaces and quotes from the line."), finish();
  if ((uri.match(/@/g) ?? []).length !== 1) return bad("The password seems to contain '@' or similar symbols", "Use a password with letters and numbers only (change it in Atlas > Database Access)."), finish();

  let url: URL;
  try { url = new URL(uri); } catch { return bad("The connection string is not a valid address", "Copy it again from Atlas."), finish(); }
  const host = url.hostname;
  const db = url.pathname.replace("/", "");
  ok(`Format looks right (user: ${decodeURIComponent(url.username)}, host: ${host})`);
  if (!db) bad("No database name after .mongodb.net/", "Change '.mongodb.net/?' to '.mongodb.net/wellpath?'.");
  else ok(`Database name: ${db}`);

  // 3. JWT_SECRET
  console.log("\n3. JWT_SECRET");
  const jwt = (vars.JWT_SECRET ?? "").trim();
  if (jwt.length < 32) bad(`JWT_SECRET is ${jwt.length ? "too short" : "empty"}`, "Run: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\" and paste the result.");
  else ok(`Set (${jwt.length} characters)`);

  // 4. DNS lookup of the cluster
  console.log("\n4. Can your PC find the cluster?");
  if (uri.startsWith("mongodb+srv://")) {
    try {
      await dns.resolveSrv(`_mongodb._tcp.${host}`);
      ok("Cluster address found");
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ENOTFOUND") return bad(`Cluster '${host}' does not exist`, "Copy the connection string again from Atlas; the cluster name is wrong."), finish();
      return bad(`Your internet's DNS blocked the lookup (${code})`, "Set Windows DNS to 8.8.8.8 and 1.1.1.1 (Network settings > adapter > IPv4), or try mobile hotspot."), finish();
    }
  }

  // 5. Real connection
  console.log("\n5. Connecting to MongoDB (up to 10 seconds)");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    await mongoose.connection.db?.admin().ping();
    ok(`Connected to database '${mongoose.connection.name}'`);
  } catch (e) {
    const msg = String((e as Error).message);
    if (/auth|authentication/i.test(msg)) bad("Wrong database username or password", "Atlas > Database Access > wellpath_app > Edit > set a new letters-and-numbers password, then update .env.");
    else if (/whitelist|IP|Server selection timed out|ReplicaSetNoPrimary/i.test(msg)) bad("Atlas is blocking your IP address", "Atlas > Network Access > Add IP Address > Add current IP address. Your IP changes when your router restarts.");
    else bad(`Connection failed: ${msg.split("\n")[0]}`, "Paste this line to Claude (it contains no password).");
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
  finish();
}

function finish() {
  console.log(problems ? `\n${problems} thing(s) to fix. Fix the first one, then run npm run doctor again.\n` : "\nAll good. Run npm run dev to start everything.\n");
  process.exit(problems ? 1 : 0);
}

main();
