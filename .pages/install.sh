#!/usr/bin/env sh
set -eu

APP_NAME="Aero P2P Chat"
APP_ID="de.zorblock.aerop2pchat"
APP_SLUG="aero-p2p-chat"
CLI_COMMAND_NAME="aerop2p"
APPIMAGE_RELEASE_NAME="Aero-P2P-Chat-Linux-x64.AppImage"
APPIMAGE_INSTALL_NAME="Aero-P2P-Chat.AppImage"
REPO="Zorblock/AeroP2Pchat"

RELEASE_BASE="https://github.com/${REPO}/releases/latest/download"
PAGES_BASE="https://zorblock.github.io/AeroP2Pchat"
APPIMAGE_URL="${RELEASE_BASE}/${APPIMAGE_RELEASE_NAME}"
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
AUTOSTART_PATH="${CONFIG_HOME}/autostart/aero-p2p-chat.desktop"

APPIMAGE_PATH="${INSTALL_DIR}/${APPIMAGE_INSTALL_NAME}"
VERSION_PATH="${INSTALL_DIR}/version"
BIN_PATH="${BIN_DIR}/${APP_SLUG}"
CLI_PATH="${BIN_DIR}/${CLI_COMMAND_NAME}"
DESKTOP_PATH="${APPLICATIONS_DIR}/${APP_ID}.desktop"
ICON_PATH="${ICON_DIR}/${APP_ID}.png"

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

title() {
    printf '\n'
    printf '%s\n' "$(color cyan '  =====================================================')"
    printf '%s\n' "$(color cyan '       A E R O   P 2 P   C H A T')"
    printf '%s\n' "$(color cyan '  =====================================================')"
    printf '\n'
    printf '%s%s%s\n' "$(color dim '  |')" "$(color bold '          Linux AppImage Installer & Manager         ')" "$(color dim '|')"
    printf '%s\n\n' "$(color dim '  -----------------------------------------------------')"
}

info() {
    printf '   %s %s\n' "$(color blue '[i]')" "$1"
}

ok() {
    printf '   %s %s\n' "$(color green '[OK]')" "$1"
}

warn() {
    printf '   %s %s\n' "$(color yellow '[!]')" "$1"
}

fail() {
    printf '   %s %s\n' "$(color red '[x]')" "$1" >&2
    exit 1
}

prompt_input() {
    prompt="$1"
    if [ -r /dev/tty ]; then
        printf '%s' "$prompt" >/dev/tty
        IFS= read -r prompt_answer </dev/tty
    else
        printf '%s' "$prompt"
        IFS= read -r prompt_answer || prompt_answer=""
    fi
    printf '%s' "$prompt_answer"
}

download() {
    url="$1"
    target="$2"
    if command -v curl >/dev/null 2>&1; then
        curl -fL --retry 2 --connect-timeout 10 --progress-bar "$url" -o "$target"
    elif command -v wget >/dev/null 2>&1; then
        wget --timeout=15 --tries=3 -O "$target" "$url"
    else
        fail "Install curl or wget first."
    fi
}

read_manifest_value() {
    key="$1"
    file="$2"
    sed -n "s/^${key}:[[:space:]]*//p" "$file" | head -n 1 | sed 's/^"//; s/"$//'
}

get_latest_version() {
    manifest="$1"
    version="$(read_manifest_value "version" "$manifest")"
    [ -n "$version" ] || fail "Could not read the latest version from latest.yml."
    printf '%s' "$version"
}

get_manifest_appimage_url() {
    manifest="$1"
    url="$(read_manifest_value "linuxUrl" "$manifest")"
    [ -n "$url" ] || url="$APPIMAGE_URL"
    printf '%s' "$url"
}

get_manifest_appimage_sha256() {
    manifest="$1"
    read_manifest_value "linuxSha256" "$manifest"
}

verify_sha256() {
    file="$1"
    expected="$2"
    if [ -z "$expected" ]; then
        warn "latest.yml has no Linux SHA256 value. The download cannot be verified."
        return
    fi

    actual=""
    if command -v sha256sum >/dev/null 2>&1; then
        actual="$(sha256sum "$file" | awk '{print $1}')"
    elif command -v shasum >/dev/null 2>&1; then
        actual="$(shasum -a 256 "$file" | awk '{print $1}')"
    else
        fail "Install sha256sum or shasum to verify the AppImage."
    fi

    expected="$(printf '%s' "$expected" | tr '[:upper:]' '[:lower:]')"
    actual="$(printf '%s' "$actual" | tr '[:upper:]' '[:lower:]')"
    [ "$actual" = "$expected" ] || fail "Downloaded AppImage SHA256 does not match latest.yml."
}

