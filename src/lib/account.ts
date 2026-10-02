import { randomBytes } from "node:crypto";
import { sql } from "./db";
import { hashPassword } from "./password";
export type Admin = { password_hash: string; session_secret: string };
// A database lock and singleton primary key make first-run setup atomic across
// concurrent requests and application instances. Existing credentials never change.
export async function initializeAdmin(password: string) {
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(731684103)`;
    const [existing] = await tx`SELECT id FROM admin_account WHERE id=1`;
    if (existing) return false;
    const hash = await hashPassword(password);
    await tx`INSERT INTO admin_account(id,password_hash,session_secret) VALUES(1,${hash},${randomBytes(32).toString("hex")})`;
    return true;
  });
}
export async function getAdmin(): Promise<Admin | undefined> {
  const [admin] = await sql<
    Admin[]
  >`SELECT password_hash,session_secret FROM admin_account WHERE id=1`;
  if (admin) return admin;
  // Upgrade installations that already protected their library with APP_PASSWORD.
  if (process.env.APP_PASSWORD) {
    await initializeAdmin(process.env.APP_PASSWORD);
    const [imported] = await sql<
      Admin[]
    >`SELECT password_hash,session_secret FROM admin_account WHERE id=1`;
    return imported;
  }
}
