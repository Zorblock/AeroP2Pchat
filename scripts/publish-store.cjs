const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.store");
const storeDir = path.join(root, "dist", "store");

function readProductId() {
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.store is missing. Run npm run store:configure first.");
  }

  for (const rawLine of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    if (line.slice(0, separator).trim() === "MSSTORE_PRODUCT_ID") {
      const productId = line.slice(separator + 1).trim();
      if (productId) return productId;
    }
  }

  throw new Error("MSSTORE_PRODUCT_ID is missing in .env.store.");
}

function findMsixPackage() {
  if (!fs.existsSync(storeDir)) {
    throw new Error("dist/store does not exist. Run npm run build:store first.");
  }

  const packages = fs
    .readdirSync(storeDir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".msix"))
    .map((fileName) => path.join(storeDir, fileName));

  if (packages.length !== 1) {
    throw new Error(
      `Expected exactly one .msix package in dist/store, found ${packages.length}. Run npm run build:store again.`,
    );
  }

  return packages[0];
}

function main() {
  const draftOnly = process.argv.slice(2).includes("--draft");
  const productId = readProductId();
  const msixPackage = findMsixPackage();
  const args = [
    "publish",
    root,
    "--inputDirectory",
    storeDir,
    "--appId",
    productId,
  ];

  if (draftOnly) args.push("--noCommit");

  console.log(`Uploading ${path.relative(root, msixPackage)} to Microsoft Store...`);
  console.log(draftOnly ? "The submission will remain a draft." : "The submission will be sent for certification.");

  const result = spawnSync("msstore", args, {
    cwd: root,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`msstore publish failed with exit code ${result.status}.`);
  }
}

try {
  main();
} catch (error) {
  console.error(`\nMicrosoft Store publish failed: ${error.message || error}`);
  process.exit(1);
}
