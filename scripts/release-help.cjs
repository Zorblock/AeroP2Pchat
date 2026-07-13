const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
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
  if (lowerName.endsWith(".exe")) {
    return { description: "Windows 10/11 installer", download: true };
  }
  if (lowerName.endsWith(".appimage")) {
    return { description: "Linux portable app · automatic updates", download: true };
  }
  if (lowerName.endsWith(".deb")) {
    return { description: "Debian / Ubuntu package", download: true };
  }
  if (lowerName.endsWith(".rpm")) {
    return { description: "Fedora / RHEL package", download: true };
  }
  if (lowerName.endsWith(".apk")) {
    return { description: "Android direct-install package", download: true };
  }
  if (lowerName === "latest.yml") {
    return { description: "Windows automatic-update metadata", download: false };
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
        `| \`${entry.name}\` | ${entry.description} | ${formatFileSize(entry.size)} |`,
    )
    .join("\n");
  const metadataRows = metadata
    .map(
      (entry) => `| \`${entry.name}\` | ${entry.description} | ${formatFileSize(entry.size)} |`)
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
    "- **Microsoft Store** updates are delivered separately after Store certification.",
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
    `\n${colored("GITHUB UPLOADS", color.bold, color.cyan)} ${colored(`(${files.length} files, ${formatFileSize(totalBytes)})`, color.dim)}`,
  );

  for (const [index, filePath] of files.entries()) {
    const size = fs.statSync(filePath).size;
    const startedAt = Date.now();
    console.log(
      `${colored(`[${index + 1}/${files.length}]`, color.bold, color.cyan)} Uploading ${path.basename(filePath)} ${colored(`(${formatFileSize(size)})`, color.dim)}`,
    );
    run("gh", ["release", "upload", tag, filePath]);
    uploadedBytes += size;
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    const percentage = Math.round((uploadedBytes / totalBytes) * 100);
    console.log(
      `${colored("  ✓ Uploaded", color.green)} ${colored(`${percentage}% total · ${formatFileSize(uploadedBytes)} / ${formatFileSize(totalBytes)} · ${seconds}s`, color.dim)}`,
    );
  }
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
  const normalizedPath = absolutePath.replace(/\\/g, "/");
  const url =
    process.platform === "win32"
      ? `command:revealFileInOS?${encodeURIComponent(
          JSON.stringify([{ scheme: "file", path: `/${normalizedPath}` }]),
        )}`
      : `file:///${normalizedPath}`;
  return `\u001b]8;;${url}\u0007${absolutePath}\u001b]8;;\u0007`;
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

function printArtifact(label, filePath, note, styles) {
  console.log(`  ${colored(label, color.bold, ...styles)}`);
  console.log(`  ${terminalLink(filePath)}`);
  console.log(`  ${colored(note, color.dim)}`);
  if (process.platform === "win32") {
    console.log(
      `  ${colored("Ctrl+click: Explorer opens with this file selected. Fallback:", color.dim)} explorer.exe /select,"${path.resolve(filePath)}"`,
    );
  }
}

