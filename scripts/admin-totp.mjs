import { createHmac, randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let value = "";
  for (let index = 0; index < bits.length; index += 5) {
    value += alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  }
  return value;
}

function decodeBase32(value) {
  let bits = "";
  for (const character of value) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

function code(secret, step = Math.floor(Date.now() / 30_000)) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

const secret = base32(randomBytes(20));
process.stdout.write(`TOTP secret: ${secret}\nCurrent verification code: ${code(secret)}\n`);
process.stdout.write("Store the secret in the appropriate server-only ADMIN_*_TOTP_SECRET variable and enroll the same secret in the named administrator's authenticator.\n");

