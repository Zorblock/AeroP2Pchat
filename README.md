<div align="center">
  <img src="https://zorblock.github.io/AeroP2Pchat/logo.png" alt="Aero P2P Chat Logo" width="150" height="150" />

  <h1>Aero P2P Chat</h1>
  <p><strong>Direct desktop messaging without the middleman. Secure, fast, and completely peer-to-peer.</strong></p>

  <p>
    <a href="https://github.com/Zorblock/AeroP2Pchat/releases"><img src="https://img.shields.io/github/v/release/Zorblock/AeroP2Pchat?style=flat-square&color=0ea5e9" alt="Latest Release" /></a>
    <a href="https://github.com/Zorblock/AeroP2Pchat/releases"><img src="https://img.shields.io/github/downloads/Zorblock/AeroP2Pchat/total?style=flat-square&color=38bdf8" alt="Total Downloads" /></a>
    <img src="https://img.shields.io/badge/License-Proprietary-7dd3fc?style=flat-square" alt="License: Proprietary" />
  </p>
</div>

---

Aero P2P Chat is a modern, lightweight desktop application that lets you connect directly to your friends without routing your messages through centralized servers. Built on top of WebRTC, it guarantees low-latency and secure direct peer-to-peer connections.

## ✨ Features

- **Direct P2P Connection**: No servers in the middle! Once connected, your messages travel directly between you and your chat partner.
- **Screen Sharing**: Instantly share your screen in high quality with zero latency.
- **Lightning Fast**: Built on native WebRTC architecture for maximum performance.
- **File Transfer** *(Coming soon)*: Send files securely with zero size limits.
- **CLI Integrated**: Open, update, check the status, or uninstall the app straight from your terminal (`aerop2p` command).

---

## 📥 Installation

Installing Aero P2P Chat is as simple as running a single command in your terminal. This will download the latest version, install the app, and set up the `aerop2p` command for you.

### 🪟 Windows (PowerShell)
Open PowerShell as Administrator (or just standard user) and run:
```powershell
irm https://zorblock.github.io/AeroP2Pchat/install.ps1 | iex
```

### 🐧 Linux (Bash)
Open your terminal and run:
```bash
curl -fsSL https://zorblock.github.io/AeroP2Pchat/install.sh | bash
```

> **Note:** If you prefer downloading the installer manually, you can grab the `.exe` (Windows) or `.AppImage` (Linux) directly from our [Releases Page](https://github.com/Zorblock/AeroP2Pchat/releases) or the [Official Website](https://zorblock.github.io/AeroP2Pchat).

---

## 🚀 How to Use

### 1. Connect with a Friend
- **Start the app:** Open "Aero P2P Chat" from your Start Menu/Applications folder, or simply type `aerop2p` in your terminal.
- **Share your ID:** In the main window, click on your **Peer ID** at the top to copy it to your clipboard. Send this ID to your friend.
- **Connect:** Your friend pastes your ID into the "Remote Peer ID" input box and clicks **Connect**.
- **Chat!** You are now securely connected directly to each other.

### 2. Using the CLI Tool
The installer automatically adds the `aerop2p` command to your system. You can use it anytime in your terminal:

- `aerop2p open` - Starts the chat client.
- `aerop2p status` - Checks your current version against the latest available release.
- `aerop2p update` - Seamlessly updates your client to the newest version in the background.
- `aerop2p menu` - Opens an interactive terminal menu for managing the app.
- `aerop2p uninstall` - Completely removes the app from your system.

---

## 📄 License & Terms

This software is strictly intended for private use. 
**Aero P2P Chat is NOT Open Source.** 

The software is provided under a custom End User License Agreement (EULA). You are allowed to use it and modify it for your own personal use, but you may **not** distribute, fork, publish, or commercialize the source code or the compiled application under any circumstances. 

For more details, see the [LICENSE](./LICENSE) file. All rights reserved by **Zorblock**.
