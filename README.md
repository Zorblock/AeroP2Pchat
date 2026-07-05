# Aero P2P Chat

[![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/Zorblock/AeroP2Pchat/total)](https://github.com/Zorblock/AeroP2Pchat/releases)
[![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/Zorblock/AeroP2Pchat/main)](https://github.com/Zorblock/AeroP2Pchat/blob/main/package.json)

Aero P2P Chat is a compact Electron desktop chat client for direct peer-to-peer conversations. It uses PeerJS/WebRTC data connections so chat messages travel peer-to-peer after both users are connected.

## Features

- Compact friends-list style layout
- Peer ID based direct chat
- Copy your own Peer ID
- Connect to another peer by entering their Peer ID
- Native desktop builds for Windows, Linux, and macOS
- Terminal commands for updates, status, opening, and uninstalling

## How It Works

1. Start Aero P2P Chat.
2. Copy your Peer ID and send it to your chat partner.
3. Your chat partner pastes that ID into the connect field.
4. Once connected, both sides can send messages directly.

PeerJS is used for signaling. That means you do not need to run your own server, but the app still needs PeerJS signaling to discover and connect peers. The actual chat data is sent over WebRTC peer-to-peer.

## Install On Windows

Download and run the latest Windows installer from GitHub Releases:

```text
https://github.com/Zorblock/AeroP2Pchat/releases/latest
```

The Windows release assets are:

```text
Aero-P2P-Chat-Windows-x64-Setup.exe
Aero-P2P-Chat-Windows-x64-Portable.exe
```

After installing, open a new terminal and use:

```powershell
aerop2p status
aerop2p update
aerop2p open
aerop2p uninstall
```

Available Windows CLI commands:

- `aerop2p status` shows the installed and latest version.
- `aerop2p update` downloads and starts the latest installer.
- `aerop2p open` starts Aero P2P Chat.
- `aerop2p uninstall` starts the Windows uninstaller.

The terminal command is removed again when Aero P2P Chat is uninstalled.

## Install On macOS

Download the latest universal macOS build from GitHub Releases:

```text
https://github.com/Zorblock/AeroP2Pchat/releases/latest
```

The macOS release assets are:

- `Aero-P2P-Chat-macOS-Universal.dmg`
- `Aero-P2P-Chat-macOS-Universal-Portable.zip`

## Install On Linux

Use the installer script from the GitHub repository:

```sh
curl -fsSL "https://zorblock.github.io/AeroP2Pchat/install.sh" | sh
```

After installing, use:

```sh
aerop2p status
aerop2p update
aerop2p open
aerop2p uninstall
```

Available Linux CLI commands:

- `aerop2p status` shows the installed and latest version.
- `aerop2p update` installs the latest release.
- `aerop2p open` starts Aero P2P Chat.
- `aerop2p uninstall` removes Aero P2P Chat.

You can still call the installer directly:

```sh
curl -fsSL "https://zorblock.github.io/AeroP2Pchat/install.sh" | sh -s -- status
curl -fsSL "https://zorblock.github.io/AeroP2Pchat/install.sh" | sh -s -- update
curl -fsSL "https://zorblock.github.io/AeroP2Pchat/install.sh" | sh -s -- uninstall
```

On Debian/Ubuntu-style systems, the Linux installer prefers the `.deb` package.
On other distributions, or if the package install is not available, it falls
back to the AppImage.

The Linux installer creates or manages:

- Debian package: `aero-p2p-chat` when `.deb` installation is available
- AppImage fallback: `~/.local/share/aero-p2p-chat/Aero-P2P-Chat.AppImage`
- App command: `~/.local/bin/aero-p2p-chat`
- CLI command: `~/.local/bin/aerop2p`
- Desktop entry: `~/.local/share/applications/de.jonasgrimm.aerop2pchat.desktop`
- Icon: `~/.local/share/icons/hicolor/512x512/apps/de.jonasgrimm.aerop2pchat.png`

The terminal command is removed again when Aero P2P Chat is uninstalled.

## Repository

```text
https://github.com/Zorblock/AeroP2Pchat
```

## Release Workflow

Releases are built by GitHub Actions. Run:

```sh
npm run release
```

The script bumps the patch version, runs the lightweight checks, commits the
release, pushes the branch so `build.yml` runs, then pushes the `v*` tag so
`cd.yml` builds the packages and creates the GitHub release.

Useful variants:

```sh
npm run release -- --minor
npm run release -- --major
npm run release -- --version=26.15.0
npm run release -- --no-bump
```
