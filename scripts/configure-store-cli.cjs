const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.store");
const requiredKeys = [
  "PARTNER_CENTER_TENANT_ID",
  "PARTNER_CENTER_SELLER_ID",
  "PARTNER_CENTER_CLIENT_ID",
  "PARTNER_CENTER_CLIENT_SECRET",
  "MSSTORE_PRODUCT_ID",
];

function readStoreEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.store is missing. Create it locally before configuring the Store CLI.");
  }

  const values = {};
  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  const missing = requiredKeys.filter((key) => !values[key]);
  if (missing.length > 0) {
    throw new Error(`.env.store is missing: ${missing.join(", ")}`);
  }

  return values;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}.`);
  }
}

function main() {
  const env = readStoreEnv();
  console.log("Configuring the local Microsoft Store CLI credentials...");
  console.log("The client secret is never printed.");

  run("msstore", [
    "reconfigure",
    "--tenantId", env.PARTNER_CENTER_TENANT_ID,
    "--sellerId", env.PARTNER_CENTER_SELLER_ID,
    "--clientId", env.PARTNER_CENTER_CLIENT_ID,
    "--clientSecret", env.PARTNER_CENTER_CLIENT_SECRET,
  ]);

  console.log("\nChecking the authenticated Store CLI configuration...");
  run("msstore", ["info"]);
  console.log(`\nStore CLI is ready for product ${env.MSSTORE_PRODUCT_ID}.`);
}

try {
  main();
} catch (error) {
  console.error(`\nStore CLI configuration failed: ${error.message || error}`);
  process.exit(1);
}
