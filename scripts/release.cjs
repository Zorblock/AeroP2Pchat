const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");
const packagePath = path.join(rootDir, "package.json");
const lockPath = path.join(rootDir, "package-lock.json");
const projectConfigPath = path.join(rootDir, "config.json");
const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, "utf8"));
const apiVersion = "2026-03-10";
const appName = projectConfig.app.name;
const userAgent = `${projectConfig.app.packageName}-release-script`;
const windowsUploadName = projectConfig.release.windowsInstallerAsset;
const windowsSetupBaseName = projectConfig.release.windowsSetupBaseName;
const linuxUploadName = projectConfig.release.linuxAppImageAsset;
const linuxWorkflowId = projectConfig.release.linuxWorkflow;

const useColor = process.stdout.isTTY || process.env.FORCE_COLOR;
const colorCodes = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

function color(name, value) {
  if (!useColor) return String(value);
  return `${colorCodes[name]}${value}${colorCodes.reset}`;
}

function logHeader(text) {
  console.log("");
  console.log(color("bold", color("cyan", `== ${text} ==`)));
}

function logStep(text) {
  console.log(`${color("blue", ">")} ${text}`);
}

function logSuccess(text) {
  console.log(`${color("green", "OK")} ${text}`);
}

function logInfo(label, value) {
  console.log(`${color("dim", label.padEnd(14))} ${value}`);
}

function logProgress(label, current, total, lastText) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  const barWidth = 24;
  const filled = Math.round((percent / 100) * barWidth);
  const bar = `${"#".repeat(filled)}${"-".repeat(barWidth - filled)}`;
  const text = `${label} ${color("cyan", `[${bar}]`)} ${percent.toFixed(1).padStart(5)}% ${formatBytes(current)} / ${formatBytes(total)}`;

  if (process.stdout.isTTY) {
    process.stdout.write(`\r${text}`);
    return text;
  }

  if (text !== lastText) {
    console.log(text);
  }

  return text;
}

function formatDuration(startedAt) {
  const seconds = (Date.now() - startedAt) / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = Number(bytes) || 0;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function getRepoParts(config) {
  const repoSlug = String(config.repo || "").trim();
  const [owner, repo] = repoSlug.split("/");

  if (!owner || !repo) {
    throw new Error("Missing repo in config.json. Expected format: owner/repo.");
  }

  return { owner, repo };
}

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

function restoreTextFile(filePath, content) {
  if (content === null) {
    fs.rmSync(filePath, { force: true });
    return;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

function commandForSpawn(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm" || command === "npx") return `${command}.cmd`;
  return command;
}

function run(command, args, options = {}) {
  const startedAt = Date.now();
  logStep(`${command} ${args.join(" ")}`);
  const env = { ...process.env, ...(options.env || {}) };
  delete env.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(commandForSpawn(command), args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32" && (command === "npm" || command === "npx"),
    env
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }
  logSuccess(`${command} finished in ${formatDuration(startedAt)}`);
}

function runWithRetry(command, args, options = {}) {
  const attempts = options.attempts || 3;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      run(command, args, options);
      return;
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) {
        break;
      }
      console.error(`${color("yellow", "WARN")} ${command} failed, retrying (${attempt + 1}/${attempts})...`);
      sleep(2000 * attempt);
    }
  }

  throw lastError;
}

