import { keccak256, stringToBytes } from "viem";

// Exact whitespace set used by Python str.strip()/str.split(). U+FEFF is
// intentionally absent because Python does not classify it as whitespace.
const PY_WS = /[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/gu;
const PY_WS_EDGE = /^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/gu;

export function pyStrip(value: string): string {
  return value.replace(PY_WS_EDGE, "");
}

export function stripText(value: string): string {
  return pyStrip(value);
}

export function normalizeText(value: string): string {
  return pyStrip(value).split(PY_WS).filter(Boolean).join(" ");
}

export function normalizeId(value: string): string {
  return pyStrip(value).toLowerCase().replace(/^0x/, "");
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
