const { existsSync, lstatSync, rmSync, symlinkSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const root = join(__dirname, "..");
const pagesRoot = join(root, ".pages");
const appOutput = join(pagesRoot, "public", "app");
const rootNodeModules = join(root, "node_modules");
const pagesNodeModules = join(pagesRoot, "node_modules");
let linkedWebsiteModules = false;

function runNode(script, args, cwd) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

// Cloudflare Pages builds with .pages as the project root. In that environment
// renderer dependencies live in .pages/node_modules, whereas the renderer and
// its Vite config are intentionally kept in the repository root. Temporarily
// expose those modules at the root so normal Node/Vite resolution works.
if (!existsSync(rootNodeModules) && existsSync(pagesNodeModules)) {
  symlinkSync(pagesNodeModules, rootNodeModules, process.platform === "win32" ? "junction" : "dir");
  linkedWebsiteModules = true;
}

try {
  runNode(
    join(rootNodeModules, "vite", "bin", "vite.js"),
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
} finally {
  if (linkedWebsiteModules && lstatSync(rootNodeModules).isSymbolicLink()) {
    rmSync(rootNodeModules);
  }
}

console.log(`Website and /app build created in ${join(pagesRoot, "dist")}`);
