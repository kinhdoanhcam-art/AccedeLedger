import { keccak256, stringToBytes } from "viem";

export function stripText(value: string): string {
  return value.trim();
}

export function normalizeText(value: string): string {
  return stripText(value).split(/\s+/u).join(" ");
}

export function normalizeId(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, "");
}

export function undertakingId(creator: string, text: string): string {
  const normalized = normalizeText(text);
  const payload = [
    "OUTSIDE_DUTY_BIND:UNDERTAKING:V1|",
    creator.toLowerCase(),
    "|",
    String([...normalized].length),
    "|",
    normalized,
  ].join("");
  return keccak256(stringToBytes(payload)).slice(2);
}

export function validId(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(normalizeId(value));
}

export function short(value: string, head = 7, tail = 5): string {
  if (!value || value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
