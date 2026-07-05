# Aero P2P Chat

Aero P2P Chat is a compact Deno Desktop chat client for direct peer-to-peer conversations. It uses PeerJS/WebRTC data connections so chat messages travel peer-to-peer after both users are connected.

## Features

- Compact friends-list style layout
- Peer ID based direct chat
- Voice calls and screen sharing
- Native tray integration
- Config stored in the per-user app data directory
- Local Deno Desktop WebView builds for Windows and Linux
- Deno Desktop auto-update support through `latest.json` patch manifests

## Requirements

- Deno 2.9 or newer
- Node.js/npm for the Vite renderer build

Install or upgrade Deno:

```powershell
iwr https://deno.land/install.ps1 -useb | iex
deno upgrade
```

On Linux/macOS:

```sh
curl -fsSL https://deno.land/install.sh | sh
deno upgrade
```

## Development

```sh
npm install
deno task dev
```

The Deno backend is `src/deno/main.ts`. The renderer is still bundled with Vite from `src/renderer` into `dist/renderer`.

## Local Builds

Build every release artifact that works from this Windows host:

```sh
deno task build:all
```

Individual targets:

```sh
deno task build:windows
deno task build:windows:msi
deno task build:windows:portable
deno task build:linux
deno task build:linux:appimage
deno task build:linux:deb
deno task build:linux:rpm
deno task build:macos
```

Outputs are written to `dist/desktop`. Builds use `--backend webview`, so Chromium/CEF is not bundled. On Windows with Deno 2.9.1, the validated release set is Windows `.msi`, Windows portable directory, Linux `.AppImage`, Linux `.deb`, and Linux `.rpm`. macOS `.dmg` requires a macOS host because Deno uses `hdiutil`; the `.app` task is kept as `deno task build:macos`, but this Windows host is not used for macOS release artifacts.

## Auto Update

The app calls `Deno.autoUpdate()` with:

```text
https://zorblock.github.io/AeroP2Pchat/releases
```

Deno Desktop expects:

```text
https://zorblock.github.io/AeroP2Pchat/releases/latest.json
```

The manifest must follow Deno's `latest.json` format with a `version` and per-version `patches`. Deno Desktop applies staged updates on macOS and Linux. As of Deno 2.9, Windows auto-update patches can be downloaded/staged but are not applied by the launcher yet, so Windows users need a newly built MSI.

## How It Works

1. Start Aero P2P Chat.
2. Copy your Peer ID and send it to your chat partner.
3. Your chat partner pastes that ID into the connect field.
4. Once connected, both sides can send messages directly.

PeerJS is used for signaling. The actual chat data is sent over WebRTC peer-to-peer.

## Repository

```text
https://github.com/Zorblock/AeroP2Pchat
```
