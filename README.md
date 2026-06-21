# Aero P2P Chat

Aero P2P Chat is a compact Electron desktop chat client with a Frutiger Aero inspired interface. It uses PeerJS/WebRTC data connections so chat messages travel peer-to-peer after the peers are connected.

## Features

- Compact friends-list style layout
- Peer ID based direct chat
- Copy your own Peer ID
- Connect to another peer by entering their Peer ID
- Native desktop builds for Windows and Linux
- Windows installer via Inno Setup
- Linux AppImage with a shell installer

## How It Works

1. Start Aero P2P Chat.
2. Copy your Peer ID and send it to your chat partner.
3. Your chat partner pastes that ID into the connect field.
4. Once connected, both sides can send messages directly.

PeerJS is used for signaling. That means you do not need to run your own server, but the app still needs PeerJS signaling to discover/connect peers. The actual chat data is sent over WebRTC peer-to-peer.

## Install On Linux

Use the installer script from the GitHub repository:

```sh
curl -fsSL https://raw.githubusercontent.com/jonasgrimmde/AeroP2Pchat/refs/heads/main/install.sh | sh
```

Other Linux installer commands:

```sh
curl -fsSL https://raw.githubusercontent.com/jonasgrimmde/AeroP2Pchat/refs/heads/main/install.sh | sh -s -- status
curl -fsSL https://raw.githubusercontent.com/jonasgrimmde/AeroP2Pchat/refs/heads/main/install.sh | sh -s -- uninstall
```

The script installs the AppImage to:

```text
~/.local/share/aero-p2p-chat/Aero-P2P-Chat.AppImage
```

It also creates:

- Command: `~/.local/bin/aero-p2p-chat`
- Desktop entry: `~/.local/share/applications/de.jonasgrimm.aerop2pchat.desktop`
- Icon: `~/.local/share/icons/hicolor/512x512/apps/de.jonasgrimm.aerop2pchat.png`

## Install On Windows

Download the latest Windows installer from GitHub Releases:

```text
https://github.com/jonasgrimmde/AeroP2Pchat/releases/latest
```

The release asset is named:

```text
Aero-P2P-Chat-Windows-Setup.exe
```

## Development

Install dependencies:

```sh
npm install
```

Run the app in development mode:

```sh
npm run dev
```

Run syntax checks:

```sh
npm run test
```

## Build

Build the Windows unpacked app:

```sh
npm run build
```

Build the Windows Inno Setup installer:

```sh
npm run setup
```

The installer is written to:

```text
dist/installer/Aero-P2P-Chat-Setup-<version>.exe
```

Linux AppImages are built by the included GitHub workflow on Ubuntu.

## Release

The release script follows this flow:

1. Bump `package.json` and `package-lock.json`.
2. Build the Windows installer.
3. Create or reuse a GitHub release.
4. Upload `Aero-P2P-Chat-Windows-Setup.exe`.
5. Upload `latest.yml`.
6. Trigger the Linux AppImage GitHub workflow.
7. Commit the version files.

Create a release:

```sh
npm run release
```

This bumps `26.1.0` to `26.2.0`.

Create a patch release:

```sh
npm run patch
```

This bumps `26.1.0` to `26.1.1`.

Build and upload Linux AppImage only:

```sh
npm run release:linux
```

The Linux AppImage workflow is located at:

```text
.github/workflows/linux-appimage-release.yml
```

## Requirements

- Node.js 20 or newer
- npm
- Inno Setup 6 for Windows installer builds
- GitHub CLI or `GH_TOKEN`/`GITHUB_TOKEN` for releases
- Linux runner/machine for AppImage builds

## Repository

```text
https://github.com/jonasgrimmde/AeroP2Pchat
```