function runCapture(command, args) {
  const result = spawnSync(commandForSpawn(command), args, {
    cwd: rootDir,
    encoding: "utf8",
    shell: false
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

function runStatus(command, args, options = {}) {
  return spawnSync(commandForSpawn(command), args, {
    cwd: rootDir,
    encoding: "utf8",
    shell: false,
    env: { ...process.env, ...(options.env || {}) }
  });
}

function isInsideGitRepo() {
  return runStatus("git", ["rev-parse", "--is-inside-work-tree"]).status === 0;
}

function resetVersionFilesFromGitIndex() {
  if (isInsideGitRepo()) {
    runStatus("git", ["reset", "--", "package.json", "package-lock.json"]);
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function rmSyncWithRetry(targetPath, { required = false } = {}) {
  const attempts = 5;
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      fs.rmSync(targetPath, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 250
      });
      return true;
    } catch (error) {
      lastError = error;
      if (!["EBUSY", "EMFILE", "ENFILE", "ENOTEMPTY", "EPERM"].includes(error.code)) {
        break;
      }
      sleep(250 * attempt);
    }
  }

  const relativePath = path.relative(rootDir, targetPath) || targetPath;
  if (required) {
    throw lastError;
  }

  console.error(`${color("yellow", "WARN")} Could not fully clean ${relativePath}: ${lastError.message}`);
  console.error(`${color("yellow", "WARN")} Continuing; close running app/windows if the build later cannot overwrite files.`);
  return false;
}

function cleanBuildOutput() {
  rmSyncWithRetry(path.join(rootDir, "out"), { required: true });
  rmSyncWithRetry(path.join(rootDir, "dist", "builder-effective-config.yaml"));
  rmSyncWithRetry(path.join(rootDir, "dist", "installer"));
  rmSyncWithRetry(path.join(rootDir, "dist", "build"));
  rmSyncWithRetry(path.join(rootDir, "dist", "linux-unpacked"));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    bump: "minor",
    draft: false,
    prerelease: false,
    linuxOnly: false
  };
  for (const arg of args) {
    if (arg === "--no-bump") options.bump = "none";
    if (arg === "--patch") options.bump = "patch";
    if (arg === "--minor") options.bump = "minor";
    if (arg === "--major") options.bump = "major";
    if (arg === "--draft") options.draft = true;
    if (arg === "--prerelease") options.prerelease = true;
    if (arg === "--linux-only") options.linuxOnly = true;
    if (arg.startsWith("--version=")) options.version = arg.slice("--version=".length);
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
  if (major !== 26) {
    major = 26;
    minor = 1;
    patch = 0;
  } else if (bump === "major") {
    minor += 1;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else if (bump === "patch") {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function updatePackageVersion(version) {
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

function fileHash(filePath, algorithm) {
  return crypto.createHash(algorithm).update(fs.readFileSync(filePath)).digest("hex");
}

function fileHashBase64(filePath, algorithm) {
  return crypto.createHash(algorithm).update(fs.readFileSync(filePath)).digest("base64");
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function parseManifestText(text) {
  const manifest = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    const match = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (!match) continue;
    let value = match[2].trim();
    if (value.startsWith("\"") && value.endsWith("\"")) {
      value = JSON.parse(value);
    } else if (/^\d+$/.test(value)) {
      value = Number(value);
    }
    manifest[match[1]] = value;
  }
  return manifest;
}

function serializeManifest(manifest) {
  const lines = [];
  for (const [key, value] of Object.entries(manifest)) {
    lines.push(typeof value === "number" ? `${key}: ${value}` : `${key}: ${yamlQuote(value)}`);
  }
  lines.push("");
  return lines.join("\n");
}

function createReleaseAssetInfo(filePath, tag, owner, repo) {
  const name = path.basename(filePath);
  const downloadUrl = `https://github.com/${owner}/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;
  return {
    name,
    url: downloadUrl,
    size: fs.statSync(filePath).size,
    sha256: fileHash(filePath, "sha256"),
    sha512: fileHashBase64(filePath, "sha512")
  };
}

function createLatestManifest({ pkg, setupPath, appImagePath, version, owner, repo }) {
  const tag = `v${version}`;
  const releaseDate = new Date().toISOString();
  const windows = createReleaseAssetInfo(setupPath, tag, owner, repo);
  const linux = appImagePath ? createReleaseAssetInfo(appImagePath, tag, owner, repo) : null;
  const manifest = [
    `version: ${yamlQuote(version)}`,
    `releaseDate: ${yamlQuote(releaseDate)}`,
    `repo: ${yamlQuote(`${owner}/${repo}`)}`,
    `path: ${yamlQuote(windows.name)}`,
    `url: ${yamlQuote(windows.url)}`,
    `sha256: ${yamlQuote(windows.sha256)}`,
    `sha512: ${yamlQuote(windows.sha512)}`,
    `size: ${windows.size}`,
    `windowsPath: ${yamlQuote(windows.name)}`,
    `windowsUrl: ${yamlQuote(windows.url)}`,
    `windowsSha256: ${yamlQuote(windows.sha256)}`,
    `windowsSha512: ${yamlQuote(windows.sha512)}`,
    `windowsSize: ${windows.size}`,
    ...(linux
      ? [
          `linuxPath: ${yamlQuote(linux.name)}`,
          `linuxUrl: ${yamlQuote(linux.url)}`,
          `linuxSha256: ${yamlQuote(linux.sha256)}`,
          `linuxSha512: ${yamlQuote(linux.sha512)}`,
          `linuxSize: ${linux.size}`
        ]
      : []),
    `productName: ${yamlQuote(appName)}`,
    ""
  ].join("\n");
  const manifestPath = path.join(rootDir, "dist", "installer", "latest.yml");
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, manifest, "utf8");
  return {
    manifestPath,
    setupName: windows.name,
    appImageName: linux && linux.name,
    tag,
    sha256: windows.sha256,
    linuxSha256: linux && linux.sha256
  };
}

function createUploadCopy(sourcePath, uploadName) {
  const uploadPath = path.join(rootDir, "dist", "installer", uploadName);
  fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
  fs.rmSync(uploadPath, { force: true });
  fs.copyFileSync(sourcePath, uploadPath);
  logSuccess(`Created upload asset ${path.relative(rootDir, uploadPath)}`);
  logInfo("Asset", `${path.relative(rootDir, uploadPath)} (${formatBytes(fs.statSync(uploadPath).size)})`);
  return uploadPath;
}

function findAppImage() {
  const distDir = path.join(rootDir, "dist");
  const appImage = fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".AppImage"))
    .map((entry) => path.join(distDir, entry.name))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs)[0];
  if (!appImage) {
    throw new Error("Linux AppImage was not found in dist.");
  }
  return appImage;
}

function getGitHubToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  return runCapture("gh", ["auth", "token"]);
}

async function githubRequest(token, url, options = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": apiVersion,
    "User-Agent": userAgent,
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data && data.message ? data.message : response.statusText;
    const error = new Error(`${response.status} ${message}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function getOrCreateRelease({ token, owner, repo, tag, version, draft, prerelease }) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  try {
    const release = await githubRequest(token, `${apiBase}/releases/tags/${encodeURIComponent(tag)}`);
    return { release, created: false };
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const release = await githubRequest(token, `${apiBase}/releases`, {
    method: "POST",
    body: JSON.stringify({
      tag_name: tag,
      name: `${appName} ${version}`,
      body: `Automated release for ${appName} ${version}.`,
      draft,
      prerelease
    })
  });
  return { release, created: true };
}

async function deleteReleaseAndTag(token, owner, repo, release, tag) {
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;
  if (release && release.url) {
    logStep(`Rollback GitHub release ${tag}`);
    await githubRequest(token, release.url, { method: "DELETE" });
    logSuccess(`Deleted release ${tag}`);
  }
  try {
    logStep(`Rollback Git tag ${tag}`);
    await githubRequest(token, `${apiBase}/git/refs/tags/${encodeURIComponent(tag)}`, { method: "DELETE" });
    logSuccess(`Deleted tag ${tag}`);
  } catch (error) {
    if (error.status !== 404) throw error;
  }
}

async function deleteExistingAsset(token, release, assetName) {
  const asset = (release.assets || []).find((entry) => entry.name === assetName);
  if (!asset) return;
  logStep(`Delete existing asset ${assetName}`);
  await githubRequest(token, asset.url, { method: "DELETE" });
  logSuccess(`Deleted ${assetName}`);
}

async function deleteUnexpectedReleaseAssets(token, release, uploadAssetNames) {
  const keep = new Set(uploadAssetNames);
  const extraAssets = (release.assets || []).filter((entry) => !keep.has(entry.name || ""));
  for (const asset of extraAssets) {
    logStep(`Delete extra release asset ${asset.name}`);
    await githubRequest(token, asset.url, { method: "DELETE" });
    logSuccess(`Deleted ${asset.name}`);
  }
}

async function getReleaseByTag(token, owner, repo, tag) {
  return githubRequest(token, `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(tag)}`);
}

async function getRepositoryDefaultBranch(token, owner, repo) {
  const data = await githubRequest(token, `https://api.github.com/repos/${owner}/${repo}`);
  return data && data.default_branch ? data.default_branch : "main";
}

async function triggerLinuxReleaseWorkflow(token, owner, repo, version) {
  const ref = process.env.GITHUB_REF_NAME || (await getRepositoryDefaultBranch(token, owner, repo));
  logStep(`Trigger Linux AppImage workflow on ${ref}`);
  await githubRequest(token, `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(linuxWorkflowId)}/dispatches`, {
    method: "POST",
    body: JSON.stringify({ ref, inputs: { version } })
  });
  logSuccess("Linux AppImage workflow triggered");
}

async function fetchReleaseAssetText(token, release, assetName) {
  const asset = (release.assets || []).find((entry) => entry.name === assetName);
  if (!asset || !asset.browser_download_url) return "";
  const headers = { Accept: "application/octet-stream", "User-Agent": userAgent };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(asset.browser_download_url, { headers });
  if (!response.ok) {
    throw new Error(`Download ${assetName} failed: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function writeLinuxManifestUpdate({ existingText, appImagePath, version, owner, repo }) {
  const tag = `v${version}`;
  const linux = createReleaseAssetInfo(appImagePath, tag, owner, repo);
  const manifest = {
    version,
    releaseDate: new Date().toISOString(),
    repo: `${owner}/${repo}`,
    productName: appName,
    ...parseManifestText(existingText),
    version,
    repo: `${owner}/${repo}`,
    linuxPath: linux.name,
    linuxUrl: linux.url,
    linuxSha256: linux.sha256,
    linuxSha512: linux.sha512,
    linuxSize: linux.size
  };
  const manifestPath = path.join(rootDir, "dist", "installer", "latest.yml");
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, serializeManifest(manifest), "utf8");
  return { manifestPath, appImageName: linux.name, linuxSha256: linux.sha256 };
}

function uploadAssetWithProgress({ token, url, filePath, contentType, label, size }) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const request = https.request(
      {
        method: "POST",
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType,
          "Content-Length": String(size),
          "X-GitHub-Api-Version": apiVersion,
          "User-Agent": userAgent
        }
      },
      (response) => {
        let responseText = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseText += chunk;
        });
        response.on("end", () => {
          let data = null;
          if (responseText) {
            try {
              data = JSON.parse(responseText);
            } catch {
              reject(new Error(`GitHub returned invalid JSON while uploading ${path.basename(filePath)}.`));
              return;
            }
          }
          if (response.statusCode < 200 || response.statusCode >= 300) {
            const message = data && data.message ? data.message : response.statusMessage;
            reject(new Error(`Upload ${path.basename(filePath)} failed: ${response.statusCode} ${message}`));
            return;
          }
          resolve(data);
        });
      }
    );
    request.on("error", reject);

    let uploaded = 0;
    let lastProgressAt = 0;
    let lastText = "";
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => {
      uploaded += chunk.length;
      const now = Date.now();
      if (now - lastProgressAt > 150 || uploaded === size) {
        lastText = logProgress(label, uploaded, size, lastText);
        lastProgressAt = now;
      }
    });
    stream.on("error", reject);
    stream.pipe(request);
  });
}

async function uploadAsset(token, release, filePath, contentType) {
  const assetName = path.basename(filePath);
  await deleteExistingAsset(token, release, assetName);
  const uploadUrl = release.upload_url.replace(/\{.*$/, "");
  const url = `${uploadUrl}?name=${encodeURIComponent(assetName)}`;
  const size = fs.statSync(filePath).size;
  logStep(`Upload ${assetName} (${formatBytes(size)})`);
  const startedAt = Date.now();
  await uploadAssetWithProgress({
    token,
    url,
    filePath,
    contentType,
    label: `Upload ${assetName}`,
    size
  });
  if (process.stdout.isTTY) {
    process.stdout.write("\n");
  }
  logSuccess(`Uploaded ${assetName} in ${formatDuration(startedAt)}`);
}

function precheckVersionCommit() {
  logHeader("Git precheck");
  if (!isInsideGitRepo()) {
    logStep("Skip Git commit precheck because this folder is not a Git repository.");
    return;
  }
  const name = runCapture("git", ["config", "--get", "user.name"]);
  const email = runCapture("git", ["config", "--get", "user.email"]);
  if (!name || !email) {
    throw new Error("Git user.name/user.email is missing; configure Git before releasing.");
  }
  logSuccess("Git can commit version files");
}

function commitVersionFiles(version) {
  logHeader("Git commit");
  if (!isInsideGitRepo()) {
    logStep("Skip commit because this folder is not a Git repository.");
    return;
  }
  const unstagedChanges = runStatus("git", ["diff", "--quiet", "--", "package.json", "package-lock.json"]);
  const stagedChanges = runStatus("git", ["diff", "--cached", "--quiet", "--", "package.json", "package-lock.json"]);
  const untrackedFiles = runCapture("git", ["ls-files", "--others", "--exclude-standard", "--", "package.json", "package-lock.json"]);
  if (unstagedChanges.status === 0 && stagedChanges.status === 0 && !untrackedFiles) {
    logStep("Skip commit because package.json and package-lock.json did not change.");
    return;
  }
  const addResult = runStatus("git", ["add", "--", "package.json", "package-lock.json"]);
  if (addResult.status !== 0) {
    throw new Error("Git add failed.");
  }
  logStep("Commit package.json and package-lock.json");
  const result = runStatus("git", ["commit", "--only", "package.json", "package-lock.json", "-m", `chore: release ${version}`]);
  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || "").trim();
    throw new Error(`Git commit failed.${details ? ` ${details}` : ""}`);
  }
  logSuccess(`Committed version files for ${version}`);
}

async function releaseLinuxAppImage({ token, owner, repo, version }) {
  if (process.platform !== "linux") {
    throw new Error("AppImage packaging must run on Linux. Use the GitHub workflow or a Linux machine.");
  }
  const tag = `v${version}`;
  logHeader("Linux AppImage release");
  logInfo("Repository", `${owner}/${repo}`);
  logInfo("Version", version);

  logHeader("Prepare files");
  updatePackageVersion(version);
  logSuccess(`package.json/package-lock.json set to ${version}`);

  logHeader("Build");
  run("node", ["scripts/run-electron-vite.cjs", "build"]);
  runWithRetry("npx", ["electron-builder", "--config", "electron-builder.config.cjs", "--linux", "AppImage", "--publish", "never"], {
    attempts: 3
  });
  const appImageUploadPath = createUploadCopy(findAppImage(), linuxUploadName);

  logHeader("GitHub");
  const release = await getReleaseByTag(token, owner, repo, tag);
  logSuccess(`Release ready: ${release.html_url || tag}`);

  const existingManifest = await fetchReleaseAssetText(token, release, "latest.yml");
  const manifest = writeLinuxManifestUpdate({
    existingText: existingManifest,
    appImagePath: appImageUploadPath,
    version,
    owner,
    repo
  });
  logSuccess(`Updated ${path.relative(rootDir, manifest.manifestPath)} with Linux asset info`);

  await uploadAsset(token, release, appImageUploadPath, "application/octet-stream");
  await uploadAsset(token, release, manifest.manifestPath, "application/x-yaml");

  logHeader("Done");
  logSuccess(`Uploaded Linux AppImage for ${appName} ${version}`);
  logInfo("AppImage", manifest.appImageName);
  logInfo("Linux SHA256", manifest.linuxSha256);
}

async function main() {
  const releaseStartedAt = Date.now();
  const originalPackageJson = readTextIfExists(packagePath);
  const originalPackageLock = readTextIfExists(lockPath);
  let versionFilesCommitted = false;
  let createdRelease = null;
  let createdReleaseTag = "";
  let token = "";
  let owner = "";
  let repo = "";

  logHeader(`${appName} release`);
  try {
    const options = parseArgs();
    const pkgBefore = readJson(packagePath);
    const configuredRepo = getRepoParts(projectConfig);
    owner = process.env.GITHUB_OWNER || configuredRepo.owner;
    repo = process.env.GITHUB_REPO || configuredRepo.repo;
    if (!owner || !repo) {
      throw new Error("Missing repo in config.json.");
    }
    if (options.linuxOnly && process.platform !== "linux") {
      throw new Error("AppImage packaging must run on Linux. Use the GitHub workflow for npm run release:linux.");
    }

    const nextVersion = options.linuxOnly
      ? options.version || pkgBefore.version
      : options.version || bumpVersion(pkgBefore.version, options.bump);
    logInfo("Repository", `${owner}/${repo}`);
    logInfo("Version", options.linuxOnly ? nextVersion : `${pkgBefore.version} -> ${nextVersion}`);
    logInfo("Mode", `${options.linuxOnly ? "linux appimage" : options.draft ? "draft" : "published"}${options.prerelease ? ", prerelease" : ""}`);

    logHeader("Preflight");
    run("npm", ["run", "test"]);
    logStep("Resolve GitHub token");
    token = getGitHubToken();
    if (!token) {
      throw new Error("GitHub auth missing. Run `gh auth login` once, or set GH_TOKEN/GITHUB_TOKEN.");
    }
    logSuccess("GitHub auth available");
    if (!options.linuxOnly) {
      precheckVersionCommit();
    }

    if (options.linuxOnly) {
      await releaseLinuxAppImage({ token, owner, repo, version: nextVersion });
      return;
    }

    logHeader("Prepare files");
    updatePackageVersion(nextVersion);
    logSuccess(`package.json/package-lock.json set to ${nextVersion}`);
    const pkg = readJson(packagePath);

    logHeader("Build");
    cleanBuildOutput();
    logSuccess("Cleaned dist and out");
    run("npm", ["run", "setup"]);

    const setupPath = path.join(rootDir, "dist", "installer", `${windowsSetupBaseName}-${nextVersion}.exe`);
    if (!fs.existsSync(setupPath)) {
      throw new Error(`Setup file not found: ${setupPath}`);
    }
    logInfo("Setup", `${path.relative(rootDir, setupPath)} (${formatBytes(fs.statSync(setupPath).size)})`);
    const setupUploadPath = createUploadCopy(setupPath, windowsUploadName);

    logHeader("Manifest");
    const manifest = createLatestManifest({ pkg, setupPath: setupUploadPath, version: nextVersion, owner, repo });
    logSuccess(`Created ${path.relative(rootDir, manifest.manifestPath)}`);
    logInfo("SHA256", manifest.sha256);

    logHeader("GitHub");
    const releaseResult = await getOrCreateRelease({
      token,
      owner,
      repo,
      tag: manifest.tag,
      version: nextVersion,
      draft: options.draft,
      prerelease: options.prerelease
    });
    const release = releaseResult.release;
    if (releaseResult.created) {
      createdRelease = release;
      createdReleaseTag = manifest.tag;
    }
    logSuccess(`Release ready: ${release.html_url || manifest.tag}`);

    await deleteUnexpectedReleaseAssets(token, release, [windowsUploadName, "latest.yml", linuxUploadName]);
    await uploadAsset(token, release, setupUploadPath, "application/vnd.microsoft.portable-executable");
    await uploadAsset(token, release, manifest.manifestPath, "application/x-yaml");

    try {
      await triggerLinuxReleaseWorkflow(token, owner, repo, nextVersion);
    } catch (workflowError) {
      console.error(`${color("yellow", "WARN")} Linux workflow trigger failed: ${workflowError.message || workflowError}`);
      console.error(`${color("yellow", "WARN")} Run the "Linux AppImage Release" workflow manually for ${nextVersion}.`);
    }

    commitVersionFiles(nextVersion);
    versionFilesCommitted = true;

    logHeader("Done");
    logSuccess(`Released ${appName} ${nextVersion} in ${formatDuration(releaseStartedAt)}`);
    logInfo("Tag", manifest.tag);
    logInfo("Setup", manifest.setupName);
    logInfo("SHA256", manifest.sha256);
  } catch (error) {
    logHeader("Rollback");
    if (!versionFilesCommitted) {
      restoreTextFile(packagePath, originalPackageJson);
      restoreTextFile(lockPath, originalPackageLock);
      resetVersionFilesFromGitIndex();
      logSuccess("Restored package.json/package-lock.json");
    } else {
      logStep("Version files were already committed; local version rollback skipped.");
    }
    if (createdRelease && token && owner && repo) {
      try {
        await deleteReleaseAndTag(token, owner, repo, createdRelease, createdReleaseTag);
      } catch (rollbackError) {
        console.error(`${color("yellow", "WARN")} GitHub rollback failed: ${rollbackError.message || rollbackError}`);
      }
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("");
  console.error(`${color("red", "FAILED")} ${error.message || error}`);
  process.exit(1);
});
