import "server-only";

type LogTransactionInput = {
  operation: string;
  success: boolean;
  payload?: Record<string, unknown>;
  error?: unknown;
};

export function logTransaction({ operation, success, payload, error }: LogTransactionInput) {
  const entry = {
    operation,
    timestamp: new Date().toISOString(),
    success,
    payload: sanitizePayload(payload ?? {}),
    error: error ? safeErrorMessage(error) : undefined,
  };

  if (success) {
    console.info("[transaction]", entry);
  } else {
    console.error("[transaction]", entry);
  }
}

function sanitizePayload(payload: Record<string, unknown>) {
  const blocked = new Set(["password", "token", "editToken", "edit_token", "secret", "key"]);
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      blocked.has(key) || [...blocked].some((blockedKey) => key.toLowerCase().includes(blockedKey.toLowerCase()))
        ? "[redacted]"
        : value,
    ])
  );
}

export function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String(error.message);
  return String(error);
}
