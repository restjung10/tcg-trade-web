import "server-only";
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.BANK_ACCOUNT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("BANK_ACCOUNT_ENCRYPTION_KEY가 설정되지 않았습니다.");
  }
  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error("BANK_ACCOUNT_ENCRYPTION_KEY는 32바이트(base64)여야 합니다.");
  }
  return buffer;
}

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decrypt(cipherText: string): string {
  const [ivB64, tagB64, dataB64] = cipherText.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("잘못된 암호화 데이터 형식입니다.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}
