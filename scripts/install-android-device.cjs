const { existsSync, readdirSync } = require("node:fs");
const { homedir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const packageInfo = require("../package.json");

const rootDir = join(__dirname, "..");
const androidDir = join(rootDir, "android");
const isWindows = process.platform === "win32";
const buildEnv = { ...process.env };

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
        // Optional Java install location.
      }
    }
  }

  return candidates.find((candidate) => {
    const major = getJavaMajorVersion(candidate);
    return major >= 17 && major <= 24;
  });
}

function findAndroidSdkHome() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    isWindows
      ? join(
          process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"),
          "Android",
          "Sdk",
        )
      : "",
    isWindows ? "C:\\Android\\Sdk" : join(homedir(), "Android", "Sdk"),
  ].filter(Boolean);

  return candidates.find(
    (candidate) =>
      existsSync(join(candidate, "platforms")) &&
      existsSync(join(candidate, "platform-tools")),
  );
}

const supportedJavaHome = findSupportedJavaHome();
if (supportedJavaHome) {
  buildEnv.JAVA_HOME = supportedJavaHome;
  buildEnv.PATH = `${join(supportedJavaHome, "bin")}${isWindows ? ";" : ":"}${process.env.PATH || ""}`;
}

const androidSdkHome = findAndroidSdkHome();
if (androidSdkHome) {
  buildEnv.ANDROID_HOME = androidSdkHome;
  buildEnv.ANDROID_SDK_ROOT = androidSdkHome;
  buildEnv.PATH = `${join(androidSdkHome, "platform-tools")}${isWindows ? ";" : ":"}${buildEnv.PATH || ""}`;
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
    stdio: options.stdio || "inherit",
    shell: false,
    env: buildEnv,
    encoding: options.encoding,
  });

  if (result.error && !options.ignoreError) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0 && !options.ignoreError) {
    process.exit(result.status || 1);
  }

  return result;
}

function adb(args, options = {}) {
  const adbPath = androidSdkHome
    ? join(androidSdkHome, "platform-tools", isWindows ? "adb.exe" : "adb")
    : "adb";
  return run(adbPath, args, options);
}

if (!existsSync(androidDir)) {
  console.error("Android project not found. Run `npx cap add android` first.");
  process.exit(1);
}

const devicesResult = adb(["devices"], {
  stdio: "pipe",
  encoding: "utf8",
});
const connectedDevices = devicesResult.stdout
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.trim())
  .filter((line) => /\tdevice$/.test(line));

if (connectedDevices.length === 0) {
  console.error(
    [
      "No authorized Android device found.",
      "Enable Developer options and USB debugging on the phone, connect USB, then accept the RSA prompt on the phone.",
      "You can check the state with: adb devices",
    ].join("\n"),
  );
  process.exit(1);
}

run("npx", ["vite", "build"]);
run("npx", ["cap", "sync", "android"]);
run(
  isWindows ? "gradlew.bat" : "./gradlew",
  [
    "assembleDebug",
    `-PaeroAndroidVersionName=${packageInfo.version}`,
    `-PaeroAndroidVersionCode=${getAndroidVersionCode(packageInfo.version)}`,
  ],
  { cwd: androidDir },
);

const apkPath = join(
  androidDir,
  "app",
  "build",
  "outputs",
  "apk",
  "debug",
  "app-debug.apk",
);

console.log("Installing APK on device...");
const installResult = adb(["install", "-r", apkPath], { ignoreError: true, stdio: "pipe", encoding: "utf8" });
const output = `${installResult.stdout || ""} ${installResult.stderr || ""}`;

if (installResult.status !== 0) {
  if (output.includes("INSTALL_FAILED_UPDATE_INCOMPATIBLE")) {
    console.log("⚠️ Signature mismatch detected! Automatically uninstalling conflicting app...");
    adb(["uninstall", "de.zorblock.aerop2pchat"]);
    console.log("Re-installing APK...");
    adb(["install", "-r", apkPath]);
  } else {
    console.error(`Installation failed:\n${output}`);
    process.exit(1);
  }
}

console.log("Launching app...");
adb([
  "shell",
  "monkey",
  "-p",
  "de.zorblock.aerop2pchat",
  "-c",
  "android.intent.category.LAUNCHER",
  "1",
], { stdio: "ignore" });

console.log(`Installed and launched ${packageInfo.name} ${packageInfo.version}.`);
