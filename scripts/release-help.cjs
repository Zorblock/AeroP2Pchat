const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");

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
    bump: "patch",
    dryRun: process.env.npm_config_dry_run === "true",
    local: process.env.npm_config_workflow === "true" ? false : true,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--patch") options.bump = "patch";
    else if (arg === "--minor") options.bump = "minor";
    else if (arg === "--major") options.bump = "major";
    else if (arg === "--no-bump") options.bump = "none";
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--workflow") options.local = false;
    else if (arg === "--local") options.local = true;
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
  } else {
    patch += 1;
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
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    stdio: "ignore",
    timeout: 30000,
  });
  if (remote.error) {
    throw new Error(`Could not check remote tag ${tag}: ${remote.error.message}`);
  }
  if (remote.status === 0) {
    throw new Error(`Tag ${tag} already exists on origin.`);
  }
}

function currentBuildPlatform() {
  if (process.platform === "win32") return "windows";
  if (process.platform === "linux") return "linux";
  if (process.platform === "darwin") return "macos";
  throw new Error(`Unsupported release platform: ${process.platform}`);
}

function ensureLocalReleaseTools(platform) {
  run("gh", ["--version"], { capture: true });
}

function buildLocalRelease(version, platform) {
  ensureLocalReleaseTools(platform);

  run("node", [
    "scripts/ci-build-release.cjs",
    `--platform=${platform}`,
    `--version=${version}`,
  ]);
  run("node", ["scripts/ci-create-latest.cjs", "dist/release"]);

  const releaseFiles = fs
    .readdirSync(path.join(root, "dist", "release"))
    .filter((name) => fs.statSync(path.join(root, "dist", "release", name)).isFile())
    .map((name) => path.join("dist", "release", name));

  if (releaseFiles.length === 0) {
    throw new Error("No local release files were created in dist/release.");
  }

  return releaseFiles;
}

function uploadLocalRelease(tag, releaseFiles) {
  run("gh", [
    "release",
    "create",
    tag,
    ...releaseFiles,
    "--title",
    tag,
    "--notes",
    `Aero P2P Chat ${tag}`,
  ]);
}

function startWorkflowRelease(tag) {
  run("gh", ["workflow", "run", "cd.yml", "--ref", tag]);
}

function hasStagedChanges() {
  const result = spawnSync("git", ["diff", "--cached", "--quiet"], {
    cwd: root,
    stdio: "ignore",
  });
  return result.status !== 0;
}

function main() {
  const options = parseArgs();
  const branch = ensureGitRepository();
  const pkgBefore = readJson(packagePath);
  const nextVersion = options.version || bumpVersion(pkgBefore.version, options.bump);
  const tag = `v${nextVersion}`;
  const platform = currentBuildPlatform();

  ensureTagDoesNotExist(tag);

  console.log(`Release: ${pkgBefore.version} -> ${nextVersion}`);
  console.log(`Branch:  ${branch}`);
  console.log(`Tag:     ${tag}`);
  console.log(
    options.local
      ? `Mode:    local ${platform} build + GitHub release upload`
      : "Mode:    GitHub Actions workflow build",
  );

  if (options.dryRun) {
    console.log("Dry run only. No files, commits, or tags were changed.");
    return;
  }

  setPackageVersion(nextVersion);

  run("npm", ["run", "test"]);

  run("git", ["add", "-A"]);
  if (hasStagedChanges()) {
    run("git", ["commit", "-m", `chore: release ${tag} [skip ci]`]);
  } else {
    console.log("No file changes to commit.");
  }

  if (options.local) {
    var releaseFiles = buildLocalRelease(nextVersion, platform);
  }

  run("git", ["push", "-u", "origin", branch]);
  run("git", ["tag", tag]);
  run("git", ["push", "origin", tag]);

  if (options.local) {
    uploadLocalRelease(tag, releaseFiles);
  } else {
    startWorkflowRelease(tag);
  }

  console.log("");
  if (options.local) {
    console.log(`Release ${tag} was built locally and uploaded to GitHub.`);
  } else {
    console.log(`Release ${tag} started on GitHub Actions.`);
    console.log("build.yml and cd.yml build the release packages on GitHub Actions.");
  }
}

try {
  main();
} catch (error) {
  console.error("");
  console.error(`Release failed: ${error.message || error}`);
  process.exit(1);
}
