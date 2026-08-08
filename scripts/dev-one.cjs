const { spawn } = require("node:child_process");
const path = require("node:path");
const { createRuntimeLog } = require("./runtime-log.cjs");

const root = path.join(__dirname, "..");
const runtimeLog = createRuntimeLog(
  "dev-instance-1",
  "Aero P2P Chat - Dev Instanz 1",
  "left",
);
const environment = {
  ...process.env,
  AERO_CHAT_RUNTIME_LOG_FILE: runtimeLog.logPath,
  AERO_CHAT_DEV_LAYOUT: "left",
};

delete environment.ELECTRON_RUN_AS_NODE;

const child = spawn(
  process.execPath,
  [path.join("scripts", "run-electron-vite.cjs"), "dev"],
  { cwd: root, env: environment, stdio: "inherit", shell: false },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
