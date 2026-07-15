const { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } = require("node:fs");
const { homedir } = require("node:os");
const { join, resolve } = require("node:path");
const { spawnSync } = require("node:child_process");
const projectConfig = require("../config.json");
const packageInfo = require("../package.json");

const rootDir = join(__dirname, "..");
const androidDir = join(rootDir, "android");
const releaseOutputDir = join(rootDir, "dist", "release");
const storeOutputDir = join(rootDir, "dist", "store");
const isWindows = process.platform === "win32";
const buildEnv = { ...process.env };
const isPlayBuild = process.argv.slice(2).includes("--play");

// Keep Android's Gradle transforms independent from a machine-wide cache. This
// avoids reusing classes produced by a newer, incompatible JDK.
buildEnv.GRADLE_USER_HOME =
  process.env.AERO_ANDROID_GRADLE_USER_HOME || join(rootDir, ".gradle-android");

function readKeystoreProperties() {
  const propertiesPath = join(androidDir, "keystore.properties");
  if (!existsSync(propertiesPath)) return {};

  return Object.fromEntries(
    readFileSync(propertiesPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && !line.startsWith("!"))
      .map((line) => {
        const separator = line.search(/[=:]/);
        return separator === -1
          ? [line, ""]
          : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );
}

function assertReleaseKeystore() {
  const properties = readKeystoreProperties();
  const required = ["storeFile", "storePassword", "keyAlias", "keyPassword"];
  const missing = required.filter((name) => !properties[name]);
  const storePath = properties.storeFile && resolve(androidDir, properties.storeFile);

  if (missing.length > 0 || !storePath || !existsSync(storePath)) {
    console.error("A signed Android release requires a private keystore.");
    console.error("Create android/keystore.properties locally (it is gitignored) before building.");
    console.error("Required properties: storeFile, storePassword, keyAlias, keyPassword.");
    process.exit(1);
  }
}

function getAndroidVersionCode(version) {
  const [major = 0, minor = 0, patch = 0] = String(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  return (major * 100000 + minor * 1000 + patch).toString();
}

function getJavaMajorVersion(javaHome) {
  const javaExe = join(javaHome, "bin", isWindows ? "java.exe" : "java");
  if (!existsSync(javaExe)) {
    return 0;
  }

  const result = spawnSync(javaExe, ["-version"], {
    encoding: "utf8",
    shell: false,
  });
  const output = `${result.stderr || ""}\n${result.stdout || ""}`;
  const match = /version "(\d+)/.exec(output);
  return match ? Number(match[1]) : 0;
}

function findSupportedJavaHome() {
  const candidates = [
    process.env.AERO_ANDROID_JAVA_HOME,
    process.env.JAVA_HOME,
  ].filter(Boolean);

  if (isWindows) {
    for (const base of [
      "C:\\Program Files\\Java",
      "C:\\Program Files\\Eclipse Adoptium",
    ]) {
      try {
        for (const entry of readdirSync(base, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            candidates.push(join(base, entry.name));
          }
        }
      } catch {
        // The Java installation directory is optional or may be inaccessible.
      }
    }
  }

  return candidates.find((candidate) => {
    const major = getJavaMajorVersion(candidate);
    return major >= 17 && major <= 24;
  });
}

const supportedJavaHome = findSupportedJavaHome();
if (supportedJavaHome) {
  buildEnv.JAVA_HOME = supportedJavaHome;
  buildEnv.PATH = `${join(supportedJavaHome, "bin")}${isWindows ? ";" : ":"}${process.env.PATH || ""}`;
}

function findAndroidSdkHome() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    isWindows ? join(process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"), "Android", "Sdk") : "",
    isWindows ? "C:\\Android\\Sdk" : join(homedir(), "Android", "Sdk"),
  ].filter(Boolean);

  return candidates.find((candidate) =>
    existsSync(join(candidate, "platforms")) &&
    existsSync(join(candidate, "platform-tools")),
  );
}

const androidSdkHome = findAndroidSdkHome();
if (androidSdkHome) {
  buildEnv.ANDROID_HOME = androidSdkHome;
  buildEnv.ANDROID_SDK_ROOT = androidSdkHome;
}

function run(command, args, options = {}) {
  let executable = command;
  let executableArgs = args;

  if (isWindows) {
    executable = "cmd.exe";
    executableArgs = ["/d", "/s", "/c", command, ...args];
  }

  const result = spawnSync(executable, executableArgs, {
    cwd: options.cwd || rootDir,
    stdio: "inherit",
    shell: false,
    env: buildEnv,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (!existsSync(androidDir)) {
  console.error("Android project not found. Run `npx cap add android` first.");
  process.exit(1);
}

assertReleaseKeystore();
run("npx", ["vite", "build"]);
run("npx", ["cap", "sync", "android"]);
run(isWindows ? "gradlew.bat" : "./gradlew", [
  isPlayBuild ? "bundlePlayRelease" : "assembleDirectRelease",
  `-PaeroAndroidVersionName=${packageInfo.version}`,
  `-PaeroAndroidVersionCode=${getAndroidVersionCode(packageInfo.version)}`,
], {
  cwd: androidDir,
});

if (isPlayBuild) {
  const gradleAabPath = join(
    androidDir,
    "app",
    "build",
    "outputs",
    "bundle",
    "playRelease",
    "app-play-release.aab",
  );
  const namedAabPath = join(
    storeOutputDir,
    projectConfig.release.androidPlayAsset || "Aero-P2P-Chat-Google-Play.aab",
  );

  if (!existsSync(gradleAabPath)) {
    console.error(`Signed Google Play AAB was not created: ${gradleAabPath}`);
    process.exit(1);
  }

  mkdirSync(storeOutputDir, { recursive: true });
  copyFileSync(gradleAabPath, namedAabPath);
  console.log(`Google Play upload bundle created: ${namedAabPath}`);
} else {
  const gradleApkPath = join(
    androidDir,
    "app",
    "build",
    "outputs",
    "apk",
    "direct",
    "release",
    "app-direct-release.apk",
  );
  const namedApkPath = join(
    releaseOutputDir,
    projectConfig.release.androidApkAsset || "Aero-P2P-Chat-Android.apk",
  );

  if (!existsSync(gradleApkPath)) {
    console.error(`Signed Android APK was not created: ${gradleApkPath}`);
    process.exit(1);
  }

  mkdirSync(releaseOutputDir, { recursive: true });
  copyFileSync(gradleApkPath, namedApkPath);
  console.log(`Android direct-download APK created: ${namedApkPath}`);
}
