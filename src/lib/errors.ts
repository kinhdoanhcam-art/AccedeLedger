function nestedMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  for (const key of ["shortMessage", "message", "details", "reason"]) {
    const field = (value as Record<string, unknown>)[key];
    if (typeof field === "string" && field.trim()) return field.trim();
  }
  for (const key of ["cause", "error", "data"]) {
    const result = nestedMessage((value as Record<string, unknown>)[key]);
    if (result) return result;
  }
  return undefined;
}

export function errorMessage(error: unknown): string {
  const message = nestedMessage(error) || String(error || "Unknown error");
  if (/user rejected|denied transaction|code 4001/i.test(message)) {
    return "The wallet request was rejected.";
  }
  if (/undertaking not found/i.test(message)) {
    return "Undertaking not found on this Project deployment.";
  }
  return message.replace(/^Error:\s*/i, "");
}
