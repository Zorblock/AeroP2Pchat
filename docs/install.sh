#!/usr/bin/env sh
set -eu

APP_NAME="Aero P2P Chat"
APP_ID="de.jonasgrimm.aerop2pchat"
APP_SLUG="aero-p2p-chat"
CLI_COMMAND_NAME="aerop2p"
APPIMAGE_RELEASE_NAME="Aero-P2P-Chat-Linux-x64.AppImage"
APPIMAGE_INSTALL_NAME="Aero-P2P-Chat.AppImage"
DEB_RELEASE_NAME="Aero-P2P-Chat-Linux-x64.deb"
REPO="Zorblock/AeroP2Pchat"
RELEASE_BASE="https://github.com/${REPO}/releases/latest/download"
PAGES_BASE="https://zorblock.github.io/AeroP2Pchat"

APPIMAGE_URL="${RELEASE_BASE}/${APPIMAGE_RELEASE_NAME}"
DEB_URL="${RELEASE_BASE}/${DEB_RELEASE_NAME}"
MANIFEST_URL="${RELEASE_BASE}/latest.yml"
INSTALLER_URL="${PAGES_BASE}/install.sh"
ICON_URL="${PAGES_BASE}/logo.png"

DATA_HOME="${XDG_DATA_HOME:-"$HOME/.local/share"}"
CONFIG_HOME="${XDG_CONFIG_HOME:-"$HOME/.config"}"
INSTALL_DIR="${DATA_HOME}/${APP_SLUG}"
BIN_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="${DATA_HOME}/applications"
ICON_SIZE="512x512"
ICON_DIR="${DATA_HOME}/icons/hicolor/${ICON_SIZE}/apps"
OLD_ICON_DIR="${DATA_HOME}/icons/hicolor/256x256/apps"
APP_DATA_DIR="${CONFIG_HOME}/Aero P2P Chat"

APPIMAGE_PATH="$INSTALL_DIR/${APPIMAGE_INSTALL_NAME}"
VERSION_PATH="$INSTALL_DIR/version"
BIN_PATH="$BIN_DIR/${APP_SLUG}"
CLI_PATH="$BIN_DIR/${CLI_COMMAND_NAME}"
DESKTOP_PATH="$APPLICATIONS_DIR/${APP_ID}.desktop"
ICON_PATH="$ICON_DIR/${APP_ID}.png"

ACTION="${1:-menu}"

color_enabled=0
if [ -t 1 ]; then
    color_enabled=1
fi

color() {
    name="$1"
    text="$2"
    if [ "$color_enabled" -eq 0 ]; then
        printf '%s' "$text"
        return
    fi
    case "$name" in
        dim) printf '\033[2m%s\033[0m' "$text" ;;
        red) printf '\033[31m%s\033[0m' "$text" ;;
        green) printf '\033[32m%s\033[0m' "$text" ;;
        yellow) printf '\033[33m%s\033[0m' "$text" ;;
        blue) printf '\033[34m%s\033[0m' "$text" ;;
        cyan) printf '\033[36m%s\033[0m' "$text" ;;
        bold) printf '\033[1m%s\033[0m' "$text" ;;
        *) printf '%s' "$text" ;;
    esac
}

line() {
    printf '%s\n' "$(color dim '----------------------------------------')"
}

title() {
    line
    printf '%s\n' "$(color bold "$APP_NAME Linux Installer")"
    line
}

info() {
    printf '%s %s\n' "$(color blue '>')" "$1"
}

ok() {
    printf '%s %s\n' "$(color green 'OK')" "$1"
}

warn() {
    printf '%s %s\n' "$(color yellow 'WARN')" "$1"
}

fail() {
    printf '%s %s\n' "$(color red 'ERROR')" "$1" >&2
    exit 1
}

prompt_input() {
    prompt="$1"
    if [ -r /dev/tty ]; then
        printf '%s' "$prompt" >/dev/tty
        IFS= read -r prompt_answer </dev/tty
    else
        printf '%s' "$prompt"
        IFS= read -r prompt_answer
    fi
    printf '%s' "$prompt_answer"
}

