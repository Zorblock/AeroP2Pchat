const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const cargoPath = path.join(root, "src-tauri", "Cargo.toml");
const cargoLockPath = path.join(root, "src-tauri", "Cargo.lock");
const tauriConfigPath = path.join(root, "src-tauri", "tauri.conf.json");
const releaseWorkflow = "release.yml";
const versionFiles = [
  "package.json",
  "package-lock.json",
  "src-tauri/Cargo.toml",
  "src-tauri/Cargo.lock",
  "src-tauri/tauri.conf.json",
];

const colorsEnabled = process.stdout.isTTY && process.env.NO_COLOR !== "1";
const color = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

function paint(value, tone) {
  return colorsEnabled ? `${color[tone]}${value}${color.reset}` : value;
}

function info(message) {
  console.log(`${paint("info", "cyan")} ${message}`);
}

function ok(message) {
  console.log(`${paint("ok", "green")} ${message}`);
}

function warn(message) {
  console.log(`${paint("warn", "yellow")} ${message}`);
}

function fail(message) {
  console.error(`${paint("fail", "red")} ${message}`);
}

function commandForSpawn(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "npx") return `${command}.cmd`;
  return command;
}

function run(command, args, options = {}) {
  const label = `${command} ${args.join(" ")}`;
  console.log(`${paint(">", "dim")} ${label}`);
  const result = spawnSync(commandForSpawn(command), args, {
    cwd: root,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: options.capture ? "utf8" : undefined,
    shell: process.platform === "win32" && (command === "npm" || command === "npx"),
  });

  if (result.error) {
    throw new Error(`${label} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const output = options.capture
      ? `${result.stdout || ""}${result.stderr || ""}`.trim()
      : "";
    throw new Error(`${label} failed.${output ? `\n${output}` : ""}`);
  }

  return options.capture ? String(result.stdout || "").trim() : "";
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function parseArgs() {
  const options = {
    bump: process.env.npm_config_patch === "true" ? "patch" : "minor",
    dryRun: process.env.npm_config_dry_run === "true",
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--patch" || arg === "-patch") options.bump = "patch";
    else if (arg === "--minor") options.bump = "minor";
    else if (arg === "--major") options.bump = "major";
    else if (arg === "--no-bump") options.bump = "none";
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg.startsWith("--version=")) {
      options.version = arg.slice("--version=".length).replace(/^v/, "");
      options.bump = "none";
    } else {
      throw new Error(`Unknown release option: ${arg}`);
    }
  }

  return options;
}

function bumpVersion(version, bump) {
  if (bump === "none") return version;
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Version ${version} must be semver x.y.z.`);

  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);

  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else if (bump === "patch") {
    patch += 1;
  } else {
    throw new Error(`Unknown version bump: ${bump}`);
  }

  return `${major}.${minor}.${patch}`;
}

function updateCargoLockVersion(version) {
  if (!fs.existsSync(cargoLockPath)) return;

  const text = fs.readFileSync(cargoLockPath, "utf8");
  const next = text.replace(
    /(\[\[package\]\]\r?\nname = "aerop2p"\r?\nversion = ")[^"]+(")/,
    `$1${version}$2`,
  );
  fs.writeFileSync(cargoLockPath, next, "utf8");
}

function setVersion(version) {
  const pkg = readJson(packagePath);
  pkg.version = version;
  writeJson(packagePath, pkg);

  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath);
    lock.version = version;
    if (lock.packages && lock.packages[""]) lock.packages[""].version = version;
    writeJson(lockPath, lock);
  }

  const tauriConfig = readJson(tauriConfigPath);
  tauriConfig.version = version;
  writeJson(tauriConfigPath, tauriConfig);

  const cargoToml = fs.readFileSync(cargoPath, "utf8");
  fs.writeFileSync(
    cargoPath,
    cargoToml.replace(/^version\s*=\s*"[^"]+"/m, `version = "${version}"`),
    "utf8",
  );
  updateCargoLockVersion(version);
}

function gitStatusPorcelain() {
  return run("git", ["status", "--porcelain=v1", "-uall"], { capture: true })
    .split(/\r?\n/)
    .filter(Boolean);
}

function statusPath(line) {
  return line.slice(3).replace(/^"|"$/g, "").replace(/\\/g, "/");
}

function ensureGitRepository() {
  run("git", ["rev-parse", "--is-inside-work-tree"], { capture: true });
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], { capture: true });
  if (!branch || branch === "HEAD") {
    throw new Error("Release must run from a named Git branch, not detached HEAD.");
  }
  return branch;
}

