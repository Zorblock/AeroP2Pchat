const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const releaseDir = path.join(root, "dist", "release");

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(" ")}`);
  const isWindowsNpm =
    process.platform === "win32" &&
    (command === "npm" || command === "npx" || command === "node");
  const executable =
    isWindowsNpm && command !== "node"
      ? process.env.ComSpec || "cmd.exe"
      : command;
  const finalArgs =
    isWindowsNpm && command !== "node"
      ? ["/d", "/s", "/c", `${command}.cmd`, ...args]
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
    bump: "minor",
    dryRun: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === "--patch") options.bump = "patch";
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
    throw new Error(
      "Release must run from a named Git branch, not detached HEAD.",
    );
  }
  return branch;
}

function ensureTagDoesNotExist(tag) {
  const local = spawnSync(
    "git",
    ["rev-parse", "-q", "--verify", `refs/tags/${tag}`],
    {
      cwd: root,
      stdio: "ignore",
    },
  );
  if (local.status === 0) {
    throw new Error(`Tag ${tag} already exists locally.`);
  }

  const remote = spawnSync(
    "git",
    ["ls-remote", "--exit-code", "--tags", "origin", tag],
    {
      cwd: root,
      stdio: "ignore",
    },
  );
  if (remote.status === 0) {
    throw new Error(`Tag ${tag} already exists on origin.`);
  }
}

function ensureGhCli() {
  const result = spawnSync("gh", ["--version"], {
    cwd: root,
    stdio: "ignore",
  });
  if (result.status !== 0) {
    throw new Error(
      "gh CLI is not installed. Install it from https://cli.github.com/ and run: gh auth login",
    );
  }
}

function hasStagedChanges() {
  const result = spawnSync("git", ["diff", "--cached", "--quiet"], {
    cwd: root,
    stdio: "ignore",
  });
  return result.status !== 0;
}

function collectReleaseFiles() {
  if (!fs.existsSync(releaseDir)) {
    throw new Error(`Release directory not found: ${releaseDir}`);
  }

  const files = fs
    .readdirSync(releaseDir)
    .map((name) => path.join(releaseDir, name))
    .filter((filePath) => fs.statSync(filePath).isFile());

  if (files.length === 0) {
    throw new Error("No release artifacts found in dist/release/.");
  }

  return files;
}

function collectStoreFiles() {
  const storeDir = path.join(root, "dist", "store");
  if (!fs.existsSync(storeDir)) return [];

  return fs
    .readdirSync(storeDir)
    .map((name) => path.join(storeDir, name))
    .filter(
      (filePath) =>
        fs.statSync(filePath).isFile() && /\.(appx|msix)$/i.test(filePath),
    );
}

function terminalLink(filePath) {
  const absolutePath = path.resolve(filePath);
  const fileUrl = `file:///${absolutePath.replace(/\\/g, "/")}`;
  return `\u001b]8;;${fileUrl}\u0007${absolutePath}\u001b]8;;\u0007`;
}

function printArtifactLinks(releaseFiles) {
  const files = [...releaseFiles, ...collectStoreFiles()];
  console.log("\nBuilt files (click to open):");
  for (const filePath of files) {
    console.log(`  ${path.basename(filePath)}\n  ${terminalLink(filePath)}`);
  }
}

function wait(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function buildLinuxOnGitHub(branch, version, commitSha) {
  run("gh", [
    "workflow",
    "run",
    "build.yml",
    "--ref",
    branch,
    "-f",
    `version=${version}`,
  ]);

  let runId = "";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const output = run(
      "gh",
      [
        "run",
        "list",
        "--workflow",
        "build.yml",
        "--branch",
        branch,
        "--event",
        "workflow_dispatch",
        "--limit",
        "10",
        "--json",
        "databaseId,headSha",
      ],
      { capture: true },
    );
    const matchingRun = JSON.parse(output).find(
      (entry) => entry.headSha === commitSha,
    );
    if (matchingRun) {
      runId = String(matchingRun.databaseId);
      break;
    }
    wait(1000);
  }

  if (!runId) {
    throw new Error("GitHub did not start the Linux build workflow in time.");
  }

  console.log(`Waiting for Linux build run ${runId}...`);
  run("gh", ["run", "watch", runId, "--exit-status"]);
  run("gh", [
    "run",
    "download",
    runId,
    "--name",
    "linux-release",
    "--dir",
    releaseDir,
  ]);

  const linuxManifest = path.join(releaseDir, "update_manifest_linux.json");
  if (!fs.existsSync(linuxManifest)) {
    throw new Error("The GitHub Linux build did not provide update_manifest_linux.json.");
  }
}

