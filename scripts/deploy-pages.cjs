const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const projectConfig = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));
const workflow = "pages.yml";
const ref = projectConfig.branch || "main";
const repo = projectConfig.repo;

function run(command, args) {
  const executable = process.platform === "win32" ? `${command}.exe` : command;
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    process.exit(result.status || 1);
  }

  return result.stdout || "";
}

// --- GitHub Pages ---
console.log(`Triggering GitHub Pages deploy for ${repo} on ${ref}...`);
const output = run("gh", ["workflow", "run", workflow, "--repo", repo, "--ref", ref]);
const runUrl = output
  .split(/\r?\n/)
  .find((line) => /^https:\/\/github\.com\/.+\/actions\/runs\/\d+/.test(line));

if (runUrl) {
  console.log(runUrl);
}

console.log("GitHub Pages workflow triggered.");
