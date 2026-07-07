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

function findAsset(manifests, platform, predicate) {
  const manifest = manifests.find((entry) => entry.platform === platform);
  return manifest ? manifest.assets.find(predicate) : null;
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
  const windows = findAsset(
    manifests,
    "windows",
    (asset) => asset.name === config.release.windowsInstallerAsset,
  );
  const windowsSetup = findAsset(
    manifests,
    "windows",
    (asset) => asset.name === config.release.windowsX64SetupAsset,
  );
  const windowsPortable = findAsset(
    manifests,
    "windows",
    (asset) => asset.name === config.release.windowsX64PortableAsset,
  );
  const linux = findAsset(
    manifests,
    "linux",
    (asset) => asset.name === config.release.linuxAppImageAsset,
  );
  const linuxAppImage = findAsset(
    manifests,
    "linux",
    (asset) => asset.name === config.release.linuxX64AppImageAsset,
  );
  const linuxDeb = findAsset(
    manifests,
    "linux",
    (asset) => asset.name === config.release.linuxX64DebAsset,
  );
  const linuxPortable = findAsset(
    manifests,
    "linux",
    (asset) => asset.name === config.release.linuxX64PortableAsset,
  );
  const macosDmg = findAsset(
    manifests,
    "macos",
    (asset) => asset.name === config.release.macosUniversalDmgAsset,
  );
  const macosPortable = findAsset(
    manifests,
    "macos",
    (asset) => asset.name === config.release.macosUniversalPortableAsset,
  );
  if (!windows) throw new Error("Windows setup asset info missing.");

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
  ];

  if (windowsSetup) {
    lines.push(
      `windowsX64SetupPath: ${yamlQuote(windowsSetup.name)}`,
      `windowsX64SetupUrl: ${yamlQuote(releaseUrl(tag, windowsSetup.name))}`,
      `windowsX64SetupSha256: ${yamlQuote(windowsSetup.sha256)}`,
      `windowsX64SetupSha512: ${yamlQuote(windowsSetup.sha512)}`,
      `windowsX64SetupSize: ${windowsSetup.size}`,
    );
  }

  if (windowsPortable) {
    lines.push(
      `windowsX64PortablePath: ${yamlQuote(windowsPortable.name)}`,
      `windowsX64PortableUrl: ${yamlQuote(releaseUrl(tag, windowsPortable.name))}`,
      `windowsX64PortableSha256: ${yamlQuote(windowsPortable.sha256)}`,
      `windowsX64PortableSha512: ${yamlQuote(windowsPortable.sha512)}`,
      `windowsX64PortableSize: ${windowsPortable.size}`,
    );
  }

  if (linux) {
    lines.push(
      `linuxPath: ${yamlQuote(linux.name)}`,
      `linuxUrl: ${yamlQuote(releaseUrl(tag, linux.name))}`,
      `linuxSha256: ${yamlQuote(linux.sha256)}`,
      `linuxSha512: ${yamlQuote(linux.sha512)}`,
      `linuxSize: ${linux.size}`,
    );
  }

  if (linuxAppImage) {
    lines.push(
      `linuxX64AppImagePath: ${yamlQuote(linuxAppImage.name)}`,
      `linuxX64AppImageUrl: ${yamlQuote(releaseUrl(tag, linuxAppImage.name))}`,
      `linuxX64AppImageSha256: ${yamlQuote(linuxAppImage.sha256)}`,
      `linuxX64AppImageSha512: ${yamlQuote(linuxAppImage.sha512)}`,
      `linuxX64AppImageSize: ${linuxAppImage.size}`,
    );
  }

  if (linuxDeb) {
    lines.push(
      `linuxX64DebPath: ${yamlQuote(linuxDeb.name)}`,
      `linuxX64DebUrl: ${yamlQuote(releaseUrl(tag, linuxDeb.name))}`,
      `linuxX64DebSha256: ${yamlQuote(linuxDeb.sha256)}`,
      `linuxX64DebSha512: ${yamlQuote(linuxDeb.sha512)}`,
      `linuxX64DebSize: ${linuxDeb.size}`,
    );
  }

  if (linuxPortable) {
    lines.push(
      `linuxX64PortablePath: ${yamlQuote(linuxPortable.name)}`,
      `linuxX64PortableUrl: ${yamlQuote(releaseUrl(tag, linuxPortable.name))}`,
      `linuxX64PortableSha256: ${yamlQuote(linuxPortable.sha256)}`,
      `linuxX64PortableSha512: ${yamlQuote(linuxPortable.sha512)}`,
      `linuxX64PortableSize: ${linuxPortable.size}`,
    );
  }

  if (macosDmg) {
    lines.push(
      `macosUniversalDmgPath: ${yamlQuote(macosDmg.name)}`,
      `macosUniversalDmgUrl: ${yamlQuote(releaseUrl(tag, macosDmg.name))}`,
      `macosUniversalDmgSha256: ${yamlQuote(macosDmg.sha256)}`,
      `macosUniversalDmgSha512: ${yamlQuote(macosDmg.sha512)}`,
      `macosUniversalDmgSize: ${macosDmg.size}`,
    );
  }

  if (macosPortable) {
    lines.push(
      `macosUniversalPortablePath: ${yamlQuote(macosPortable.name)}`,
      `macosUniversalPortableUrl: ${yamlQuote(releaseUrl(tag, macosPortable.name))}`,
      `macosUniversalPortableSha256: ${yamlQuote(macosPortable.sha256)}`,
      `macosUniversalPortableSha512: ${yamlQuote(macosPortable.sha512)}`,
      `macosUniversalPortableSize: ${macosPortable.size}`,
    );
  }

  lines.push(`productName: ${yamlQuote(config.app.name)}`, "");
  fs.writeFileSync(path.join(artifactsDir, "latest.yml"), lines.join("\n"), "utf8");
}

main();
