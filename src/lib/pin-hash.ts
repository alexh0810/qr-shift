import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const SCRYPT_PREFIX = "scrypt";
const KEY_LENGTH = 64;

function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(pin, salt, KEY_LENGTH)) as Buffer;
  return [SCRYPT_PREFIX, toBase64Url(salt), toBase64Url(derivedKey)].join("$");
}

export async function verifyPin(pin: string, pinHash: string) {
  const [prefix, saltValue, hashValue] = pinHash.split("$");
  if (prefix !== SCRYPT_PREFIX || !saltValue || !hashValue) {
    return false;
  }

  const salt = fromBase64Url(saltValue);
  const expected = fromBase64Url(hashValue);
  const actual = (await scrypt(pin, salt, expected.length)) as Buffer;

  return timingSafeEqual(actual, expected);
}
