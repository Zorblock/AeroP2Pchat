const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.join(__dirname, "..");
const artifactsDir = process.argv[2]
  ? path.resolve(root, process.argv[2])
  : path.join(root, "artifacts");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "config.json"), "utf8"),
);

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function releaseUrl(tag, assetName) {
  return `https://github.com/${
    config.repo
  }/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(
    assetName,
  )}`;
}

function main() {
  const manifestPath = path.join(artifactsDir, "update_manifest_windows.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Windows manifest not found: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const version = manifest.version;
  if (!version) throw new Error("No version in Windows manifest.");

  const tag = `v${version}`;
  const asset = manifest.asset;
  if (!asset) throw new Error("No asset in Windows manifest.");
  const onlineInstallerPath = path.join(
    artifactsDir,
    config.release.windowsOnlineInstallerAsset,
  );
  if (!fs.existsSync(onlineInstallerPath)) {
    throw new Error(`Online installer not found: ${onlineInstallerPath}`);
  }
  const onlineInstaller = {
    name: config.release.windowsOnlineInstallerAsset,
    size: fs.statSync(onlineInstallerPath).size,
    sha256: crypto
      .createHash("sha256")
      .update(fs.readFileSync(onlineInstallerPath))
      .digest("hex"),
    sha512: crypto
      .createHash("sha512")
      .update(fs.readFileSync(onlineInstallerPath))
      .digest("base64"),
  };

  const lines = [
    `version: ${yamlQuote(version)}`,
    `releaseDate: ${yamlQuote(new Date().toISOString())}`,
    `repo: ${yamlQuote(config.repo)}`,
    `path: ${yamlQuote(asset.name)}`,
    `url: ${yamlQuote(releaseUrl(tag, asset.name))}`,
    `sha256: ${yamlQuote(asset.sha256)}`,
    `sha512: ${yamlQuote(asset.sha512)}`,
    `size: ${asset.size}`,
    `onlineInstallerUrl: ${yamlQuote(releaseUrl(tag, onlineInstaller.name))}`,
    `onlineInstallerSha256: ${yamlQuote(onlineInstaller.sha256)}`,
    `onlineInstallerSha512: ${yamlQuote(onlineInstaller.sha512)}`,
    `onlineInstallerSize: ${onlineInstaller.size}`,
    `productName: ${yamlQuote(config.app.name)}`,
    "",
  ];

  fs.writeFileSync(
    path.join(artifactsDir, "latest.yml"),
    lines.join("\n"),
    "utf8",
  );
}

main();