function main() {
  const options = parseArgs();
  const branch = ensureGitRepository();
  ensureGhCli();
  const pkgBefore = readJson(packagePath);
  const nextVersion =
    options.version || bumpVersion(pkgBefore.version, options.bump);
  const tag = `v${nextVersion}`;

  ensureTagDoesNotExist(tag);

  console.log(`Release: ${pkgBefore.version} -> ${nextVersion}`);
  console.log(`Bump:    ${options.bump}`);
  console.log(`Branch:  ${branch}`);
  console.log(`Tag:     ${tag}`);

  if (options.dryRun) {
    console.log("Dry run only. No files, commits, or tags were changed.");
    return;
  }

  // 1. Run tests first (before any version bump)
  console.log("Running tests...");
  run("npm", ["run", "test"]);

  // Store original package files for rollback
  const originalPkg = fs.readFileSync(packagePath, "utf8");
  const originalLock = fs.existsSync(lockPath) ? fs.readFileSync(lockPath, "utf8") : null;
  let commitCreated = false;

  try {
    // 2. Bump version
    setPackageVersion(nextVersion);

    // 3. Build all local artifacts before publishing anything.
    // The Windows build cleans dist/, so Android and Store builds run afterwards.
    run("node", [
      "scripts/ci-build-release.cjs",
      "--platform=windows",
      `--version=${nextVersion}`,
    ]);
    run("node", ["scripts/build-android.cjs"]);
    run("node", ["scripts/ci-create-latest.cjs", "dist/release"]);
    run("npm", ["run", "build:store"]);
    run("npm", ["run", "build", "--prefix", ".pages"]);

    // 4. Push the source commit so GitHub can build the Linux AppImage.
    run("git", ["add", "-A"]);
    if (hasStagedChanges()) {
      run("git", ["commit", "-m", `chore: release ${tag}`]);
      commitCreated = true;
    } else {
      console.log("No file changes to commit.");
    }

    run("git", ["push", "-u", "origin", branch]);
    const commitSha = run("git", ["rev-parse", "HEAD"], { capture: true });
    buildLinuxOnGitHub(branch, nextVersion, commitSha);
    run("node", [
      "scripts/ci-append-linux-latest.cjs",
      "dist/release/latest.yml",
      "dist/release",
    ]);

    // 5. Publish the finished desktop and mobile downloads before the Store submission.
    run("git", ["tag", tag]);
    run("git", ["push", "origin", tag]);

    const releaseFiles = collectReleaseFiles();
    const ghArgs = [
      "release",
      "create",
      tag,
      "--title",
      tag,
      "--generate-notes",
      ...releaseFiles,
    ];
    run("gh", ghArgs);
    run("npm", ["run", "pages"]);

    console.log("");
    console.log(
      `Release ${tag} created on GitHub with Windows, Android, and Linux artifacts.`,
    );
    console.log(
      "Windows, Android, Linux, and Microsoft Store packages were built before publishing.",
    );
    console.log("Website deployment was triggered.");
    console.log("Upload the .appx file below manually in Partner Center.");
    printArtifactLinks(releaseFiles);
  } catch (err) {
    console.error(`\n❌ Release process failed: ${err.message || err}`);
    if (!commitCreated) {
      console.log("Rolling back the local version bump...");
      fs.writeFileSync(packagePath, originalPkg, "utf8");
      if (originalLock) {
        fs.writeFileSync(lockPath, originalLock, "utf8");
      }
    } else {
      console.log(
        "The source commit was pushed so GitHub could build Linux, but no Store or GitHub release was created.",
      );
    }
    throw err;
  }
}

try {
  main();
} catch (error) {
  console.error("");
  console.error(`Release failed: ${error.message || error}`);
  process.exit(1);
}