function ensureReleaseWorkflowTrackedOrPresent() {
  const workflowPath = path.join(root, ".github", "workflows", releaseWorkflow);
  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Missing .github/workflows/${releaseWorkflow}.`);
  }
}

function ensureNoPreexistingVersionFileChanges() {
  const dirtyVersionFiles = gitStatusPorcelain()
    .map(statusPath)
    .filter((file) => versionFiles.includes(file));
  if (dirtyVersionFiles.length) {
    throw new Error(
      `Release version files already have local changes: ${dirtyVersionFiles.join(", ")}. Commit or revert them first.`,
    );
  }
}

function warnAboutOtherLocalChanges() {
  const otherChanges = gitStatusPorcelain()
    .map(statusPath)
    .filter((file) => !versionFiles.includes(file));
  if (otherChanges.length) {
    warn(`Other local changes exist and will not be committed by release: ${otherChanges.join(", ")}`);
  }
}

function ensureTagDoesNotExist(tag) {
  const local = spawnSync("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], {
    cwd: root,
    stdio: "ignore",
  });
  if (local.status === 0) throw new Error(`Tag ${tag} already exists locally.`);

  const remote = spawnSync("git", ["ls-remote", "--exit-code", "--tags", "origin", tag], {
    cwd: root,
    stdio: "ignore",
  });
  if (remote.status === 0) throw new Error(`Tag ${tag} already exists on origin.`);
}

function ensureGitHubCli() {
  run("gh", ["--version"], { capture: true });
  run("gh", ["auth", "status"], { capture: true });
}

function ensureWindowsReleaseHost() {
  if (process.platform !== "win32") {
    throw new Error("npm run release must run on Windows because it builds and uploads the Windows setup locally.");
  }
}

function buildWindowsRelease(version) {
  info("Building Windows setup locally with Tauri NSIS...");
  run("node", ["scripts/ci-build-release.cjs", "--platform=windows", `--version=${version}`]);
  ok("Windows setup built.");
}

function createReleaseWithWindowsAssets(version, branch) {
  const tag = `v${version}`;
  
  info("Generating latest.yml with Windows manifest...");
  run("node", ["scripts/ci-create-latest.cjs", path.join("dist", "release")]);
  
  const setupPath = path.join("dist", "release", "Aero-P2P-Chat-Windows-Setup.exe");
  const manifestPath = path.join("dist", "release", "update_manifest_windows.json");
  const latestPath = path.join("dist", "release", "latest.yml");
  
  if (!fs.existsSync(path.join(root, setupPath))) {
    throw new Error(`Missing Windows setup: ${setupPath}`);
  }
  if (!fs.existsSync(path.join(root, manifestPath))) {
    throw new Error(`Missing Windows manifest: ${manifestPath}`);
  }

  run("gh", [
    "release",
    "create",
    tag,
    setupPath,
    manifestPath,
    latestPath,
    "--target",
    branch,
    "--title",
    tag,
    "--notes",
    `Aero P2P Chat ${tag}`,
  ]);
  ok(`Created GitHub release ${tag} with Windows setup and latest.yml.`);
}

function commitAndPushVersionFiles(version, branch) {
  run("git", ["add", ...versionFiles]);
  const staged = spawnSync("git", ["diff", "--cached", "--quiet", "--", ...versionFiles], {
    cwd: root,
    stdio: "ignore",
  });

  if (staged.status === 0) {
    warn("No version-file changes to commit.");
  } else {
    run("git", ["commit", "-m", `chore: release v${version}`, "--", ...versionFiles]);
    ok(`Committed version files for v${version}.`);
  }

  run("git", ["push", "-u", "origin", branch]);
  ok(`Pushed ${branch}.`);
}

function triggerReleaseWorkflow(version, branch) {
  run("gh", [
    "workflow",
    "run",
    releaseWorkflow,
    "--ref",
    branch,
    "--field",
    `version=${version}`,
  ]);
}

function main() {
  const options = parseArgs();
  const branch = ensureGitRepository();
  ensureReleaseWorkflowTrackedOrPresent();

  const pkgBefore = readJson(packagePath);
  const nextVersion = options.version || bumpVersion(pkgBefore.version, options.bump);
  const tag = `v${nextVersion}`;

  console.log(paint(`\nAero P2P release ${pkgBefore.version} -> ${nextVersion}`, "bold"));
  info(`Branch: ${branch}`);
  info(`Workflow: ${releaseWorkflow}`);
  info(`Release tag to be created by workflow: ${tag}`);

  ensureTagDoesNotExist(tag);

  if (options.dryRun) {
    ok("Dry run complete. No files changed, no push, no workflow trigger.");
    return;
  }

  ensureNoPreexistingVersionFileChanges();
  warnAboutOtherLocalChanges();
  ensureGitHubCli();
  ensureWindowsReleaseHost();

  setVersion(nextVersion);
  ok("Updated package, Cargo, and Tauri versions.");

  run("npm", ["run", "test"]);
  ok("Local checks passed.");

  commitAndPushVersionFiles(nextVersion, branch);
  buildWindowsRelease(nextVersion);
  createReleaseWithWindowsAssets(nextVersion, branch);
  triggerReleaseWorkflow(nextVersion, branch);

  ok(`Release ${tag} workflow_dispatch started.`);
}

try {
  main();
} catch (error) {
  console.error("");
  fail(error.message || String(error));
  process.exit(1);
}
