const crypto = require("node:crypto");
const {
  decryptAuthenticatedConfig,
  decryptLegacyConfig,
  encryptAuthenticatedConfig,
  isAuthenticatedConfig,
} = require("../src/main/config-crypto");

function expectFailure(callback, message) {
  try {
    callback();
  } catch {
    return;
  }
  throw new Error(message);
}

const key = crypto.randomBytes(32);
const plaintext = JSON.stringify({
  identity: {
    id: "aero-0123456789abcdef",
    authToken: "test-secret",
  },
});
const encrypted = encryptAuthenticatedConfig(plaintext, key);

if (!isAuthenticatedConfig(encrypted)) {
  throw new Error("Authenticated config format was not detected.");
}
if (decryptAuthenticatedConfig(encrypted, key) !== plaintext) {
  throw new Error("Authenticated config round trip failed.");
}

const tamperedParts = encrypted.split(":");
const tamperedCiphertext = Buffer.from(tamperedParts[3], "base64");
tamperedCiphertext[0] ^= 1;
tamperedParts[3] = tamperedCiphertext.toString("base64");
expectFailure(
  () => decryptAuthenticatedConfig(tamperedParts.join(":"), key),
  "Tampered config was accepted.",
);
expectFailure(
  () => decryptAuthenticatedConfig(encrypted, crypto.randomBytes(32)),
  "Config encrypted with another key was accepted.",
);

const appId = "de.zorblock.aerop2pchat";
const legacyKey = crypto.createHash("sha256").update(appId).digest();
const legacyIv = crypto.randomBytes(16);
const legacyCipher = crypto.createCipheriv(
  "aes-256-cbc",
  legacyKey,
  legacyIv,
);
const legacyEncrypted =
  `ENC:${legacyIv.toString("hex")}:` +
  legacyCipher.update(plaintext, "utf8", "base64") +
  legacyCipher.final("base64");

if (decryptLegacyConfig(legacyEncrypted, appId) !== plaintext) {
  throw new Error("Legacy encrypted config migration failed.");
}
if (decryptLegacyConfig(plaintext, appId) !== plaintext) {
  throw new Error("Legacy plaintext config migration failed.");
}

console.log("Secure config crypto and legacy migration checks passed.");
