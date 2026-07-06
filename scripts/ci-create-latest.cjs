const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const artifactsDir = process.argv[2] ? path.resolve(root, process.argv[2]) : path.join(root, "artifacts");
const config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function findManifest(dir) {
  if (!fs.existsSync(dir)) return "";
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findManifest(fullPath);
      if (nested) return nested;
    } else if (entry.name === "update_manifest_linux.json") {
      return fullPath;
    }
  }
  return "";
}

function releaseUrl(tag, assetName) {
  return `https://github.com/${config.repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
}

function main() {
  const manifestPath = findManifest(artifactsDir);
  if (!manifestPath) throw new Error("Linux release manifest missing.");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const version = manifest.version;
  const linux = manifest.assets.find((asset) => asset.name === config.release.linuxAppImageAsset);
  if (!version) throw new Error("Release version missing.");
  if (!linux) throw new Error("Linux AppImage asset info missing.");

  const tag = `v${version}`;
  const lines = [
    `version: ${yamlQuote(version)}`,
    `releaseDate: ${yamlQuote(new Date().toISOString())}`,
    `repo: ${yamlQuote(config.repo)}`,
    `path: ${yamlQuote(linux.name)}`,
    `url: ${yamlQuote(releaseUrl(tag, linux.name))}`,
    `sha256: ${yamlQuote(linux.sha256)}`,
    `sha512: ${yamlQuote(linux.sha512)}`,
    `size: ${linux.size}`,
    `linuxPath: ${yamlQuote(linux.name)}`,
    `linuxUrl: ${yamlQuote(releaseUrl(tag, linux.name))}`,
    `linuxSha256: ${yamlQuote(linux.sha256)}`,
    `linuxSha512: ${yamlQuote(linux.sha512)}`,
    `linuxSize: ${linux.size}`,
    `productName: ${yamlQuote(config.app.name)}`,
    "",
  ];

  fs.writeFileSync(path.join(artifactsDir, "latest.yml"), lines.join("\n"), "utf8");
}

main();