download() {
    url="$1"
    target="$2"
    if command -v curl >/dev/null 2>&1; then
        curl -fL --progress-bar "$url" -o "$target"
        elif command -v wget >/dev/null 2>&1; then
        wget -O "$target" "$url"
    else
        fail "Install curl or wget first."
    fi
}

read_manifest_value() {
    key="$1"
    file="$2"
    sed -n "s/^${key}:[[:space:]]*//p" "$file" | head -n 1 | sed 's/^"//; s/"$//'
}

get_manifest_appimage_url() {
    manifest="$1"
    url="$(read_manifest_value "linuxUrl" "$manifest")"
    if [ -z "$url" ]; then
        url="$(read_manifest_value "linuxX64AppImageUrl" "$manifest")"
    fi
    if [ -z "$url" ]; then
        url="$APPIMAGE_URL"
    fi
    printf '%s' "$url"
}

get_manifest_deb_url() {
    manifest="$1"
    url="$(read_manifest_value "linuxX64DebUrl" "$manifest")"
    if [ -z "$url" ]; then
        url="$DEB_URL"
    fi
    printf '%s' "$url"
}

verify_sha256() {
    file="$1"
    expected="$2"
    label="${3:-download}"
    if [ -z "$expected" ]; then
        return
    fi

    actual=""
    if command -v sha256sum >/dev/null 2>&1; then
        actual="$(sha256sum "$file" | awk '{print $1}')"
    elif command -v shasum >/dev/null 2>&1; then
        actual="$(shasum -a 256 "$file" | awk '{print $1}')"
    else
        warn "Could not verify SHA256 because sha256sum/shasum is missing."
        return
    fi

    expected="$(printf '%s' "$expected" | tr '[:upper:]' '[:lower:]')"
    actual="$(printf '%s' "$actual" | tr '[:upper:]' '[:lower:]')"
    if [ "$actual" != "$expected" ]; then
        fail "Downloaded ${label} SHA256 does not match latest.yml."
    fi
}

get_latest_version() {
    manifest="$1"
    version="$(read_manifest_value "version" "$manifest")"
    if [ -z "$version" ]; then
        fail "Could not read latest version from latest.yml."
    fi
    printf '%s' "$version"
}

get_installed_version() {
    if is_deb_installed; then
        deb_version="$(dpkg-query -W -f='${Version}' "$APP_SLUG" 2>/dev/null || true)"
        if [ -n "$deb_version" ]; then
            printf '%s' "$deb_version"
            return
        fi
    fi

    if [ -f "$VERSION_PATH" ]; then
        cat "$VERSION_PATH"
    else
        printf 'not installed'
    fi
}

is_installed() {
    is_deb_installed || { [ -f "$APPIMAGE_PATH" ] && [ -x "$APPIMAGE_PATH" ]; }
}

is_deb_capable() {
    command -v dpkg >/dev/null 2>&1 && { command -v apt-get >/dev/null 2>&1 || command -v apt >/dev/null 2>&1; }
}

is_deb_installed() {
    command -v dpkg-query >/dev/null 2>&1 && dpkg-query -W -f='${Status}' "$APP_SLUG" 2>/dev/null | grep -q "install ok installed"
}

run_privileged() {
    if [ "$(id -u)" -eq 0 ]; then
        "$@"
    elif command -v sudo >/dev/null 2>&1; then
        sudo "$@"
    elif command -v doas >/dev/null 2>&1; then
        doas "$@"
    else
        return 1
    fi
}

install_deb_package() {
    deb_path="$1"

    if command -v apt-get >/dev/null 2>&1; then
        run_privileged apt-get install --yes "$deb_path"
    elif command -v apt >/dev/null 2>&1; then
        run_privileged apt install --yes "$deb_path"
    else
        return 1
    fi
}

