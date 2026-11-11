/** Password hashing with Argon2id. */
import argon2 from "argon2";

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

let dummyHash: Promise<string> | undefined;

/** Spends the same time as a real check, so response time does not reveal which emails exist. */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("wellpath-no-such-account");
  await verifyPassword(await dummyHash, password);
}
