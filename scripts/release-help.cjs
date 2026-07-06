const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const cargoPath = path.join(root, "src-tauri", "Cargo.toml");
const tauriConfigPath = path.join(root, "src-tauri", "tauri.conf.json");

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(" ")}`);
  const isWindowsNpm = process.platform === "win32" && command === "npm";
  const executable = isWindowsNpm ? process.env.ComSpec || "cmd.exe" : command;
  const finalArgs = isWindowsNpm
    ? ["/d", "/s", "/c", "npm.cmd", ...args]
    : args;
  const result = spawnSync(executable, finalArgs, {
    cwd: root,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: options.capture ? "utf8" : undefined,
  });

  if (result.status !== 0) {
    const output = options.capture
      ? `${result.stdout || ""}${result.stderr || ""}`.trim()
      : "";
    throw new Error(
      `${command} ${args.join(" ")} failed.${output ? `\n${output}` : ""}`,
    );
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
  if (!match) {
    throw new Error(`Version ${version} must be semver x.y.z.`);
  }

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

function setPackageVersion(version) {
  const pkg = readJson(packagePath);
  pkg.version = version;
  writeJson(packagePath, pkg);

  if (fs.existsSync(lockPath)) {
    const lock = readJson(lockPath);
    lock.version = version;
    if (lock.packages && lock.packages[""]) {
      lock.packages[""].version = version;
    }
    writeJson(lockPath, lock);
  }

  if (fs.existsSync(tauriConfigPath)) {
    const tauriConfig = readJson(tauriConfigPath);
    tauriConfig.version = version;
    writeJson(tauriConfigPath, tauriConfig);
  }

  if (fs.existsSync(cargoPath)) {
    const cargoToml = fs.readFileSync(cargoPath, "utf8");
    fs.writeFileSync(
      cargoPath,
      cargoToml.replace(
        /^version\s*=\s*"[^"]+"/m,
        `version = "${version}"`,
      ),
      "utf8",
    );
  }
}

function ensureGitRepository() {
  run("git", ["rev-parse", "--is-inside-work-tree"], { capture: true });
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    capture: true,
  });
  if (!branch || branch === "HEAD") {
    throw new Error("Release must run from a named Git branch, not detached HEAD.");
  }
  return branch;
}

function ensureTagDoesNotExist(tag) {
  const local = spawnSync("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], {
    cwd: root,
    stdio: "ignore",
  });
  if (local.status === 0) {
    throw new Error(`Tag ${tag} already exists locally.`);
  }

  const remote = spawnSync("git", ["ls-remote", "--exit-code", "--tags", "origin", tag], {
    cwd: root,
    stdio: "ignore",
  });
  if (remote.status === 0) {
    throw new Error(`Tag ${tag} already exists on origin.`);
  }
}

function ensureGitHubCli() {
  run("gh", ["--version"], { capture: true });
}

function triggerReleaseWorkflow(version, branch) {
  run("gh", [
    "workflow",
    "run",
    "release.yml",
    "--ref",
    branch,
    "--field",
    `version=${version}`,
  ]);
}

function main() {
  const options = parseArgs();
  const branch = ensureGitRepository();
  const pkgBefore = readJson(packagePath);
  const nextVersion = options.version || bumpVersion(pkgBefore.version, options.bump);
  const tag = `v${nextVersion}`;

  ensureTagDoesNotExist(tag);

  console.log(`Release: ${pkgBefore.version} -> ${nextVersion}`);
  console.log(`Branch:  ${branch}`);
  console.log(`Tag:     ${tag}`);

  if (options.dryRun) {
    console.log("Dry run only. No files were changed and no workflow was triggered.");
    return;
  }

  ensureGitHubCli();
  setPackageVersion(nextVersion);
  run("npm", ["run", "test"]);
  triggerReleaseWorkflow(nextVersion, branch);

  console.log("");
  console.log(`Release ${tag} workflow_dispatch started on GitHub Actions.`);
  console.log("No commit, push, or tag was created locally by this script.");
}

try {
  main();
} catch (error) {
  console.error("");
  console.error(`Release failed: ${error.message || error}`);
  process.exit(1);
}
