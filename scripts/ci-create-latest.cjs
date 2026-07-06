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
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findManifests(fullPath);
    return /^update_manifest_.+\.json$/.test(entry.name) ? [fullPath] : [];
  });
}

function findAsset(manifests, platform, name) {
  const manifest = manifests.find((entry) => entry.platform === platform);
  return manifest ? manifest.assets.find((asset) => asset.name === name) : null;
}

function releaseUrl(tag, assetName) {
  return `https://github.com/${config.repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`;
}

function main() {
  const manifests = findManifests(artifactsDir).map((filePath) =>
    JSON.parse(fs.readFileSync(filePath, "utf8")),
  );
  const version = (manifests.find((entry) => entry.version) || {}).version;
  if (!version) throw new Error("No release manifests found.");

  const tag = `v${version}`;
  const windows = findAsset(manifests, "windows", config.release.windowsInstallerAsset);
  const linux = findAsset(manifests, "linux", config.release.linuxAppImageAsset);
  if (!windows) throw new Error("Windows setup asset info missing.");
  if (!linux) throw new Error("Linux AppImage asset info missing.");

  const lines = [
    `version: ${yamlQuote(version)}`,
    `releaseDate: ${yamlQuote(new Date().toISOString())}`,
    `repo: ${yamlQuote(config.repo)}`,
    `path: ${yamlQuote(windows.name)}`,
    `url: ${yamlQuote(releaseUrl(tag, windows.name))}`,
    `sha256: ${yamlQuote(windows.sha256)}`,
    `sha512: ${yamlQuote(windows.sha512)}`,
    `size: ${windows.size}`,
    `windowsPath: ${yamlQuote(windows.name)}`,
    `windowsUrl: ${yamlQuote(releaseUrl(tag, windows.name))}`,
    `windowsSha256: ${yamlQuote(windows.sha256)}`,
    `windowsSha512: ${yamlQuote(windows.sha512)}`,
    `windowsSize: ${windows.size}`,
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
