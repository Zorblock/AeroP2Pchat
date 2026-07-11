const { spawnSync } = require("node:child_process");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const projectConfig = JSON.parse(fs.readFileSync(path.join(root, "config.json"), "utf8"));
const workflow = "pages.yml";
const ref = projectConfig.branch || "main";
const repo = projectConfig.repo;

/** Read a value from the root .env file (simple KEY=VALUE parser). */
function readEnv(key) {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return undefined;
  const match = fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${key}=`));
  return match ? match.slice(key.length + 1).trim() : undefined;
}

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

/** POST to a Cloudflare Deploy Hook URL. Returns a promise. */
function triggerCloudflare(hookUrl) {
  return new Promise((resolve, reject) => {
    const req = https.request(hookUrl, { method: "POST" }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Cloudflare responded with ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
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

// --- Cloudflare Pages ---
const cfHook = readEnv("CLOUDFLARE_DEPLOY_HOOK");
if (cfHook) {
  console.log("Triggering Cloudflare Pages deploy...");
  triggerCloudflare(cfHook)
    .then(() => console.log("Cloudflare Pages deploy triggered."))
    .catch((err) => {
      console.error("Cloudflare deploy failed:", err.message);
      process.exitCode = 1;
    });
} else {
  console.log("No CLOUDFLARE_DEPLOY_HOOK in .env, skipping Cloudflare deploy.");
}
