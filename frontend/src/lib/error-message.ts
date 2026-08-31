export function extractErrorMessage(error: any, fallback: string): string {
  const raw = error?.response?.data?.message;

  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return typeof raw[0] === "string" ? raw[0] : fallback;
  if (raw && typeof raw === "object" && typeof raw.message === "string") return raw.message;

  return fallback;
}