#!/usr/bin/env bash
set -euo pipefail

REPO="Zorblock/AeroP2Pchat"
BRANCH="main"
APP_NAME="Aero P2P Chat"
CLI_COMMAND="aerop2p"
APPIMAGE_NAME="Aero-P2P-Chat-Linux-x64.AppImage"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/aero-p2p-chat"
BIN_DIR="${XDG_BIN_HOME:-$HOME/.local/bin}"
APPIMAGE_PATH="$DATA_DIR/$APPIMAGE_NAME"
LAUNCHER_PATH="$BIN_DIR/$CLI_COMMAND"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
DESKTOP_PATH="$DESKTOP_DIR/de.zorblock.aerop2pchat.desktop"
MANIFEST_URL="https://github.com/$REPO/releases/latest/download/latest.yml"
INSTALL_URL="https://raw.githubusercontent.com/$REPO/$BRANCH/install.sh"

fail() {
  printf '%s\n' "Error: $*" >&2
  exit 1
}

need_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

read_manifest_value() {
  local key="$1"
  local manifest="$2"
  sed -n -E "s/^$key:[[:space:]]*\"?([^\"\r\n]+)\"?[[:space:]]*$/\1/p" "$manifest" | head -n 1
}

verify_sha256() {
  local file="$1"
  local expected="$2"
  [[ "$expected" =~ ^[A-Fa-f0-9]{64}$ ]] || fail "Release metadata has no valid Linux SHA-256."
  local actual
  actual="$(sha256sum "$file" | awk '{print $1}')"
  [[ "${actual,,}" == "${expected,,}" ]] || fail "Downloaded AppImage failed SHA-256 verification."
}

install_launcher() {
  mkdir -p "$BIN_DIR" "$DESKTOP_DIR"
  cat >"$LAUNCHER_PATH" <<EOF
#!/usr/bin/env bash
set -euo pipefail
APPIMAGE_PATH="$APPIMAGE_PATH"
INSTALL_URL="$INSTALL_URL"
if [[ "\${1:-}" == "update" ]]; then
  command -v curl >/dev/null 2>&1 || { echo "curl is required to update $APP_NAME." >&2; exit 1; }
  exec bash <(curl --fail --location --silent --show-error "\$INSTALL_URL") update
fi
[[ -x "\$APPIMAGE_PATH" ]] || { echo "$APP_NAME is not installed. Run the installer again." >&2; exit 1; }
exec "\$APPIMAGE_PATH" "\$@"
EOF
  chmod 755 "$LAUNCHER_PATH"

  cat >"$DESKTOP_PATH" <<EOF
[Desktop Entry]
Type=Application
Name=$APP_NAME
Exec=$LAUNCHER_PATH
Icon=applications-internet
Categories=Network;Chat;
Terminal=false
EOF
}

main() {
  local mode="${1:-install}"
  [[ "$mode" == "install" || "$mode" == "update" ]] ||
    fail "Usage: $CLI_COMMAND [install|update]"

  need_command curl
  need_command sha256sum
  need_command awk
  need_command sed

  mkdir -p "$DATA_DIR"
  local manifest_path
  local download_path
  manifest_path="$(mktemp "$DATA_DIR/.latest.XXXXXX.yml")"
  download_path="$(mktemp "$DATA_DIR/.download.XXXXXX.AppImage")"
  trap 'rm -f "$manifest_path" "$download_path"' EXIT

  curl --fail --location --retry 2 --connect-timeout 15 --max-time 90 \
    --silent --show-error "$MANIFEST_URL" -o "$manifest_path"

  local version linux_url linux_sha256 expected_prefix
  version="$(read_manifest_value version "$manifest_path")"
  linux_url="$(read_manifest_value linuxUrl "$manifest_path")"
  linux_sha256="$(read_manifest_value linuxSha256 "$manifest_path")"
  expected_prefix="https://github.com/$REPO/releases/download/v"

  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    fail "Release metadata has no valid version."
  [[ "$linux_url" == "$expected_prefix"*"/$APPIMAGE_NAME" ]] ||
    fail "Release metadata has an unexpected Linux download URL."

  printf '%s\n' "Downloading $APP_NAME $version..."
  curl --fail --location --retry 2 --connect-timeout 15 --max-time 900 \
    --silent --show-error "$linux_url" -o "$download_path"
  verify_sha256 "$download_path" "$linux_sha256"

  chmod 755 "$download_path"
  mv -f "$download_path" "$APPIMAGE_PATH"
  install_launcher

  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) printf '%s\n' "Add $BIN_DIR to PATH, then run: $CLI_COMMAND" ;;
  esac
  printf '%s\n' "$APP_NAME $version is ready."
}

main "$@"
