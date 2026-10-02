import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
const cookieName = "gallery_session";
export function authEnabled() {
  return Boolean(process.env.APP_PASSWORD);
}
function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Set SESSION_SECRET to at least 32 random characters.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function equal(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export async function authenticated() {
  if (!authEnabled())
    return (
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_PRIVATE_NO_AUTH === "true"
    );
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return false;
  const [expires, signature] = value.split(".");
  return (
    Number(expires) > Date.now() &&
    Boolean(signature) &&
    equal(sign(expires), signature)
  );
}
export async function requireAuth() {
  if (!(await authenticated())) redirect("/login");
}
export async function createSession() {
  const expires = String(Date.now() + 7 * 86400000);
  (await cookies()).set(cookieName, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_ORIGIN?.startsWith("https://"),
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function clearSession() {
  (await cookies()).delete(cookieName);
}
