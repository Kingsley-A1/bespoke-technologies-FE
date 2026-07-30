import { randomBytes } from "node:crypto";

const RECOVERY_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const RECOVERY_SYMBOLS = 16;

export function normalizeRecoveryCode(value: string) {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return normalized.startsWith("BT") ? normalized.slice(2) : normalized;
}

export function isValidRecoveryCode(value: string) {
  const normalized = normalizeRecoveryCode(value);
  // Six-digit codes remain accepted only in the dedicated recovery flow so
  // previously provisioned environment-backed codes can be retired safely.
  return /^\d{6}$/.test(normalized) || new RegExp(`^[${RECOVERY_ALPHABET}]{${RECOVERY_SYMBOLS}}$`).test(normalized);
}

export function formatRecoveryCode(symbols: string) {
  const groups = symbols.match(/.{1,4}/g) ?? [];
  return `BT-${groups.join("-")}`;
}

export function generateRecoveryCodes(count = 10) {
  const codes = new Set<string>();
  while (codes.size < count) {
    const bytes = randomBytes(RECOVERY_SYMBOLS);
    let symbols = "";
    for (const byte of bytes) symbols += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
    codes.add(formatRecoveryCode(symbols));
  }
  return [...codes];
}
