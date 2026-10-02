import test from "node:test";
import assert from "node:assert/strict";
import { sql } from "../src/lib/db";
import { getAdmin, initializeAdmin } from "../src/lib/account";
import { verifyPassword } from "../src/lib/password";
test(
  "admin setup is atomic, survives existing content, and imports legacy credentials only once",
  {
    skip: process.env.RUN_ACCOUNT_TESTS !== "1",
  },
  async () => {
    const [db] = await sql`SELECT current_database() AS name`;
    assert.ok(
      db.name.endsWith("_auth_test"),
      "Use a dedicated database ending in _auth_test",
    );
    assert.equal(
      (await sql`SELECT * FROM admin_account`).length,
      0,
      "Test database must have no account",
    );
    const original = process.env.APP_PASSWORD;
    delete process.env.APP_PASSWORD;
    try {
      await sql`INSERT INTO models(name) VALUES('Existing content')`;
      assert.equal(await getAdmin(), undefined);
      const results = await Promise.all([
        initializeAdmin("first-password"),
        initializeAdmin("second-password"),
      ]);
      assert.equal(results.filter(Boolean).length, 1);
      const admin = (await getAdmin())!;
      assert.equal(
        await verifyPassword(
          results[0] ? "first-password" : "second-password",
          admin.password_hash,
        ),
        true,
      );
      assert.equal(await initializeAdmin("replacement-password"), false);
      process.env.APP_PASSWORD = "changed-environment-password";
      assert.deepEqual(await getAdmin(), admin);
      assert.equal(
        (await sql`SELECT * FROM models WHERE name='Existing content'`).length,
        1,
      );
      await sql`DELETE FROM admin_account`;
      const imported = (await getAdmin())!;
      assert.equal(
        await verifyPassword(process.env.APP_PASSWORD, imported.password_hash),
        true,
      );
      delete process.env.APP_PASSWORD;
      assert.deepEqual(await getAdmin(), imported);
    } finally {
      if (original === undefined) delete process.env.APP_PASSWORD;
      else process.env.APP_PASSWORD = original;
      await sql`DELETE FROM admin_account`;
      await sql`DELETE FROM models WHERE name='Existing content'`;
      await sql.end();
    }
  },
);