remove_deb_package() {
    if ! is_deb_installed; then
        return 0
    fi

    if command -v apt-get >/dev/null 2>&1; then
        run_privileged apt-get remove --yes "$APP_SLUG"
    elif command -v apt >/dev/null 2>&1; then
        run_privileged apt remove --yes "$APP_SLUG"
    elif command -v dpkg >/dev/null 2>&1; then
        run_privileged dpkg -r "$APP_SLUG"
    else
        return 1
    fi
}

write_launcher() {
    mkdir -p "$BIN_DIR"
  cat > "$BIN_PATH" <<EOF
#!/usr/bin/env sh
if [ -x "/usr/bin/$APP_SLUG" ]; then
    exec "/usr/bin/$APP_SLUG" "\$@"
fi
if [ -x "/opt/$APP_NAME/$APP_SLUG" ]; then
    exec "/opt/$APP_NAME/$APP_SLUG" "\$@"
fi
if [ -x "$APPIMAGE_PATH" ]; then
    exec "$APPIMAGE_PATH" "\$@"
fi
if command -v gtk-launch >/dev/null 2>&1; then
    exec gtk-launch "$APP_ID"
fi
printf '%s\n' "$APP_NAME is not installed." >&2
exit 1
EOF
    chmod +x "$BIN_PATH"
}

write_terminal_command() {
    mkdir -p "$BIN_DIR"
  cat > "$CLI_PATH" <<EOF
#!/usr/bin/env sh
set -eu

command="\${1:-help}"

print_help() {
    cat <<HELP
${APP_NAME}

Usage:
  $CLI_COMMAND_NAME <command>

Commands:
  open        Start ${APP_NAME}
  status      Show installed and latest version
  update      Install the latest release
  uninstall   Remove ${APP_NAME}
  menu        Open the installer menu
  help        Show this help
HELP
}

case "\$command" in
    open|run|start)
        shift || true
        exec "$BIN_PATH" "\$@"
    ;;
    help|--help|-h)
        print_help
    ;;
    install|update|status|uninstall|remove|menu)
        if command -v curl >/dev/null 2>&1; then
            curl -fsSL "$INSTALLER_URL" | sh -s -- "\$command"
        elif command -v wget >/dev/null 2>&1; then
            wget -qO- "$INSTALLER_URL" | sh -s -- "\$command"
        else
            printf '%s\n' "Install curl or wget first." >&2
            exit 1
        fi
    ;;
    *)
        print_help
        exit 1
    ;;
esac
EOF
    chmod +x "$CLI_PATH"
}

ensure_terminal_integration() {
    needs_repair=0
    if [ ! -x "$BIN_PATH" ] || ! grep -F "$APP_SLUG" "$BIN_PATH" >/dev/null 2>&1; then
        needs_repair=1
    fi
    if [ ! -x "$CLI_PATH" ] || ! grep -F "$INSTALLER_URL" "$CLI_PATH" >/dev/null 2>&1; then
        needs_repair=1
    fi

    if [ "$needs_repair" -eq 1 ]; then
        info "Repairing terminal commands..."
        write_launcher
        write_terminal_command
        ok "Terminal commands ready."
    fi
}

write_desktop_entry() {
    mkdir -p "$APPLICATIONS_DIR"
  cat > "$DESKTOP_PATH" <<EOF
[Desktop Entry]
Type=Application
Name=${APP_NAME}
Comment=Peer-to-peer chat client
Exec=${APPIMAGE_PATH} %U
Icon=${APP_ID}
Terminal=false
Categories=Network;InstantMessaging;Chat;
StartupWMClass=${APP_NAME}
EOF
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
    fi
}

install_icon() {
    mkdir -p "$ICON_DIR"
    tmp_icon="$(mktemp)"
    if download "$ICON_URL" "$tmp_icon"; then
        mv "$tmp_icon" "$ICON_PATH"
        rm -f "$OLD_ICON_DIR/${APP_ID}.png"
        if command -v gtk-update-icon-cache >/dev/null 2>&1; then
            gtk-update-icon-cache -q "$DATA_HOME/icons/hicolor" >/dev/null 2>&1 || true
        fi
    else
        rm -f "$tmp_icon"
        warn "Icon download failed. The app will still work."
    fi
}

