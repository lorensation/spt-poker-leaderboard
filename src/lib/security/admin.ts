import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "spt_admin_session";

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "development-admin-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", adminSecret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export async function setAdminSession() {
  const value = `admin.${Date.now()}`;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  const parts = cookie.split(".");
  if (parts.length !== 3) return false;
  const value = `${parts[0]}.${parts[1]}`;
  const signature = parts[2];
  return safeEqual(signature, sign(value));
}

export async function requireAdmin() {
  if (!(await isAdminSession())) {
    throw new Error("Admin access required.");
  }
}
