import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password";
test("password hashes are salted and reject incorrect or oversized input", async () => {
  const password = "A long test password 🔐";
  const hash = await hashPassword(password);
  assert.notEqual(hash, await hashPassword(password));
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("incorrect", hash), false);
  assert.equal(await verifyPassword("x".repeat(1025), hash), false);
  assert.equal(await verifyPassword(password, "invalid"), false);
});
