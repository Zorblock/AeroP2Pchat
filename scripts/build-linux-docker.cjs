const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const image = "electronuserland/builder:20";

function parseVersion() {
  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith("--version="));
  return argument ? argument.slice("--version=".length).replace(/^v/, "") : "";
}

function main() {
  if (!fs.existsSync(path.join(root, "package-lock.json"))) {
    throw new Error("package-lock.json is required for the Docker Linux build.");
  }

  const version = parseVersion();
  const command = [
    "npm ci",
    "node scripts/ci-build-release.cjs --platform=linux --preserve-release",
  ];
  if (version) command[1] += ` --version=${version}`;

  console.log("Building Linux packages locally with Docker...");
  console.log(`Image: ${image}`);
  console.log("Linux node_modules and Electron caches stay in Docker volumes.");

  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--init",
      "--workdir",
      "/project",
      "--env",
      "CSC_IDENTITY_AUTO_DISCOVERY=false",
      "--mount",
      `type=bind,source=${root},target=/project`,
      "--mount",
      "type=volume,source=aero-p2p-chat-linux-node-modules,target=/project/node_modules",
      "--mount",
      "type=volume,source=aero-p2p-chat-electron-cache,target=/root/.cache/electron",
      "--mount",
      "type=volume,source=aero-p2p-chat-electron-builder-cache,target=/root/.cache/electron-builder",
      image,
      "bash",
      "-lc",
      command.join(" && "),
    ],
    { cwd: root, stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error("Docker Linux build failed.");
  }
}

try {
  main();
} catch (error) {
  console.error(`\nLinux Docker build failed: ${error.message || error}`);
  process.exit(1);
}
