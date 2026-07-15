const {
  createWriteStream,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const archiver = require("archiver");

const root = join(__dirname, "..");
const outputDir = join(root, "dist", "chrome-addon");
const releaseDir = join(root, "dist", "release");
const sourceDir = join(root, "chrome-addon");
const packageInfo = require(join(root, "package.json"));
const archivePath = join(
  releaseDir,
  `Aero-P2P-Chat-Chrome-Addon-${packageInfo.version}.zip`,
);

const vite = join(root, "node_modules", "vite", "bin", "vite.js");
const result = spawnSync(process.execPath, [vite, "build", "--config", "vite.chrome-addon.config.js"], {
  cwd: root,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

if (!existsSync(join(outputDir, "app.png"))) {
  throw new Error("Chrome extension icon app.png was not generated.");
}

cpSync(sourceDir, outputDir, { recursive: true });

const manifestPath = join(outputDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = packageInfo.version;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Chrome extension built in ${outputDir}`);

function createReleaseArchive() {
  mkdirSync(releaseDir, { recursive: true });
  rmSync(archivePath, { force: true });

  return new Promise((resolve, reject) => {
    const output = createWriteStream(archivePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(outputDir, false);
    archive.finalize();
  });
}

createReleaseArchive()
  .then(() => console.log(`Chrome Web Store package created at ${archivePath}`))
  .catch((error) => {
    console.error("Could not create Chrome extension ZIP", error);
    process.exitCode = 1;
  });
