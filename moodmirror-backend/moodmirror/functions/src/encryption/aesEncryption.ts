import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const hexKey = process.env.AES_ENCRYPTION_KEY;
  if (!hexKey || hexKey.length !== 64) {
    throw new Error("AES_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hexKey, "hex");
}

export interface EncryptedPayload {
  ciphertext: string; // hex
  iv: string;         // hex
  tag: string;        // hex
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Each call generates a fresh random IV — safe for repeated use.
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

/**
 * Decrypt an EncryptedPayload back to plaintext.
 * Throws if authentication tag verification fails (tampered data).
 */
export function decrypt(payload: EncryptedPayload): string {
  const key = getEncryptionKey();

  if (
    !payload.ciphertext ||
    payload.iv.length !== IV_LENGTH * 2 ||
    payload.tag.length !== TAG_LENGTH * 2
  ) {
    throw new Error("Invalid encrypted payload structure");
  }

  const iv = Buffer.from(payload.iv, "hex");
  const tag = Buffer.from(payload.tag, "hex");
  const ciphertext = Buffer.from(payload.ciphertext, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Encrypt a JS object as JSON.
 */
export function encryptObject<T>(obj: T): EncryptedPayload {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt back to a typed JS object.
 */
export function decryptObject<T>(payload: EncryptedPayload): T {
  return JSON.parse(decrypt(payload)) as T;
}

// Validate key length at module load (fail fast)
export function validateEncryptionConfig(): void {
  const hexKey = process.env.AES_ENCRYPTION_KEY ?? "";
  const ivSecret = process.env.AES_IV_SECRET ?? "";
  if (hexKey.length !== 64) throw new Error("AES_ENCRYPTION_KEY invalid length");
  if (ivSecret.length < 16) throw new Error("AES_IV_SECRET too short");
  const keyBuf = Buffer.from(hexKey, "hex");
  if (keyBuf.length !== KEY_LENGTH) throw new Error("AES key must be 32 bytes");
}
