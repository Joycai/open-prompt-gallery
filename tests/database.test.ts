import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import sharp from "sharp";
import { sql } from "../src/lib/db";
import { storeImage, cleanupFiles, filePath } from "../src/lib/storage";
const enabled = process.env.RUN_DB_TESTS === "1";
test(
  "Postgres enforces relationships and image cleanup survives cascade deletes",
  { skip: !enabled },
  async () => {
    const [model] =
      await sql`INSERT INTO models(name) VALUES(${"Integration " + crypto.randomUUID()}) RETURNING id`;
    let prompt: string | undefined, group: string | undefined;
    try {
      const [p] =
        await sql`INSERT INTO prompts(model_id,title,body,kind) VALUES(${model.id},'Integration prompt','Body','piece') RETURNING id`;
      prompt = p.id;
      const [g] =
        await sql`INSERT INTO groups(name) VALUES('Integration group') RETURNING id`;
      group = g.id;
      await sql`INSERT INTO group_prompts VALUES(${g.id},${p.id})`;
      await assert.rejects(sql`DELETE FROM models WHERE id=${model.id}`, {
        code: "23503",
      });
      await assert.rejects(
        sql`INSERT INTO group_prompts VALUES(${g.id},${p.id})`,
        { code: "23505" },
      );
      const buffer = await sharp({
        create: { width: 32, height: 32, channels: 3, background: "#8296bc" },
      })
        .png()
        .toBuffer();
      await storeImage(
        new File([new Uint8Array(buffer)], "test.png", { type: "image/png" }),
        "prompt",
        p.id,
      );
      await storeImage(
        new File([new Uint8Array(buffer)], "group.png", { type: "image/png" }),
        "group",
        g.id,
      );
      await assert.rejects(
        storeImage(
          new File(["<svg/>"], "bad.png", { type: "image/png" }),
          "prompt",
          p.id,
        ),
      );
      const [img] =
        await sql`SELECT storage_key,width,height FROM images WHERE prompt_id=${p.id}`;
      assert.equal(img.width, 32);
      await access(filePath(img.storage_key));
      await sql`DELETE FROM prompts WHERE id=${p.id}`;
      assert.equal(
        (await sql`SELECT * FROM group_prompts WHERE group_id=${g.id}`).length,
        0,
      );
      assert.equal(
        (await sql`SELECT * FROM images WHERE group_id=${g.id}`).length,
        1,
      );
      assert.equal(
        (
          await sql`SELECT * FROM file_cleanup WHERE storage_key=${img.storage_key}`
        ).length,
        1,
      );
      await cleanupFiles();
      await assert.rejects(access(filePath(img.storage_key)), {
        code: "ENOENT",
      });
    } finally {
      if (prompt) await sql`DELETE FROM prompts WHERE id=${prompt}`;
      if (group) await sql`DELETE FROM groups WHERE id=${group}`;
      await sql`DELETE FROM models WHERE id=${model.id}`;
      await cleanupFiles();
      await sql.end();
    }
  },
);
