import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { getAdmin } from "./account";
const cookieName = "gallery_session";
function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function equal(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export async function authenticated() {
  const admin = await getAdmin();
  if (!admin) return false;
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  return (
    Number(expires) > Date.now() &&
    Boolean(signature) &&
    equal(sign(expires, admin.session_secret), signature)
  );
}
export async function requireAuth() {
  if (!(await getAdmin())) redirect("/setup");
  if (!(await authenticated())) redirect("/login");
}
export async function createSession() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Complete setup first.");
  const expires = String(Date.now() + 7 * 86400000);
  (await cookies()).set(
    cookieName,
    `${expires}.${sign(expires, admin.session_secret)}`,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.APP_ORIGIN?.startsWith("https://"),
      path: "/",
      maxAge: 7 * 86400,
    },
  );
}
export async function clearSession() {
  (await cookies()).delete(cookieName);
}
