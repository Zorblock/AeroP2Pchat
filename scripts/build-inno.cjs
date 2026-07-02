const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const scriptPath = path.join(root, "create-setup.iss");
const cliTemplateDir = path.join(root, "scripts", "windows-cli");
const cliOutputDir = path.join(root, "dist", "installer", "cli");
const markerPath = path.join(root, "dist", "build", "latest-win-dir.txt");
const buildRoot = path.join(root, "dist", "build");
const packageJson = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);
const projectConfig = JSON.parse(
  fs.readFileSync(path.join(root, "config.json"), "utf8"),
);
const packageAuthor =
  packageJson.author && typeof packageJson.author === "object"
    ? packageJson.author.name
    : packageJson.author;
const markerValue = fs.existsSync(markerPath)
  ? fs.readFileSync(markerPath, "utf8").trim()
  : "";
const markerUnpackedDir = markerValue ? path.resolve(root, markerValue) : "";
const markerRelativeToRoot = markerUnpackedDir
  ? path.relative(root, markerUnpackedDir)
  : "";
const markerIsInsideRoot =
  markerRelativeToRoot &&
  !markerRelativeToRoot.startsWith("..") &&
  !path.isAbsolute(markerRelativeToRoot);
const latestUnpackedDir = fs.existsSync(buildRoot)
  ? fs
      .readdirSync(buildRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(buildRoot, entry.name, "win-unpacked"))
      .filter((candidate) => fs.existsSync(candidate))
      .sort(
        (left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs,
      )[0]
  : "";
const unpackedDir =
  markerIsInsideRoot && fs.existsSync(markerUnpackedDir)
    ? markerUnpackedDir
    : latestUnpackedDir || path.join(buildRoot, "win-unpacked");
const programFilesX86 = process.env["ProgramFiles(x86)"];
const programFiles = process.env.ProgramFiles;
const candidates = [
  path.join(root, ".tools", "inno", "ISCC.exe"),
  "ISCC.exe",
  "ISCC",
  programFilesX86 ? path.join(programFilesX86, "Inno Setup 6", "ISCC.exe") : "",
  programFiles ? path.join(programFiles, "Inno Setup 6", "ISCC.exe") : "",
].filter(Boolean);

const compiler = candidates.find((candidate) => {
  if (candidate === "ISCC" || candidate === "ISCC.exe") {
    const result = spawnSync(candidate, ["/?"], {
      stdio: "ignore",
      shell: true,
    });
    return result.status === 0;
  }

  return fs.existsSync(candidate);
});

if (!compiler) {
  console.error("Inno Setup compiler was not found.");
  console.error(
    "Install Inno Setup 6 or add ISCC.exe to PATH, then run npm run build again.",
  );
  process.exit(1);
}

function renderTemplate(value, replacements) {
  return Object.entries(replacements).reduce(
    (text, [key, replacement]) => text.replaceAll(`__${key}__`, replacement),
    value,
  );
}

function writeWindowsCliTemplates() {
  const replacements = {
    APP_NAME: projectConfig.app.name,
    APP_VERSION: process.env.npm_package_version || packageJson.version,
    APP_EXE_NAME: `${projectConfig.app.name}.exe`,
    CLI_COMMAND_NAME: projectConfig.app.cliCommandName,
    REPO: projectConfig.repo,
    WINDOWS_INSTALLER_ASSET: projectConfig.release.windowsInstallerAsset,
  };

  fs.mkdirSync(cliOutputDir, { recursive: true });
  const cmdTemplate = fs.readFileSync(
    path.join(cliTemplateDir, "aerop2p.cmd"),
    "utf8",
  );
  const psTemplate = fs.readFileSync(
    path.join(cliTemplateDir, "aerop2p.ps1"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(cliOutputDir, `${projectConfig.app.cliCommandName}.cmd`),
    renderTemplate(cmdTemplate, replacements),
    "utf8",
  );
  fs.writeFileSync(
    path.join(cliOutputDir, `${projectConfig.app.cliCommandName}.ps1`),
    renderTemplate(psTemplate, replacements),
    "utf8",
  );
}

writeWindowsCliTemplates();

const result = spawnSync(
  compiler,
  [`/DWinUnpackedDir=${unpackedDir}`, scriptPath],
  {
    cwd: root,
    env: {
      ...process.env,
      npm_package_version:
        process.env.npm_package_version || packageJson.version,
      AERO_APP_NAME: projectConfig.app.name,
      AERO_APP_AUTHOR: packageAuthor || projectConfig.app.name,
      AERO_APP_EXE_NAME: `${projectConfig.app.name}.exe`,
      AERO_CLI_COMMAND_NAME: projectConfig.app.cliCommandName,
      AERO_WINDOWS_SETUP_BASE_NAME: projectConfig.release.windowsSetupBaseName,
    },
    stdio: "inherit",
    shell: compiler === "ISCC" || compiler === "ISCC.exe",
  },
);

process.exit(result.status || 0);
