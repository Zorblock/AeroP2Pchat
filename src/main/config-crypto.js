const {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} = require("node:crypto");

const CONFIG_FORMAT_PREFIX = "AERO2";
const KEY_BYTES = 32;
const IV_BYTES = 12;

function assertConfigKey(key) {
  if (!Buffer.isBuffer(key) || key.length !== KEY_BYTES) {
    throw new Error("Invalid config encryption key.");
  }
}

function encryptAuthenticatedConfig(text, key) {
  assertConfigKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(text), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    CONFIG_FORMAT_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

function decryptAuthenticatedConfig(value, key) {
  assertConfigKey(key);
  const parts = String(value).split(":");
  if (parts.length !== 4 || parts[0] !== CONFIG_FORMAT_PREFIX) {
    throw new Error("Invalid authenticated config format.");
  }

  const iv = Buffer.from(parts[1], "base64");
  const tag = Buffer.from(parts[2], "base64");
  const ciphertext = Buffer.from(parts[3], "base64");
  if (iv.length !== IV_BYTES || tag.length !== 16 || ciphertext.length === 0) {
    throw new Error("Invalid authenticated config data.");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

function decryptLegacyConfig(value, appId = "AeroP2Pchat") {
  const text = String(value);
  if (!text.startsWith("ENC:")) {
    return text;
  }

  const parts = text.substring(4).split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid legacy config format.");
  }

  const key = createHash("sha256").update(appId).digest();
  const iv = Buffer.from(parts[0], "hex");
  if (iv.length !== 16) {
    throw new Error("Invalid legacy config IV.");
  }
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return decipher.update(parts[1], "base64", "utf8") + decipher.final("utf8");
}

function isAuthenticatedConfig(value) {
  return String(value).startsWith(`${CONFIG_FORMAT_PREFIX}:`);
}

module.exports = {
  CONFIG_FORMAT_PREFIX,
  KEY_BYTES,
  decryptAuthenticatedConfig,
  decryptLegacyConfig,
  encryptAuthenticatedConfig,
  isAuthenticatedConfig,
};