is_installed() {
    [ -f "$APPIMAGE_PATH" ] && [ -x "$APPIMAGE_PATH" ]
}

get_installed_version() {
    if [ -f "$VERSION_PATH" ]; then
        cat "$VERSION_PATH"
    else
        printf 'not installed'
    fi
}

fetch_manifest() {
    target="$1"
    info "Checking latest release..."
    download "$MANIFEST_URL" "$target"
}

refresh_desktop_integration() {
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
    fi
    if command -v gtk-update-icon-cache >/dev/null 2>&1; then
        gtk-update-icon-cache -q "$DATA_HOME/icons/hicolor" >/dev/null 2>&1 || true
    fi
}

write_launcher() {
    mkdir -p "$BIN_DIR"
    cat > "$BIN_PATH" <<EOF
#!/usr/bin/env sh
if [ -x "$APPIMAGE_PATH" ]; then
    exec "$APPIMAGE_PATH" "\$@"
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
case "\$command" in
    open|run|start)
        shift || true
        exec "$BIN_PATH" "\$@"
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
    help|--help|-h)
        cat <<HELP
$APP_NAME

Usage:
  $CLI_COMMAND_NAME open
  $CLI_COMMAND_NAME status
  $CLI_COMMAND_NAME update
  $CLI_COMMAND_NAME uninstall
  $CLI_COMMAND_NAME menu
HELP
        ;;
    *)
        printf '%s\n' "Unknown command: \$command" >&2
        exit 1
        ;;
esac
EOF
    chmod +x "$CLI_PATH"
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
StartupWMClass=${APP_ID}
EOF
}

install_icon() {
    mkdir -p "$ICON_DIR"
    tmp_icon="$(mktemp "${ICON_DIR}/.${APP_ID}.XXXXXX")"
    if download "$ICON_URL" "$tmp_icon"; then
        mv -f "$tmp_icon" "$ICON_PATH"
        rm -f "$OLD_ICON_DIR/${APP_ID}.png"
        return 0
    fi

    rm -f "$tmp_icon"
    return 1
}

repair_desktop_integration() {
    write_launcher
    write_terminal_command
    if [ ! -s "$ICON_PATH" ]; then
        if ! install_icon; then
            warn "The application icon could not be downloaded. Aero itself is installed."
        fi
    fi
    write_desktop_entry
    refresh_desktop_integration
}

print_paths() {
    printf '\n'
    printf '   %s %s\n' "$(color dim 'Format:  ')" "AppImage"
    printf '   %s %s\n' "$(color dim 'AppImage:')" "$APPIMAGE_PATH"
    printf '   %s %s\n' "$(color dim 'App cmd: ')" "$BIN_PATH"
    printf '   %s %s\n' "$(color dim 'CLI cmd: ')" "$CLI_PATH"
    printf '   %s %s\n' "$(color dim 'Launcher:')" "$DESKTOP_PATH"
    printf '   %s %s\n' "$(color dim 'App data:')" "$APP_DATA_DIR"
}

find_running_app_pids() {
    ps -eo pid=,args= 2>/dev/null | awk \
        -v self="$$" \
        -v appimage="$APPIMAGE_PATH" \
        -v app_id="$APP_ID" \
        -v app_name="$APP_NAME" '
        {
            pid = $1
            line = $0
            sub(/^[[:space:]]*[0-9]+[[:space:]]+/, "", line)
            if (pid == self || index(line, "install.sh") > 0) {
                next
            }
            if (index(line, appimage) > 0 || index(line, app_id) > 0 || index(line, app_name) > 0) {
                print pid
            }
        }
    ' || true
}

close_running_instances() {
    is_installed || return
    pids="$(find_running_app_pids | tr '\n' ' ')"
    [ -n "$pids" ] || return

    info "Closing running ${APP_NAME} instances..."
    # shellcheck disable=SC2086
    kill $pids >/dev/null 2>&1 || true

    waited=0
    while [ "$waited" -lt 10 ]; do
        remaining="$(find_running_app_pids | tr '\n' ' ')"
        if [ -z "$remaining" ]; then
            ok "Running instances closed."
            return
        fi
        sleep 1
        waited=$((waited + 1))
    done

    remaining="$(find_running_app_pids | tr '\n' ' ')"
    if [ -n "$remaining" ]; then
        warn "Forcing remaining ${APP_NAME} instances to close."
        # shellcheck disable=SC2086
        kill -9 $remaining >/dev/null 2>&1 || true
    fi
}