print_paths() {
    if is_deb_installed; then
        printf '%s %s\n' "$(color dim 'Package ')" "$APP_SLUG"
    fi
    printf '%s %s\n' "$(color dim 'AppImage')" "$APPIMAGE_PATH"
    printf '%s %s\n' "$(color dim 'App cmd ')" "$BIN_PATH"
    printf '%s %s\n' "$(color dim 'CLI cmd ')" "$CLI_PATH"
    printf '%s %s\n' "$(color dim 'Launcher')" "$DESKTOP_PATH"
    printf '%s %s\n' "$(color dim 'App data')" "$APP_DATA_DIR"
}

fetch_manifest() {
    target="$1"
    info "Checking latest release..."
    download "$MANIFEST_URL" "$target"
}

confirm_action() {
    prompt="$1"
    answer="$(prompt_input "$prompt [y/N] ")"
    case "$answer" in
        y|Y|yes|YES|Yes) return 0 ;;
        *) return 1 ;;
    esac
}

confirm_keep_user_data() {
    answer="$(prompt_input "Keep user data and settings? [Y/n] ")"
    case "$answer" in
        n|N|no|NO|No) return 1 ;;
        *) return 0 ;;
    esac
}

find_running_app_pids() {
    ps -eo pid=,args= 2>/dev/null | awk \
    -v self="$$" \
    -v appimage="$APPIMAGE_PATH" \
    -v bin="$BIN_PATH" \
    -v app_id="$APP_ID" \
    -v app_name="$APP_NAME" \
    -v app_slug="$APP_SLUG" '
      {
        pid = $1
        line = $0
        sub(/^[[:space:]]*[0-9]+[[:space:]]+/, "", line)

        if (pid == self) {
          next
        }
        if (index(line, "install.sh") > 0 || index(line, " app_slug=") > 0) {
          next
        }

        if (index(line, appimage) > 0 || index(line, bin) > 0 || index(line, app_id) > 0 || index(line, app_name) > 0 || index(line, app_slug) > 0) {
          print pid
        }
      }
    ' || true
}

close_running_instances() {
    if ! is_installed; then
        return
    fi
    
    pids="$(find_running_app_pids | tr '\n' ' ')"
    if [ -z "$pids" ]; then
        return
    fi
    
    info "Closing running ${APP_NAME} instances..."
    # shellcheck disable=SC2086
    kill $pids >/dev/null 2>&1 || true
    
    wait_seconds=0
    while [ "$wait_seconds" -lt 10 ]; do
        remaining="$(find_running_app_pids | tr '\n' ' ')"
        if [ -z "$remaining" ]; then
            ok "Running instances closed."
            return
        fi
        sleep 1
        wait_seconds=$((wait_seconds + 1))
    done
    
    remaining="$(find_running_app_pids | tr '\n' ' ')"
    if [ -n "$remaining" ]; then
        warn "Forcing remaining ${APP_NAME} instances to close."
        # shellcheck disable=SC2086
        kill -9 $remaining >/dev/null 2>&1 || true
    fi
}

