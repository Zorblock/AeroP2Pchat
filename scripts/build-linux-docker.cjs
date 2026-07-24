const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const image = "electronuserland/builder:22";

function parseVersion() {
  const argument = process.argv
    .slice(2)
    .find((value) => value.startsWith("--version="));
  return argument ? argument.slice("--version=".length).replace(/^v/, "") : "";
}

function main() {
  if (!fs.existsSync(path.join(root, "package-lock.json"))) {
    throw new Error(
      "package-lock.json is required for the Docker Linux build.",
    );
  }

  const version = parseVersion();
  const releaseOutput = path.join(root, "dist", "release");
  fs.mkdirSync(releaseOutput, { recursive: true });
  const buildCommand =
    "node scripts/ci-build-release.cjs --platform=linux --preserve-release" +
    (version ? ` --version=${version}` : "");
  const command = `
    cache_key="$(sha256sum package-lock.json | awk '{print $1}'):$(node --version)"
    if [ -f node_modules/.aero-package-lock.sha256 ] && [ "$(cat node_modules/.aero-package-lock.sha256)" = "$cache_key" ]; then
      echo "Reusing cached Linux node_modules."
    else
      echo "Installing Linux dependencies (first build or package-lock changed)..."
      npm ci
      printf "%s" "$cache_key" > node_modules/.aero-package-lock.sha256
    fi
    ${buildCommand}
    test -f dist/release/Aero-P2P-Chat-Linux-x64.AppImage
    test -f dist/release/update_manifest_linux.json
    cp -f dist/release/Aero-P2P-Chat-Linux-x64.AppImage /release-output/
    cp -f dist/release/update_manifest_linux.json /release-output/
  `;

  console.log("Building Linux packages locally with Docker...");
  console.log(`Image: ${image}`);
  console.log(
    "Linux build intermediates stay in Docker; only release artifacts are copied back.",
  );

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
      "type=volume,target=/project/dist",
      "--mount",
      `type=bind,source=${releaseOutput},target=/release-output`,
      "--mount",
      "type=volume,source=aero-p2p-chat-linux-node-modules,target=/project/node_modules",
      "--mount",
      "type=volume,source=aero-p2p-chat-electron-cache,target=/root/.cache/electron",
      "--mount",
      "type=volume,source=aero-p2p-chat-electron-builder-cache,target=/root/.cache/electron-builder",
      image,
      "bash",
      "-lc",
      command,
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
