const projectConfig = require("./config.json");

module.exports = {
  appId: projectConfig.app.id,
  productName: projectConfig.app.name,
  directories: {
    output: "dist",
  },
  files: [
    "out/**/*",
    "assets/**/*",
    "package.json",
    "!node_modules/**/android/**/*",
    "!node_modules/**/ios/**/*",
    "!node_modules/**/*.podspec"
  ],
  win: {
    target: "dir",
    icon: "assets/app.ico",
  },
  linux: {
    target: ["AppImage"],
    icon: "assets/linux-icons",
    category: "Network",
    syncDesktopName: true,
  },
  electronLanguages: ["en-US"],
  asar: true,
};