show_menu() {
    title
    tmp_manifest="$(mktemp)"
    trap 'rm -f "$tmp_manifest"' EXIT
    
    installed_version="$(get_installed_version)"
    latest_version="unknown"
    if fetch_manifest "$tmp_manifest"; then
        latest_version="$(get_latest_version "$tmp_manifest")"
    else
        warn "Could not check latest release."
    fi
    
    printf '%s %s\n' "$(color dim 'Installed')" "$installed_version"
    printf '%s %s\n' "$(color dim 'Latest   ')" "$latest_version"
    printf '\n'
    
    install_label="Install"
    if is_installed && [ "$latest_version" != "unknown" ] && [ "$installed_version" != "$latest_version" ]; then
        install_label="Update"
        elif is_installed && [ "$latest_version" != "unknown" ] && [ "$installed_version" = "$latest_version" ]; then
        install_label="Reinstall"
    fi
    
    printf '1 - %s\n' "$install_label"
    printf '2 - Uninstall\n'
    printf '\n'
    choice="$(prompt_input "Choose an option: ")"
    
    case "$choice" in
        1)
            if confirm_action "Run ${install_label}?"; then
                rm -f "$tmp_manifest"
                trap - EXIT
                install_app
            else
                warn "Cancelled."
            fi
        ;;
        2)
            if confirm_action "Run Uninstall?"; then
                rm -f "$tmp_manifest"
                trap - EXIT
                uninstall_app
            else
                warn "Cancelled."
            fi
        ;;
        *) fail "Unknown option: $choice" ;;
    esac
}

install_app() {
    title
    mkdir -p "$INSTALL_DIR"
    
    tmp_manifest="$(mktemp)"
    tmp_appimage="$(mktemp)"
    trap 'rm -f "$tmp_manifest" "$tmp_appimage"' EXIT
    
    fetch_manifest "$tmp_manifest"
    latest_version="$(get_latest_version "$tmp_manifest")"
    appimage_url="$(get_manifest_appimage_url "$tmp_manifest")"
    deb_url="$(get_manifest_deb_url "$tmp_manifest")"
    appimage_sha256="$(read_manifest_value "linuxSha256" "$tmp_manifest")"
    if [ -z "$appimage_sha256" ]; then
        appimage_sha256="$(read_manifest_value "linuxX64AppImageSha256" "$tmp_manifest")"
    fi
    deb_sha256="$(read_manifest_value "linuxX64DebSha256" "$tmp_manifest")"
    installed_version="$(get_installed_version)"
    
    if is_installed; then
        printf '%s %s\n' "$(color dim 'Installed')" "$installed_version"
        printf '%s %s\n' "$(color dim 'Latest   ')" "$latest_version"
        if [ "$installed_version" = "$latest_version" ]; then
            ensure_terminal_integration
            ok "Already installed and up to date."
            print_paths
            return
        fi
        info "Updating to ${latest_version}..."
        close_running_instances
    else
        info "Installing ${latest_version}..."
    fi

    if is_deb_capable && [ -n "$deb_url" ]; then
        tmp_deb="$(mktemp --suffix=.deb 2>/dev/null || mktemp)"
        trap 'rm -f "$tmp_manifest" "$tmp_appimage" "$tmp_deb"' EXIT

        info "Debian package support detected. Installing .deb package..."
        if download "$deb_url" "$tmp_deb"; then
            verify_sha256 "$tmp_deb" "$deb_sha256" "Debian package"
            if install_deb_package "$tmp_deb"; then
                rm -f "$APPIMAGE_PATH" "$VERSION_PATH" "$DESKTOP_PATH" "$ICON_PATH" "$OLD_ICON_DIR/${APP_ID}.png"
                rmdir "$INSTALL_DIR" >/dev/null 2>&1 || true
                write_launcher
                write_terminal_command
                ok "${APP_NAME} ${latest_version} installed from Debian package."
                print_paths
                if ! printf '%s' ":$PATH:" | grep -q ":$BIN_DIR:"; then
                    warn "$BIN_DIR is not in PATH. Restart your shell or add it to PATH to use: $CLI_COMMAND_NAME update"
                fi
                return
            fi
            warn "Debian package install failed or was cancelled. Falling back to AppImage."
        else
            warn "Debian package download failed. Falling back to AppImage."
        fi
    fi
    
    download "$appimage_url" "$tmp_appimage"
    verify_sha256 "$tmp_appimage" "$appimage_sha256" "AppImage"
    chmod +x "$tmp_appimage"
    mv "$tmp_appimage" "$APPIMAGE_PATH"
    printf '%s\n' "$latest_version" > "$VERSION_PATH"
    
    write_launcher
    write_terminal_command
    install_icon
    write_desktop_entry
    
    ok "${APP_NAME} ${latest_version} installed."
    print_paths
    if ! printf '%s' ":$PATH:" | grep -q ":$BIN_DIR:"; then
        warn "$BIN_DIR is not in PATH. Restart your shell or add it to PATH to use: $CLI_COMMAND_NAME update"
    fi
}