function printArtifactLinks(releaseFiles) {
  const storeFiles = collectStoreFiles();
  const findReleaseFile = (extension) =>
    releaseFiles.find((filePath) => filePath.toLowerCase().endsWith(extension));
  const findStoreFile = (extension) =>
    storeFiles.find((filePath) => filePath.toLowerCase().endsWith(extension));

  console.log(`\n${colored("════════════ RELEASE FILES ════════════", color.bold, color.cyan)}`);
  console.log(colored("Click a path to open the file in Explorer.", color.dim));

  const appx = findStoreFile(".appx");
  if (appx) {
    console.log(`\n${colored("MICROSOFT STORE — ACTION REQUIRED", color.bold, color.yellow)}`);
    printArtifact(
      "UPLOAD THIS .APPX TO PARTNER CENTER",
      appx,
      "Partner Center → submission → Packages → upload. Do not upload the .msix copy.",
      [color.yellow],
    );
  }

  const windows = findReleaseFile(".exe");
  if (windows) {
    console.log(`\n${colored("WINDOWS DOWNLOAD", color.bold, color.green)}`);
    printArtifact(
      "Windows installer (.exe)",
      windows,
      "Already included in the GitHub release. This is the normal direct download.",
      [color.green],
    );
  }

  const appImage = findReleaseFile(".appimage");
  const deb = findReleaseFile(".deb");
  const rpm = findReleaseFile(".rpm");
  if (appImage || deb || rpm) {
    console.log(`\n${colored("LINUX DOWNLOADS", color.bold, color.magenta)}`);
    if (appImage) {
      printArtifact(
        "AppImage (recommended)",
        appImage,
        "Already included in the GitHub release. Supports the app's automatic updates.",
        [color.magenta],
      );
    }
    if (deb) {
      printArtifact(
        "Debian/Ubuntu package (.deb)",
        deb,
        "Already included in the GitHub release. Manual package-manager install.",
        [color.magenta],
      );
    }
    if (rpm) {
      printArtifact(
        "Fedora/RHEL package (.rpm)",
        rpm,
        "Already included in the GitHub release. Manual package-manager install.",
        [color.magenta],
      );
    }
  }

  const apk = findReleaseFile(".apk");
  if (apk) {
    console.log(`\n${colored("ANDROID DOWNLOAD", color.bold, color.cyan)}`);
    printArtifact(
      "Android package (.apk)",
      apk,
      "Already included in the GitHub release. Use this for direct Android downloads.",
      [color.cyan],
    );
  }

  const metadataFiles = releaseFiles.filter((filePath) =>
    /(?:latest\.yml|update_manifest_.*\.json)$/i.test(path.basename(filePath)),
  );
  if (metadataFiles.length > 0) {
    console.log(`\n${colored("UPDATE METADATA — DO NOT UPLOAD MANUALLY", color.bold, color.dim)}`);
    for (const filePath of metadataFiles) {
      console.log(`  ${path.basename(filePath)} ${colored("(used by the automatic updater)", color.dim)}`);
    }
  }

  const msix = findStoreFile(".msix");
  if (msix) {
    console.log(`\n${colored("Store .msix copy", color.dim)} ${colored("not needed for the manual Partner Center upload", color.dim)}`);
  }
}

function buildLinuxWithDocker(version) {
  run("node", ["scripts/build-linux-docker.cjs", `--version=${version}`]);

  const linuxManifest = path.join(releaseDir, "update_manifest_linux.json");
  if (!fs.existsSync(linuxManifest)) {
    throw new Error("The Docker Linux build did not provide update_manifest_linux.json.");
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
    ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", notificationSound],
    { cwd: root, stdio: "ignore" },
  );

  if (result.status !== 0) {
    console.log(`Release ${tag} completed, but Windows could not play the completion sound.`);
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
  let githubReleaseCreated = false;

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

    // 4. Build Linux locally in Docker, keeping the other release files intact.
    buildLinuxWithDocker(nextVersion);
    run("node", [
      "scripts/ci-append-linux-latest.cjs",
      "dist/release/latest.yml",
      "dist/release",
    ]);

    // 5. Publish only after every local build succeeded.
    run("git", ["add", "-A"]);
    if (hasStagedChanges()) {
      run("git", ["commit", "-m", `chore: release ${tag}`]);
      commitCreated = true;
    } else {
      console.log("No file changes to commit.");
    }

    run("git", ["push", "-u", "origin", branch]);
    // 6. Publish the finished desktop and mobile downloads before the Store submission.
    run("git", ["tag", tag]);
    run("git", ["push", "origin", tag]);

    const releaseFiles = collectReleaseFiles();
    run("gh", [
      "release",
      "create",
      tag,
      "--title",
      `Aero P2P Chat ${tag}`,
      "--generate-notes",
      "--notes",
      createReleaseNotes(tag, releaseFiles),
    ]);
    githubReleaseCreated = true;
    uploadReleaseFiles(tag, releaseFiles);
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
    notifyReleaseComplete(tag);
  } catch (err) {
    console.error(`\n❌ Release process failed: ${err.message || err}`);
    if (!commitCreated) {
      console.log("Rolling back the local version bump...");
      fs.writeFileSync(packagePath, originalPkg, "utf8");
      if (originalLock) {
        fs.writeFileSync(lockPath, originalLock, "utf8");
      }
    } else if (githubReleaseCreated) {
      console.log(
        "The GitHub release was created, but one or more asset uploads may need to be retried manually.",
      );
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
