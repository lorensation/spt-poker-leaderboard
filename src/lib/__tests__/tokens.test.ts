import { beforeEach, describe, expect, it } from "vitest";

import { generateEditToken, hashEditToken, verifyEditToken } from "@/lib/security/tokens";

describe("edit tokens", () => {
  beforeEach(() => {
    process.env.EDIT_TOKEN_PEPPER = "test-pepper";
  });

  it("generates a private token and verifies only its hash", async () => {
    const token = generateEditToken();
    const hash = await hashEditToken(token);

    expect(token).not.toBe(hash);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(await verifyEditToken(token, hash)).toBe(true);
    expect(await verifyEditToken("wrong-token", hash)).toBe(false);
  });
});
