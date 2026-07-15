const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const root = join(__dirname, "..");
const pagesRoot = join(root, ".pages");
const appOutput = join(pagesRoot, "public", "app");

function runNode(script, args, cwd) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

runNode(
  join(root, "node_modules", "vite", "bin", "vite.js"),
  ["build", "--config", "vite.web.config.js"],
  root,
);

if (!existsSync(join(appOutput, "index.html"))) {
  throw new Error("Web app build did not create .pages/public/app/index.html.");
}

runNode(
  join(pagesRoot, "node_modules", "typescript", "bin", "tsc"),
  ["-b"],
  pagesRoot,
);
runNode(
  join(pagesRoot, "node_modules", "vite", "bin", "vite.js"),
  ["build"],
  pagesRoot,
);

console.log(`Website and /app build created in ${join(pagesRoot, "dist")}`);