install_dependencies() {
    needs_fuse=0
    if ! command -v fusermount >/dev/null 2>&1 \
        && [ ! -f /lib/x86_64-linux-gnu/libfuse.so.2 ] \
        && [ ! -f /usr/lib/libfuse.so.2 ] \
        && [ ! -f /usr/lib64/libfuse.so.2 ]; then
        needs_fuse=1
    fi

    needs_download=0
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        needs_download=1
    fi

    if [ "$needs_fuse" -eq 0 ] && [ "$needs_download" -eq 0 ]; then
        return
    fi

    info "Installing missing AppImage dependencies (sudo may be required)..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update
        [ "$needs_download" -eq 0 ] || sudo apt-get install -y curl
        if [ "$needs_fuse" -eq 1 ]; then
            sudo apt-get install -y libfuse2 || sudo apt-get install -y libfuse2t64
        fi
    elif command -v pacman >/dev/null 2>&1; then
        deps=""
        [ "$needs_fuse" -eq 0 ] || deps="$deps fuse2"
        [ "$needs_download" -eq 0 ] || deps="$deps curl"
        # shellcheck disable=SC2086
        sudo pacman -S --needed --noconfirm $deps
    elif command -v dnf >/dev/null 2>&1; then
        deps=""
        [ "$needs_fuse" -eq 0 ] || deps="$deps fuse"
        [ "$needs_download" -eq 0 ] || deps="$deps curl"
        # shellcheck disable=SC2086
        sudo dnf install -y $deps
    elif command -v zypper >/dev/null 2>&1; then
        deps=""
        [ "$needs_fuse" -eq 0 ] || deps="$deps libfuse2"
        [ "$needs_download" -eq 0 ] || deps="$deps curl"
        # shellcheck disable=SC2086
        sudo zypper --non-interactive install $deps
    else
        warn "Install libfuse2 and curl manually if the AppImage does not start."
    fi
}

install_appimage() {
    title
    install_dependencies
    mkdir -p "$INSTALL_DIR"

    tmp_manifest="$(mktemp)"
    tmp_appimage="$(mktemp "${INSTALL_DIR}/.${APPIMAGE_INSTALL_NAME}.XXXXXX")"
    cleanup() {
        rm -f "$tmp_manifest" "$tmp_appimage"
    }
    trap cleanup EXIT HUP INT TERM

    fetch_manifest "$tmp_manifest"
    latest_version="$(get_latest_version "$tmp_manifest")"
    appimage_url="$(get_manifest_appimage_url "$tmp_manifest")"
    appimage_sha256="$(get_manifest_appimage_sha256 "$tmp_manifest")"
    installed_version="$(get_installed_version)"

    if is_installed && [ "$installed_version" = "$latest_version" ]; then
        repair_desktop_integration
        ok "Aero P2P Chat ${latest_version} is already installed and up to date."
        print_paths
        cleanup
        trap - EXIT HUP INT TERM
        return
    fi

    if is_installed; then
        info "Updating ${installed_version} to ${latest_version}..."
    else
        info "Installing ${latest_version}..."
    fi

    download "$appimage_url" "$tmp_appimage"
    verify_sha256 "$tmp_appimage" "$appimage_sha256"
    chmod +x "$tmp_appimage"

    close_running_instances
    mv -f "$tmp_appimage" "$APPIMAGE_PATH"
    printf '%s\n' "$latest_version" > "$VERSION_PATH"

    write_launcher
    write_terminal_command
    if ! install_icon; then
        warn "The application icon could not be downloaded. Aero itself is installed."
    fi
    write_desktop_entry
    refresh_desktop_integration

    cleanup
    trap - EXIT HUP INT TERM

    ok "${APP_NAME} ${latest_version} installed. Your existing settings were kept."
    print_paths
    if ! printf '%s' ":$PATH:" | grep -q ":$BIN_DIR:"; then
        warn "$BIN_DIR is not in PATH. Restart your shell to use: $CLI_COMMAND_NAME update"
    fi
}

