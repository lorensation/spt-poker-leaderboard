import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

function tokenPepper() {
  return process.env.EDIT_TOKEN_PEPPER ?? "development-edit-token-pepper";
}

export function generateEditToken() {
  return randomBytes(32).toString("base64url");
}

export async function hashEditToken(token: string) {
  return createHash("sha256")
    .update(`${token}:${tokenPepper()}`)
    .digest("hex");
}

export async function verifyEditToken(token: string, storedHash: string | null | undefined) {
  if (!token || !storedHash) return false;
  const incomingHash = await hashEditToken(token);
  const incomingBuffer = Buffer.from(incomingHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (incomingBuffer.length !== storedBuffer.length) return false;
  return timingSafeEqual(incomingBuffer, storedBuffer);
}
