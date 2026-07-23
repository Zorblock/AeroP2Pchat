# Aero P2P Chat

![Aero P2P Chat Logo](./assets/app.png)

**Direct messaging without the middleman. Secure, fast, and completely peer-to-peer.**

[![Latest Release](https://img.shields.io/github/v/release/Zorblock/AeroP2Pchat?style=flat-square&color=0ea5e9)](https://github.com/Zorblock/AeroP2Pchat/releases)
[![Total Downloads](https://img.shields.io/github/downloads/Zorblock/AeroP2Pchat/total?style=flat-square&color=38bdf8)](https://github.com/Zorblock/AeroP2Pchat/releases)
![License: Proprietary](https://img.shields.io/badge/License-Proprietary-7dd3fc?style=flat-square)

---

Aero P2P Chat is a modern, lightweight application that lets you connect
directly to your friends without routing your messages through centralized
servers. Built on top of WebRTC, it provides low-latency, secure peer-to-peer
connections.

## ✨ Features

- **Direct P2P Connection**: No servers in the middle! Once connected, your
  messages travel directly between you and your chat partner.
- **Screen Sharing**: Instantly share your screen in high quality with zero latency.
- **Lightning Fast**: Built on native WebRTC architecture for maximum performance.
- **File Transfer** *(Coming soon)*: Send files securely with zero size limits.
- **CLI Integrated**: Open, update, check the status, or uninstall the app
  straight from your terminal (`aerop2p` command).

---

## 📥 Installation

Installing Aero P2P Chat is as simple as running a single command in your
terminal. This downloads the latest version, installs the app, and sets up the
`aerop2p` command for you.

### 🪟 Windows (PowerShell)

Open PowerShell as Administrator (or just standard user) and run:

```powershell
iwr -useb https://zorblock.github.io/AeroP2Pchat/install.ps1 | iex
```

### 🐧 Linux (Bash)

Open your terminal and run:

```bash
curl -sSL https://zorblock.github.io/AeroP2Pchat/install.sh | bash
```

### 📱 Android

Download the latest `.apk` from our [Releases Page](https://github.com/Zorblock/AeroP2Pchat/releases) and install it directly on your device.

> **Note:** If you prefer downloading manually, you can grab the `.exe`
> (Windows), `.AppImage` (Linux), or `.apk` (Android) directly from our
> [Releases Page](https://github.com/Zorblock/AeroP2Pchat/releases) or the
> [Official Website](https://zorblock.github.io/AeroP2Pchat).

---

## 🚀 How to Use

### 1. Connect with a Friend

- **Start the app:** Open "Aero P2P Chat" from your Start Menu/Applications
  folder, or simply type `aerop2p` in your terminal.
- **Share your ID:** In the main window, click on your **Peer ID** at the top to
  copy it to your clipboard. Send this ID to your friend.
- **Connect:** Your friend pastes your ID into the "Remote Peer ID" input box
  and clicks **Connect**.
- **Chat!** You are now securely connected directly to each other.

### 2. Using the CLI Tool

The installer automatically adds the `aerop2p` command to your system. You can
use it anytime in your terminal:

- `aerop2p open` - Starts the chat client.
- `aerop2p status` - Checks your current version against the latest available
  release.
- `aerop2p update` - Seamlessly updates your client to the newest version in
  the background.
- `aerop2p menu` - Opens an interactive terminal menu for managing the app.
- `aerop2p uninstall` - Completely removes the app from your system.

---

## 📄 License & Terms

This software is strictly intended for private use.
**Aero P2P Chat is NOT Open Source.**

The software is provided under a custom End User License Agreement (EULA). You
are allowed to use it and modify it for your own personal use, but you may
**not** distribute, fork, publish, or commercialize the source code or the
compiled application under any circumstances.

For more details, see the [LICENSE](./LICENSE) file. All rights reserved by **Zorblock**.
