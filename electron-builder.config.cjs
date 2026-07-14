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
  win: {
    target: "dir",
    icon: "assets/app.ico",
  },
  // Separate Microsoft Store package. The normal Windows/Inno path stays unchanged.
  appx: {
    identityName: "Zorblock.AeroP2PChat",
    publisher: "CN=9C56695C-1431-40D0-A466-EAE7BFAE9231",
    publisherDisplayName: "Zorblock",
    displayName: "Aero P2P Chat",
    // Keep the transparent parts of the circular app mark transparent in the
    // Windows taskbar instead of using electron-builder's default #464646 tile.
    backgroundColor: "transparent",
    languages: ["en-US", "de-DE"],
    capabilities: ["runFullTrust", "internetClient", "microphone"],
  },
  linux: {
    target: ["AppImage", "deb", "rpm"],
    icon: "assets/linux-icons",
    category: "Network",
    syncDesktopName: true,
  },
  electronLanguages: ["en-US"],
  asar: true,
};
