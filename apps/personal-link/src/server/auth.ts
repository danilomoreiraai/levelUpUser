import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const params = { N: 2 ** 17, r: 8, p: 1, maxmem: 192 * 1024 ** 2 };
const hashFormat = /^scrypt\$([a-f\d]{32})\$([a-f\d]{128})$/;
export const sessionDurationSeconds = 12 * 60 * 60;

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, params, (error, key) => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 15 || Buffer.byteLength(password) > 512) {
    throw new Error("Use uma senha de pelo menos 15 caracteres e até 512 bytes.");
  }
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function readPasswordHash(serialized: string) {
  const match = hashFormat.exec(serialized);
  if (!match) {
    throw new Error("ADMIN_PASSWORD_HASH is missing or invalid.");
  }
  const salt = Buffer.from(match[1], "hex");
  const key = Buffer.from(match[2], "hex");
  return {
    tag: digest(serialized),
    async verify(password: unknown): Promise<boolean> {
      if (typeof password !== "string" || Buffer.byteLength(password) > 512) {
        return false;
      }
      return timingSafeEqual(key, await deriveKey(password, salt));
    },
  };
}

export function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
