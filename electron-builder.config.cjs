const projectConfig = require("./config.json");

module.exports = {
  appId: projectConfig.app.id,
  productName: projectConfig.app.name,
  directories: {
    output: "dist",
    buildResources: "assets",
  },
  files: [
    "out/**/*",
    "assets/**/*",
    "package.json",
    "!node_modules/**/android/**/*",
    "!node_modules/**/ios/**/*",
    "!node_modules/**/*.podspec"
  ],
  // Keep native window/tray icons outside app.asar as well. Some desktop
  // shells cannot reliably resolve a taskbar icon from inside the archive.
  extraResources: [
    {
      from: "assets/app.ico",
      to: "app-icon.ico",
    },
    {
      from: "assets/linux-icons/512x512.png",
      to: "app-icon.png",
    },
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
    desktop: {
      entry: {
        StartupWMClass: projectConfig.app.id,
      },
    },
  },
  electronLanguages: ["en-US"],
  asar: true,
};
