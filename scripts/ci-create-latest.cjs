const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const artifactsDir = process.argv[2] ? path.resolve(root, process.argv[2]) : path.join(root, "artifacts");
const config = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function findManifests(dir) {
  if (!fs.existsSync(dir)) return [];
  const manifests = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      manifests.push(...findManifests(fullPath));
    } else if (/^update_manifest_(linux|windows)\.json$/.test(entry.name)) {
      manifests.push(fullPath);
    }
  }
  return manifests;
}

function releaseUrl(tag, assetName) {
  return `https://github.com/${config.repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
}

function main() {
  const manifests = findManifests(artifactsDir).map((filePath) =>
    JSON.parse(fs.readFileSync(filePath, "utf8")),
  );
  const linuxManifest = manifests.find((manifest) => manifest.platform === "linux");
  const windowsManifest = manifests.find((manifest) => manifest.platform === "windows");
  if (!linuxManifest) throw new Error("Linux release manifest missing.");

  const version = linuxManifest.version;
  const linux = linuxManifest.assets.find((asset) => asset.name === config.release.linuxAppImageAsset);
  const windows = windowsManifest?.assets.find(
    (asset) => asset.name === config.release.windowsInstallerAsset,
  );
  if (!version) throw new Error("Release version missing.");
  if (!linux) throw new Error("Linux AppImage asset info missing.");

  const tag = `v${version}`;
  const lines = [
    `version: ${yamlQuote(version)}`,
    `releaseDate: ${yamlQuote(new Date().toISOString())}`,
    `repo: ${yamlQuote(config.repo)}`,
    `path: ${yamlQuote(windows?.name || linux.name)}`,
    `url: ${yamlQuote(releaseUrl(tag, windows?.name || linux.name))}`,
    `sha256: ${yamlQuote(windows?.sha256 || linux.sha256)}`,
    `sha512: ${yamlQuote(windows?.sha512 || linux.sha512)}`,
    `size: ${windows?.size || linux.size}`,
    `linuxPath: ${yamlQuote(linux.name)}`,
    `linuxUrl: ${yamlQuote(releaseUrl(tag, linux.name))}`,
    `linuxSha256: ${yamlQuote(linux.sha256)}`,
    `linuxSha512: ${yamlQuote(linux.sha512)}`,
    `linuxSize: ${linux.size}`,
    `productName: ${yamlQuote(config.app.name)}`,
    "",
  ];

  if (windows) {
    lines.splice(
      8,
      0,
      `windowsPath: ${yamlQuote(windows.name)}`,
      `windowsUrl: ${yamlQuote(releaseUrl(tag, windows.name))}`,
      `windowsSha256: ${yamlQuote(windows.sha256)}`,
      `windowsSha512: ${yamlQuote(windows.sha512)}`,
      `windowsSize: ${windows.size}`,
    );
  }

  fs.writeFileSync(path.join(artifactsDir, "latest.yml"), lines.join("\n"), "utf8");
}

main();
