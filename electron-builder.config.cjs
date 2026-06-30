const projectConfig = require("./config.json");

module.exports = {
  appId: projectConfig.app.id,
  productName: projectConfig.app.name,
  directories: {
    output: "dist"
  },
  files: [
    "out/**/*",
    "assets/**/*",
    "package.json"
  ],
  artifactName: projectConfig.release.artifactName,
  win: {
    target: "dir",
    icon: "assets/app.ico"
  },
  linux: {
    target: [
      "AppImage"
    ],
    icon: "assets/linux-icons",
    category: "Network",
    syncDesktopName: true
  },
  asar: true
};
