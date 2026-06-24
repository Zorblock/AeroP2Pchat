const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const scriptPath = path.join(root, "create-setup.iss");
const markerPath = path.join(root, "dist", "build", "latest-win-dir.txt");
const markerValue = fs.existsSync(markerPath) ? fs.readFileSync(markerPath, "utf8").trim() : "";
const markerUnpackedDir = markerValue
  ? path.resolve(root, markerValue)
  : "";
const markerRelativeToRoot = markerUnpackedDir ? path.relative(root, markerUnpackedDir) : "";
const markerIsInsideRoot = markerRelativeToRoot && !markerRelativeToRoot.startsWith("..") && !path.isAbsolute(markerRelativeToRoot);
const unpackedDir = markerIsInsideRoot && fs.existsSync(markerUnpackedDir)
  ? markerUnpackedDir
  : path.join(root, "dist", "build", "win-unpacked");
const candidates = [
  "ISCC.exe",
  "ISCC",
  path.join(process.env["ProgramFiles(x86)"] || "", "Inno Setup 6", "ISCC.exe"),
  path.join(process.env.ProgramFiles || "", "Inno Setup 6", "ISCC.exe")
].filter(Boolean);

const compiler = candidates.find((candidate) => {
  if (candidate === "ISCC" || candidate === "ISCC.exe") {
    const result = spawnSync(candidate, ["/?"], { stdio: "ignore", shell: true });
    return result.status === 0;
  }

  return fs.existsSync(candidate);
});

if (!compiler) {
  console.error("Inno Setup compiler was not found.");
  console.error("Install Inno Setup 6 or add ISCC.exe to PATH, then run npm run build again.");
  process.exit(1);
}

const result = spawnSync(compiler, [`/DWinUnpackedDir=${unpackedDir}`, scriptPath], {
  cwd: root,
  stdio: "inherit",
  shell: compiler === "ISCC" || compiler === "ISCC.exe"
});

process.exit(result.status || 0);
