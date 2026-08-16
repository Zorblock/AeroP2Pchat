const { spawnSync } = require("node:child_process");
const { createWriteStream } = require("node:fs");
const fs = require("node:fs");
const path = require("node:path");
const archiver = require("archiver");

const root = path.join(__dirname, "..");
const config = require("../config.json");
const packageInfo = require("../package.json");
const buildDir = path.join(root, "dist", "build", "chrome-extension");
const unpackedDir = path.join(buildDir, "unpacked");
const artifactsDir = path.join(root, "dist", "build", "artifacts");
const assetName =
  config.release.chromeExtensionAsset || "Aero-P2P-Chat-Chrome-Extension.zip";
const archivePath = path.join(artifactsDir, assetName);

function run(command, args) {
  const isWindowsNpm = process.platform === "win32" && command === "npx";
  const result = spawnSync(
    isWindowsNpm ? process.env.ComSpec || "cmd.exe" : command,
    isWindowsNpm ? ["/d", "/s", "/c", "npx.cmd", ...args] : args,
    { cwd: root, stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }
}

function writeManifest() {
  const manifest = {
    manifest_version: 3,
    name: config.app.name,
    version: packageInfo.version,
    description: "Secure, serverless peer-to-peer chat.",
    action: {
      default_title: config.app.name,
      default_icon: "icons/icon.png",
    },
    background: {
      service_worker: "background.js",
    },
    icons: {
      16: "icons/icon.png",
      32: "icons/icon.png",
      48: "icons/icon.png",
      128: "icons/icon.png",
    },
    // Keep Chrome Web Store permissions limited to the APIs the extension
    // actually uses. Config is saved with chrome.storage.local, received files
    // stream into OPFS without an artificial quota, use Chrome's protected
    // download flow, and copy through the Clipboard API.
    permissions: ["clipboardWrite", "downloads", "storage", "unlimitedStorage"],
    // PeerJS uses this signalling service to establish direct P2P connections.
    // No website or account host permission is required.
    host_permissions: ["https://0.peerjs.com/*"],
    // Requested only after the user adds a remote CSS theme from that host.
    optional_host_permissions: ["https://*/*"],
  };

  fs.mkdirSync(path.join(unpackedDir, "icons"), { recursive: true });
  fs.writeFileSync(
    path.join(unpackedDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  fs.copyFileSync(
    path.join(root, "chrome-extension", "background.js"),
    path.join(unpackedDir, "background.js"),
  );
  fs.copyFileSync(
    path.join(root, "assets", "linux-icons", "512x512.png"),
    path.join(unpackedDir, "icons", "icon.png"),
  );
}

function createArchive() {
  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.rmSync(archivePath, { force: true });

  return new Promise((resolve, reject) => {
    const output = createWriteStream(archivePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(unpackedDir, false);
    archive.finalize();
  });
}

async function main() {
  fs.rmSync(buildDir, { recursive: true, force: true });
  run("npx", ["vite", "build", "--config", "vite.chrome.config.js"]);
  writeManifest();
  await createArchive();
  console.log(`Chrome extension package created: ${archivePath}`);
}

main().catch((error) => {
  console.error(`Chrome extension build failed: ${error.message || error}`);
  process.exit(1);
});