print_update_commands() {
    printf '\n'
    printf '   %s\n' "$(color bold 'Update methods:')"
    printf '   %s %s\n' "$(color cyan '1.')" "$CLI_COMMAND_NAME update"
    printf '   %s %s\n' "$(color cyan '2.')" "bash <(curl -fsSL ${INSTALLER_URL}) update"
}

show_status() {
    title
    tmp_manifest="$(mktemp)"
    trap 'rm -f "$tmp_manifest"' EXIT HUP INT TERM

    installed_version="$(get_installed_version)"
    if fetch_manifest "$tmp_manifest"; then
        latest_version="$(get_latest_version "$tmp_manifest")"
    else
        latest_version="unknown"
    fi

    printf '   %s %s\n' "Installed:" "$(color cyan "$installed_version")"
    printf '   %s %s\n\n' "Latest:   " "$(color cyan "$latest_version")"

    if ! is_installed; then
        warn "Aero P2P Chat is not installed."
    elif [ "$latest_version" = "$installed_version" ]; then
        repair_desktop_integration
        ok "You are up to date."
    elif [ "$latest_version" != "unknown" ]; then
        warn "Update available."
        print_update_commands
    else
        ok "AppImage installed."
    fi
    print_paths
}

confirm_keep_user_data() {
    answer="$(prompt_input "Keep user data and settings? [Y/n] ")"
    case "$answer" in
        n|N|no|NO|No) return 1 ;;
        *) return 0 ;;
    esac
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
    rm -f \
        "$APPIMAGE_PATH" \
        "$VERSION_PATH" \
        "$BIN_PATH" \
        "$CLI_PATH" \
        "$DESKTOP_PATH" \
        "$ICON_PATH" \
        "$OLD_ICON_DIR/${APP_ID}.png" \
        "$AUTOSTART_PATH"
    rmdir "$INSTALL_DIR" >/dev/null 2>&1 || true
    refresh_desktop_integration

    ok "${APP_NAME} uninstalled."
    if [ "$keep_user_data" -eq 1 ]; then
        printf '%s\n' "$(color dim "Your app data was kept at: $APP_DATA_DIR")"
    else
        rm -rf "$APP_DATA_DIR"
        ok "User data removed."
    fi
}

pause_for_menu() {
    [ -r /dev/tty ] || return
    printf '\n'
    prompt_input "   Press Enter to return to the menu..." >/dev/null
}

show_menu() {
    while :; do
        title
        installed_version="$(get_installed_version)"
        printf '   %s %s\n\n' "Installed:" "$(color cyan "$installed_version")"
        printf '   %s\n' "$(color bold '1) Install or update AppImage')"

        if is_installed; then
            printf '   %s\n' "$(color cyan '2) Show status')"
            printf '   %s\n' "$(color red '3) Uninstall Aero P2P Chat')"
            printf '   %s\n' "$(color dim '4) Exit')"
            max_option=4
        else
            printf '   %s\n' "$(color dim '2) Exit')"
            max_option=2
        fi

        printf '\n'
        choice="$(prompt_input "   Select an option [1-${max_option}]: ")"
        printf '\n'

        if is_installed; then
            case "$choice" in
                1) install_appimage ;;
                2) show_status ;;
                3) uninstall_app ;;
                4) return ;;
                *) warn "Invalid choice." ;;
            esac
        else
            case "$choice" in
                1) install_appimage ;;
                2) return ;;
                *) warn "Invalid choice." ;;
            esac
        fi
        pause_for_menu
    done
}

print_help() {
    title
    cat <<EOF
Usage:
  sh install.sh           Open the AppImage installer menu
  sh install.sh install   Install or update the AppImage
  sh install.sh update    Install or update the AppImage
  sh install.sh status    Show installed and latest version
  sh install.sh uninstall Remove AppImage, launcher, commands, and icon
  sh install.sh help      Show this help

After installation:
  $APP_SLUG               Start ${APP_NAME}
  $CLI_COMMAND_NAME open  Start ${APP_NAME}
  $CLI_COMMAND_NAME status
  $CLI_COMMAND_NAME update
  $CLI_COMMAND_NAME uninstall

Installer:
  ${INSTALLER_URL}
EOF
}

case "$ACTION" in
    menu) show_menu ;;
    install|update) install_appimage ;;
    status) show_status ;;
    uninstall|remove) uninstall_app ;;
    help|--help|-h) print_help ;;
    *) fail "Unknown command: $ACTION. Run: sh install.sh help" ;;
esac