show_status() {
    title
    tmp_manifest="$(mktemp)"
    trap 'rm -f "$tmp_manifest"' EXIT
    
    installed_version="$(get_installed_version)"
    if fetch_manifest "$tmp_manifest"; then
        latest_version="$(get_latest_version "$tmp_manifest")"
    else
        latest_version="unknown"
    fi
    
    if is_installed; then
        ok "Installed"
    else
        warn "Not installed"
    fi
    printf '%s %s\n' "$(color dim 'Installed')" "$installed_version"
    printf '%s %s\n' "$(color dim 'Latest   ')" "$latest_version"
    
    if is_installed && [ "$latest_version" != "unknown" ]; then
        if [ "$installed_version" = "$latest_version" ]; then
            ensure_terminal_integration
            ok "Up to date."
        else
            warn "Update available. Run: $CLI_COMMAND_NAME update"
        fi
    fi
    print_paths
}

uninstall_app() {
    title
    if ! is_installed && [ ! -e "$BIN_PATH" ] && [ ! -e "$CLI_PATH" ] && [ ! -e "$DESKTOP_PATH" ]; then
        warn "${APP_NAME} is not installed."
        return
    fi
    
    keep_user_data=1
    if [ -e "$APP_DATA_DIR" ] && ! confirm_keep_user_data; then
        keep_user_data=0
    fi
    
    close_running_instances
    if is_deb_installed; then
        info "Removing Debian package..."
        if ! remove_deb_package; then
            warn "Could not remove Debian package automatically."
        fi
    fi
    rm -f "$APPIMAGE_PATH" "$VERSION_PATH" "$BIN_PATH" "$CLI_PATH" "$DESKTOP_PATH" "$ICON_PATH" "$OLD_ICON_DIR/${APP_ID}.png"
    rmdir "$INSTALL_DIR" >/dev/null 2>&1 || true
    
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
    fi
    if command -v gtk-update-icon-cache >/dev/null 2>&1; then
        gtk-update-icon-cache -q "$DATA_HOME/icons/hicolor" >/dev/null 2>&1 || true
    fi
    
    ok "${APP_NAME} uninstalled."
    if [ "$keep_user_data" -eq 1 ]; then
        printf '%s\n' "$(color dim "Your app data was kept at: $APP_DATA_DIR")"
    else
        rm -rf "$APP_DATA_DIR"
        ok "User data removed."
    fi
}

print_help() {
    title
  cat <<EOF
Usage:
  sh install.sh           Open installer menu
  sh install.sh install   Install or update ${APP_NAME}
  sh install.sh status    Show installed and latest version
  sh install.sh uninstall Remove app, launcher, commands, and icon
  sh install.sh help      Show this help

After install:
  $APP_SLUG               Start ${APP_NAME}
  $CLI_COMMAND_NAME open  Start ${APP_NAME}
  $CLI_COMMAND_NAME status
  $CLI_COMMAND_NAME update
  $CLI_COMMAND_NAME uninstall

Installer URL:
  ${INSTALLER_URL}

Examples:
  curl -fsSL <installer-url> | sh
  curl -fsSL <installer-url> | sh -s -- status
EOF
}

case "$ACTION" in
    menu) show_menu ;;
    install|update) install_app ;;
    status) show_status ;;
    uninstall|remove) uninstall_app ;;
    help|--help|-h) print_help ;;
    *) fail "Unknown command: $ACTION. Run: sh install.sh help" ;;
esac
