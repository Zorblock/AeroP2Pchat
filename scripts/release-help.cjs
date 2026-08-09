const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const updatePolicyPath = path.join(root, "update-policy.json");
const config = require("../config.json");
const buildArtifactsDir = path.join(root, "dist", "build", "artifacts");
const releaseDir = path.join(root, "dist", "release");

function isWindowsBuildLock(error) {
  return (
    process.platform === "win32" &&
    ["EBUSY", "EPERM", "EACCES"].includes(error.code)
  );
}

function resetBuildStaging() {
  const buildDir = path.join(root, "dist", "build");

  try {
    fs.rmSync(buildDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  } catch (error) {
    if (!isWindowsBuildLock(error)) throw error;

    console.warn(
      "Build directory is locked by Windows; preserving locked intermediates and resetting release artifacts.",
    );
    fs.rmSync(buildArtifactsDir, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 200,
    });
  }

  fs.mkdirSync(buildArtifactsDir, { recursive: true });
}

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

function isVersion(value) {
  return /^\d+\.\d+\.\d+$/.test(String(value || ""));
}

function readUpdatePolicy() {
  if (!fs.existsSync(updatePolicyPath)) {
    return { minimumVersion: "" };
  }
  const policy = readJson(updatePolicyPath);
  const minimumVersion = String(policy.minimumVersion || "").trim();
  if (minimumVersion && !isVersion(minimumVersion)) {
    throw new Error("update-policy.json minimumVersion must be x.y.z or empty.");
  }
  return { minimumVersion };
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
    else if (arg === "--important") options.important = true;
    else if (arg === "--clear-important") options.clearImportant = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg.startsWith("--version=")) {
      options.version = arg.slice("--version=".length).replace(/^v/, "");
      options.bump = "none";
    } else {
      throw new Error(`Unknown release option: ${arg}`);
    }
  }

  if (options.important && options.clearImportant) {
    throw new Error("Use either --important or --clear-important, not both.");
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

function isLocalOnlyReleaseFile(filePath) {
  const name = path.basename(filePath);
  return (
    name === config.release.chromeExtensionAsset ||
    name === config.release.windowsStoreAppxAsset
  );
}

function getGitHubReleaseFiles(files) {
  return files.filter((filePath) => !isLocalOnlyReleaseFile(filePath));
}

function formatFileSize(bytes) {
  const megabytes = bytes / 1024 / 1024;
  return `${megabytes.toFixed(megabytes >= 100 ? 0 : 1)} MB`;
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function describeReleaseFile(filePath) {
  const name = path.basename(filePath);
  const lowerName = name.toLowerCase();
  if (name === config.release.windowsOnlineInstallerAsset) {
    return {
      description:
        "Windows online installer · always downloads the latest version",
      download: true,
    };
  }
  if (lowerName.endsWith(".exe")) {
    return { description: "Windows 10/11 installer", download: true };
  }
  if (lowerName.endsWith(".appimage")) {
    return {
      description: "Linux portable app · automatic updates",
      download: true,
    };
  }
  if (lowerName.endsWith(".apk")) {
    return { description: "Android direct-install package", download: true };
  }
  if (name === config.release.windowsStoreAppxAsset) {
    return {
      description: "Microsoft Store submission package (local only)",
      download: false,
    };
  }
  if (name === config.release.chromeExtensionAsset) {
    return {
      description: "Chrome extension package (local only)",
      download: false,
    };
  }
  if (lowerName === "latest.yml") {
    return {
      description: "Windows automatic-update metadata",
      download: false,
    };
  }
  if (lowerName === "update_manifest_linux.json") {
    return { description: "Linux automatic-update metadata", download: false };
  }
  if (lowerName === "update_manifest_windows.json") {
    return { description: "Windows release metadata", download: false };
  }
  return { description: "Release file", download: false };
}

function createReleaseNotes(tag, files) {
  const entries = files.map((filePath) => ({
    filePath,
    name: path.basename(filePath),
    size: fs.statSync(filePath).size,
    checksum: sha256(filePath),
    ...describeReleaseFile(filePath),
  }));
  const downloads = entries.filter((entry) => entry.download);
  const metadata = entries.filter((entry) => !entry.download);
  const downloadRows = downloads
    .map(
      (entry) =>
        `| \`${entry.name}\` | ${entry.description} | ${formatFileSize(
          entry.size,
        )} |`,
    )
    .join("\n");
  const metadataRows = metadata
    .map(
      (entry) =>
        `| \`${entry.name}\` | ${entry.description} | ${formatFileSize(
          entry.size,
        )} |`,
    )
    .join("\n");
  const checksums = entries
    .map((entry) => `${entry.checksum}  ${entry.name}`)
    .join("\n");

  return [
    `## Aero P2P Chat ${tag}`,
    "",
    "### Downloads",
    "| File | Purpose | Size |",
    "| --- | --- | ---: |",
    downloadRows,
    "",
    "- **Windows** and **Linux AppImage** receive in-app automatic updates.",
    metadata.length > 0 ? "" : "",
    metadata.length > 0 ? "### Update metadata" : "",
    metadata.length > 0 ? "| File | Purpose | Size |" : "",
    metadata.length > 0 ? "| --- | --- | ---: |" : "",
    metadataRows,
    "",
    "### File integrity",
    "Verify a downloaded file with its SHA-256 checksum:",
    "",
    "<details>",
    "<summary>Show SHA-256 checksums</summary>",
    "",
    "```text",
    checksums,
    "```",
    "",
    "</details>",
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");
}

function uploadReleaseFiles(tag, files) {
  const totalBytes = files.reduce(
    (total, filePath) => total + fs.statSync(filePath).size,
    0,
  );
  let uploadedBytes = 0;

  console.log(
    `\n${colored("GITHUB UPLOADS", color.bold, color.cyan)} ${colored(
      `(${files.length} files, ${formatFileSize(totalBytes)})`,
      color.dim,
    )}`,
  );

  for (const [index, filePath] of files.entries()) {
    const size = fs.statSync(filePath).size;
    const startedAt = Date.now();
    console.log(
      `${colored(
        `[${index + 1}/${files.length}]`,
        color.bold,
        color.cyan,
      )} Uploading ${path.basename(filePath)} ${colored(
        `(${formatFileSize(size)})`,
        color.dim,
      )}`,
    );
    run("gh", ["release", "upload", tag, filePath]);
    uploadedBytes += size;
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    const percentage = Math.round((uploadedBytes / totalBytes) * 100);
    console.log(
      `${colored("  ✓ Uploaded", color.green)} ${colored(
        `${percentage}% total · ${formatFileSize(
          uploadedBytes,
        )} / ${formatFileSize(totalBytes)} · ${seconds}s`,
        color.dim,
      )}`,
    );
  }
}

function terminalFolderLink(filePath) {
  const folderPath = path.dirname(path.resolve(filePath));
  const normalizedPath = folderPath.replace(/\\/g, "/");
  const url = `file:///${normalizedPath}`;
  return `\u001b]8;;${url}\u0007Open containing folder\u001b]8;;\u0007`;
}

function revealInExplorer(filePath) {
  if (process.platform !== "win32" || !process.stdout.isTTY) return;

  const child = spawnSync(
    "explorer.exe",
    ["/select,", path.resolve(filePath)],
    { detached: true, stdio: "ignore", windowsHide: false },
  );
  // Explorer may return before it has displayed the selection. It is a
  // convenience only, so the printed folder link remains the fallback.
  if (child.error) {
    console.warn("Could not open Explorer automatically.");
  }
}

const color = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  magenta: "\u001b[35m",
  dim: "\u001b[2m",
};

function colored(value, ...styles) {
  return `${styles.join("")}${value}${color.reset}`;
}

function printArtifact(label, filePath, status, styles) {
  console.log(
    `  ${colored(`[${status}]`, color.bold, ...styles)} ${label}: ${path.basename(filePath)}`,
  );
  console.log(`    ${colored(terminalFolderLink(filePath), color.dim)}`);
}

function printReleaseSummary(
  releaseFiles,
  chromeExtensionPublished,
  virusTotalSubmitted,
) {
  const findReleaseFile = (extension) =>
    releaseFiles.find((filePath) => filePath.toLowerCase().endsWith(extension));

  console.log(
    `\n${colored(
      "════════════ RELEASE FILES ════════════",
      color.bold,
      color.cyan,
    )}`,
  );
  console.log("Status: [OK] GitHub release published");
  console.log(
    `Chrome: ${chromeExtensionPublished ? "[OK] uploaded automatically" : "[MANUAL] ZIP must be uploaded manually"}`,
  );
  console.log(
    `VirusTotal: ${virusTotalSubmitted ? "[OK] submitted" : "[SKIPPED] submit manually if needed"}`,
  );
  console.log("Files:");

  const windows = findReleaseFile(".exe");
  if (windows) {
    printArtifact(
      "Windows installer",
      windows,
      "GITHUB",
      [color.green],
    );
  }

  const storePackage = releaseFiles.find(
    (filePath) => path.basename(filePath) === config.release.windowsStoreAppxAsset,
  );
  if (storePackage) {
    printArtifact(
      "Microsoft Store package",
      storePackage,
      "MANUAL",
      [color.green],
    );
  }

  const appImage = findReleaseFile(".appimage");
  if (appImage) {
    printArtifact(
      "AppImage",
      appImage,
      "GITHUB",
      [color.magenta],
    );
  }

  const chromeExtension = releaseFiles.find(
    (filePath) => path.basename(filePath) === config.release.chromeExtensionAsset,
  );
  if (chromeExtension) {
    printArtifact(
      "Chrome extension",
      chromeExtension,
      chromeExtensionPublished ? "UPLOADED" : "MANUAL",
      [color.yellow],
    );
  }

  const apk = findReleaseFile(".apk");
  if (apk) {
    printArtifact(
      "Android package",
      apk,
      "GITHUB",
      [color.cyan],
    );
  }

  const metadataFiles = releaseFiles.filter((filePath) =>
    /(?:latest\.yml|update_manifest_.*\.json)$/i.test(path.basename(filePath)),
  );
  if (metadataFiles.length > 0) {
    console.log(
      `\n${colored(
        "UPDATE METADATA — DO NOT UPLOAD MANUALLY",
        color.bold,
        color.dim,
      )}`,
    );
    console.log(
      `  ${colored("[AUTO-UPDATE]", color.bold, color.dim)} ${metadataFiles.map((filePath) => path.basename(filePath)).join(", ")}`,
    );
  }
}

function buildLinuxWithDocker(version) {
  run("node", ["scripts/build-linux-docker.cjs", `--version=${version}`]);

  const linuxManifest = path.join(
    buildArtifactsDir,
    "update_manifest_linux.json",
  );
  if (!fs.existsSync(linuxManifest)) {
    throw new Error(
      "The Docker Linux build did not provide update_manifest_linux.json.",
    );
  }
}

function notifyReleaseComplete(tag) {
  if (process.platform !== "win32") return;

  const notificationSound = [
    "[System.Media.SystemSounds]::Exclamation.Play()",
    "Start-Sleep -Milliseconds 350",
    "[System.Media.SystemSounds]::Exclamation.Play()",
  ].join("; ");
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-WindowStyle",
      "Hidden",
      "-Command",
      notificationSound,
    ],
    { cwd: root, stdio: "ignore" },
  );

  if (result.status !== 0) {
    console.log(
      `Release ${tag} completed, but Windows could not play the completion sound.`,
    );
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
  const previousUpdatePolicy = readUpdatePolicy();
  const nextUpdatePolicy = {
    minimumVersion: options.important
      ? nextVersion
      : options.clearImportant
        ? ""
        : previousUpdatePolicy.minimumVersion,
  };

  ensureTagDoesNotExist(tag);

  console.log(`Release: ${pkgBefore.version} -> ${nextVersion}`);
  console.log(`Bump:    ${options.bump}`);
  console.log(`Branch:  ${branch}`);
  console.log(`Tag:     ${tag}`);
  console.log(
    `Minimum: ${nextUpdatePolicy.minimumVersion || "none"}${options.important ? " (required update)" : ""}`,
  );

  if (options.dryRun) {
    console.log("Dry run only. No files, commits, or tags were changed.");
    return;
  }

  // 1. Run tests first (before any version bump)
  console.log("Running tests...");
  run("npm", ["run", "test"]);
  console.log("Checking Chrome Web Store credentials...");
  run("node", ["scripts/publish-chrome-extension.cjs", "--check"]);
  console.log("Checking VirusTotal API key...");
  run("node", ["scripts/scan-virustotal.cjs", "--check-key"]);

  // Store original package files for rollback
  const originalPkg = fs.readFileSync(packagePath, "utf8");
  const originalLock = fs.existsSync(lockPath)
    ? fs.readFileSync(lockPath, "utf8")
    : null;
  const originalUpdatePolicy = fs.existsSync(updatePolicyPath)
    ? fs.readFileSync(updatePolicyPath, "utf8")
    : null;
  let commitCreated = false;
  let githubReleaseCreated = false;
  let chromeExtensionPublished = false;

  try {
    // 2. Bump version
    setPackageVersion(nextVersion);
    writeJson(updatePolicyPath, nextUpdatePolicy);

    // 3. Build every platform into dist/build/artifacts. dist/release stays
    // untouched until every local build and update manifest has succeeded.
    resetBuildStaging();
    run("node", [
      "scripts/ci-build-release.cjs",
      "--platform=windows",
      `--version=${nextVersion}`,
      "--preserve-build",
    ]);
    run("node", ["scripts/build-android.cjs"]);
    run("node", ["scripts/build-chrome-extension.cjs"]);
    run("node", [
      "scripts/ci-create-latest.cjs",
      "dist/build/artifacts",
      `--minimum-version=${nextUpdatePolicy.minimumVersion}`,
    ]);

    // 4. Docker adds the Linux candidate to the same build staging directory.
    buildLinuxWithDocker(nextVersion);
    run("node", [
      "scripts/ci-append-linux-latest.cjs",
      "dist/build/artifacts/latest.yml",
      "dist/build/artifacts",
    ]);
    run("node", ["scripts/promote-release-artifacts.cjs"]);

    // 5. The extension is published through the Chrome Web Store, never as a
    // GitHub release download. Its upload must not block the desktop and
    // mobile release: the same ZIP can be uploaded manually if necessary.
    try {
      run("node", ["scripts/publish-chrome-extension.cjs"]);
      chromeExtensionPublished = true;
    } catch (error) {
      console.warn(
        `Chrome Web Store upload failed: ${error.message || error}`,
      );
      console.warn(
        "The release will continue. Upload dist/release/Aero-P2P-Chat-Chrome-Extension.zip manually in the Chrome Web Store Developer Dashboard.",
      );
    }

    // 6. Publish only after every local build has been promoted successfully.
    run("git", ["add", "-A"]);
    if (hasStagedChanges()) {
      run("git", ["commit", "-m", `chore: release ${tag}`]);
      commitCreated = true;
    } else {
      console.log("No file changes to commit.");
    }

    run("git", ["push", "-u", "origin", branch]);
    // 7. Publish the finished desktop and mobile downloads before the Store submission.
    run("git", ["tag", tag]);
    run("git", ["push", "origin", tag]);

    const releaseFiles = collectReleaseFiles();
    const githubReleaseFiles = getGitHubReleaseFiles(releaseFiles);
    run("gh", [
      "release",
      "create",
      tag,
      "--title",
      `Aero P2P Chat ${tag}`,
      "--generate-notes",
      "--notes",
      createReleaseNotes(tag, githubReleaseFiles),
    ]);
    githubReleaseCreated = true;
    uploadReleaseFiles(tag, githubReleaseFiles);

    // VirusTotal submissions are deliberately last: the public releases are
    // already available, while the reports populate asynchronously afterwards.
    console.log("Submitting public VirusTotal scans...");
    let virusTotalSubmitted = false;
    try {
      run("node", ["scripts/scan-virustotal.cjs", "--submit-only"]);
      virusTotalSubmitted = true;
    } catch (error) {
      console.warn(
        `VirusTotal upload could not be completed: ${error.message || error}`,
      );
      console.warn("The release is already published; retry with npm run scan:virustotal:submit.");
    }

    printReleaseSummary(
      releaseFiles,
      chromeExtensionPublished,
      virusTotalSubmitted,
    );
    notifyReleaseComplete(tag);
  } catch (err) {
    console.error(`\n❌ Release process failed: ${err.message || err}`);
    if (!commitCreated) {
      console.log("Rolling back the local version bump...");
      fs.writeFileSync(packagePath, originalPkg, "utf8");
      if (originalLock) {
        fs.writeFileSync(lockPath, originalLock, "utf8");
      }
      if (originalUpdatePolicy) {
        fs.writeFileSync(updatePolicyPath, originalUpdatePolicy, "utf8");
      } else {
        fs.rmSync(updatePolicyPath, { force: true });
      }
    } else if (githubReleaseCreated) {
      console.log(
        "The GitHub release was created, but one or more asset uploads may need to be retried manually.",
      );
    } else {
      console.log(
        "The source commit was pushed so GitHub could build Linux, but no GitHub release was created.",
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
