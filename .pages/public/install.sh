#!/usr/bin/env sh
set -eu

APP_NAME="Aero P2P Chat"
APP_ID="de.zorblock.aerop2pchat"
APP_SLUG="aero-p2p-chat"
PACKAGE_NAME="aero-p2p-chat"
CLI_COMMAND_NAME="aerop2p"
APPIMAGE_RELEASE_NAME="Aero-P2P-Chat-Linux-x64.AppImage"
APPIMAGE_INSTALL_NAME="Aero-P2P-Chat.AppImage"
REPO="Zorblock/AeroP2Pchat"
RELEASE_BASE="https://github.com/${REPO}/releases/latest/download"
PAGES_BASE="https://aero.zorblock.de"
FALLBACK_PAGES_BASE="https://zorblock.github.io/AeroP2Pchat"

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
    printf '%s\n' "$(color dim '  =====================================================')"
}

title() {
    printf '\n'
    printf '%s\n' "$(color cyan '  =====================================================')"
    printf '%s\n' "$(color cyan '       A E R O   P 2 P   C H A T')"
    printf '%s\n' "$(color cyan '  =====================================================')"
    printf '\n'
    printf '%s%s%s\n' "$(color dim '  |')" "$(color bold '             Linux Installer & Manager              ')" "$(color dim '|')"
    printf '%s\n' "$(color dim '  -----------------------------------------------------')"
    printf '\n'
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
    if [ -f "$VERSION_PATH" ]; then
        cat "$VERSION_PATH"
    elif has_system_package; then
        get_system_package_version
    else
        printf 'not installed'
    fi
}

is_installed() {
    [ -f "$APPIMAGE_PATH" ] && [ -x "$APPIMAGE_PATH" ]
}

is_deb_installed() {
    command -v dpkg-query >/dev/null 2>&1 && \
        [ "$(dpkg-query -W -f='${db:Status-Status}' "$PACKAGE_NAME" 2>/dev/null || true)" = "installed" ]
}

is_rpm_installed() {
    command -v rpm >/dev/null 2>&1 && rpm -q "$PACKAGE_NAME" >/dev/null 2>&1
}

has_system_package() {
    is_deb_installed || is_rpm_installed
}

has_any_installation() {
    is_installed || has_system_package
}

get_system_package_format() {
    if is_deb_installed; then
        printf 'deb'
    elif is_rpm_installed; then
        printf 'rpm'
    fi
}

get_system_package_version() {
    if is_deb_installed; then
        dpkg-query -W -f='${Version}' "$PACKAGE_NAME" 2>/dev/null | sed 's/-[^-]*$//'
    elif is_rpm_installed; then
        rpm -q --qf '%{VERSION}' "$PACKAGE_NAME" 2>/dev/null
    fi
}

get_installed_format() {
    if is_installed; then
        printf 'appimage'
    else
        get_system_package_format
    fi
}

refresh_desktop_integration() {
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
    fi
    if command -v gtk-update-icon-cache >/dev/null 2>&1; then
        gtk-update-icon-cache -q "$DATA_HOME/icons/hicolor" >/dev/null 2>&1 || true
    fi
}

remove_appimage_installation() {
    if ! is_installed && [ ! -e "$DESKTOP_PATH" ] && [ ! -e "$ICON_PATH" ]; then
        return
    fi

    info "Removing existing AppImage installation..."
    rm -f "$APPIMAGE_PATH" "$VERSION_PATH" "$DESKTOP_PATH" "$ICON_PATH" "$OLD_ICON_DIR/${APP_ID}.png"
    rmdir "$INSTALL_DIR" >/dev/null 2>&1 || true
    refresh_desktop_integration
}

remove_deb_package() {
    if ! is_deb_installed; then
        return
    fi

    info "Removing existing DEB installation..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get remove -y "$PACKAGE_NAME"
    else
        sudo dpkg -r "$PACKAGE_NAME"
    fi
}

remove_rpm_package() {
    if ! is_rpm_installed; then
        return
    fi

    info "Removing existing RPM installation..."
    if command -v dnf >/dev/null 2>&1; then
        sudo dnf remove -y "$PACKAGE_NAME"
    elif command -v zypper >/dev/null 2>&1; then
        sudo zypper --non-interactive remove "$PACKAGE_NAME"
    elif command -v yum >/dev/null 2>&1; then
        sudo yum remove -y "$PACKAGE_NAME"
    else
        sudo rpm -e "$PACKAGE_NAME"
    fi
}

# Keep settings in ~/.config/Aero P2P Chat untouched while changing the
# delivery format. The download is always verified before this function runs.
prepare_target_format() {
    target_format="$1"
    close_running_instances

    case "$target_format" in
        appimage)
            remove_deb_package
            remove_rpm_package
            ;;
        deb)
            remove_rpm_package
            remove_appimage_installation
            ;;
        rpm)
            remove_deb_package
            remove_appimage_installation
            ;;
        *) fail "Unsupported installer format: $target_format" ;;
    esac
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
            curl -fsSL "$INSTALLER_URL" | bash -s -- "\$command" || curl -fsSL "${FALLBACK_PAGES_BASE}/install.sh" | bash -s -- "\$command"
        elif command -v wget >/dev/null 2>&1; then
            wget -qO- "$INSTALLER_URL" | bash -s -- "\$command" || wget -qO- "${FALLBACK_PAGES_BASE}/install.sh" | bash -s -- "\$command"
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
    refresh_desktop_integration
}

install_icon() {
    mkdir -p "$ICON_DIR"
    tmp_icon="$(mktemp)"
    if download "$ICON_URL" "$tmp_icon"; then
        mv "$tmp_icon" "$ICON_PATH"
        rm -f "$OLD_ICON_DIR/${APP_ID}.png"
        refresh_desktop_integration
    else
        rm -f "$tmp_icon"
        warn "Icon download failed. The app will still work."
    fi
}

print_paths() {
    printf '\n'
    installed_format="$(get_installed_format || true)"
    [ -n "$installed_format" ] || installed_format="not installed"
    printf '   %s %s\n' "$(color dim 'Format:  ')" "$(format_name "$installed_format")"
    if is_installed; then
        printf '   %s %s\n' "$(color dim 'AppImage:')" "$APPIMAGE_PATH"
    fi
    printf '   %s %s\n' "$(color dim 'App cmd: ')" "$BIN_PATH"
    printf '   %s %s\n' "$(color dim 'CLI cmd: ')" "$CLI_PATH"
    printf '   %s %s\n' "$(color dim 'Launcher:')" "$DESKTOP_PATH"
    printf '   %s %s\n' "$(color dim 'App data:')" "$APP_DATA_DIR"
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

print_update_commands() {
    printf '\n'
    printf '   %s\n' "$(color bold 'Update methods:')"
    printf '   %s %s\n' "$(color cyan '1.')" "$CLI_COMMAND_NAME update"
    printf '   %s %s\n' "$(color cyan '2.')" "bash <(curl -fsSL ${INSTALLER_URL}) update"
    printf '   %s %s\n' "$(color cyan '3.')" "bash <(curl -fsSL ${FALLBACK_PAGES_BASE}/install.sh) update"
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
    if ! has_any_installation; then
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

detect_best_format() {
    if command -v apt-get >/dev/null 2>&1; then echo "deb"; return; fi
    if command -v dnf >/dev/null 2>&1 || command -v zypper >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then echo "rpm"; return; fi
    echo "appimage"
}

format_name() {
    case "$1" in
        deb) echo "DEB (Debian/Ubuntu/Mint)" ;;
        rpm) echo "RPM (Fedora/RedHat/SUSE)" ;;
        appimage) echo "AppImage (Portable)" ;;
        *) echo "$1" ;;
    esac
}

pause_for_menu() {
    # Interactive menus are read from /dev/tty. Do not block scripted calls
    # such as `install.sh update` when no terminal is attached.
    if [ ! -r /dev/tty ]; then
        return
    fi
    printf '\n'
    prompt_input "   Press Enter to return to the menu..." >/dev/null
}

show_menu() {
    while :; do
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
    
    best_format="$(detect_best_format)"
    
    # Status Banner
    if [ "$installed_version" = "not installed" ]; then
        printf '   %s %s\n' "Status:" "$(color yellow 'Not Installed')"
        printf '   %s %s\n' "Latest:" "$(color cyan "v${latest_version}")"
    else
        if [ "$installed_version" = "$latest_version" ]; then
            printf '   %s %s\n' "Status:" "$(color green "Installed & Up-to-date (v${installed_version})")"
        else
            printf '   %s %s\n' "Status:" "$(color green "Installed (v${installed_version})")"
            printf '   %s %s\n' "Latest:" "$(color yellow "v${latest_version} (Update available!)")"
            print_update_commands
        fi
    fi
    printf '\n'
    
    # Menu Options
    printf '   %s\n' "$(color bold "1) Auto Install [Recommended: $(format_name "$best_format")]")"
    printf '   %s\n' "$(color cyan '2) Install DEB (Debian/Ubuntu/Mint)')"
    printf '   %s\n' "$(color cyan '3) Install RPM (Fedora/RedHat/SUSE)')"
    printf '   %s\n' "$(color cyan '4) Install AppImage (Portable, automatic updates)')"
    
    opt_uninstall=0
    opt_index=5
    if has_any_installation; then
        printf '   %s\n' "$(color red "$opt_index) Uninstall ${APP_NAME}")"
        opt_uninstall=$opt_index
        opt_index=$((opt_index + 1))
    fi
    
    printf '   %s\n' "$(color dim "$opt_index) Exit")"
    opt_exit=$opt_index
    
    printf '\n'
    choice="$(prompt_input "   Select an option [1-$opt_index]: ")"
    printf '\n'
    
    rm -f "$tmp_manifest"
    trap - EXIT
    
    case "$choice" in
        1) install_app "$best_format" "$latest_version" ;;
        2) install_app "deb" "$latest_version" ;;
        3) install_app "rpm" "$latest_version" ;;
        4) install_app "appimage" "$latest_version" ;;
        $opt_uninstall)
            if [ "$opt_uninstall" -gt 0 ]; then
                if confirm_action "Run Uninstall?"; then
                    uninstall_app
                fi
            else
                warn "Invalid choice."
            fi
        ;;
        $opt_exit) return ;;
        *)
            warn "Invalid choice."
        ;;
    esac

    pause_for_menu
    done
}

install_dependencies() {
    needs_fuse=0
    if ! command -v fusermount >/dev/null 2>&1 && [ ! -f /lib/x86_64-linux-gnu/libfuse.so.2 ] && [ ! -f /usr/lib/libfuse.so.2 ] && [ ! -f /usr/lib64/libfuse.so.2 ]; then
        needs_fuse=1
    fi

    needs_dl=0
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        needs_dl=1
    fi

    if [ "$needs_fuse" -eq 0 ] && [ "$needs_dl" -eq 0 ]; then
        return 0
    fi

    info "Installing missing dependencies (sudo privileges may be required)..."

    if command -v apt-get >/dev/null 2>&1; then
        deps=""
        [ "$needs_fuse" -eq 1 ] && deps="$deps libfuse2"
        [ "$needs_dl" -eq 1 ] && deps="$deps curl"
        sudo apt-get update
        sudo apt-get install -y $deps
    elif command -v pacman >/dev/null 2>&1; then
        deps=""
        [ "$needs_fuse" -eq 1 ] && deps="$deps fuse2"
        [ "$needs_dl" -eq 1 ] && deps="$deps curl"
        sudo pacman -Sy --noconfirm $deps
    elif command -v dnf >/dev/null 2>&1; then
        deps=""
        [ "$needs_fuse" -eq 1 ] && deps="$deps fuse"
        [ "$needs_dl" -eq 1 ] && deps="$deps curl"
        sudo dnf install -y $deps
    elif command -v zypper >/dev/null 2>&1; then
        deps=""
        [ "$needs_fuse" -eq 1 ] && deps="$deps libfuse2"
        [ "$needs_dl" -eq 1 ] && deps="$deps curl"
        sudo zypper install -y $deps
    else
        warn "Unsupported package manager. Please install dependencies manually: libfuse2, curl"
    fi
}

install_app() {
    format="${1:-$(detect_best_format)}"
    target_version="$2"
    
    if [ "$format" = "appimage" ]; then
        install_appimage
        return
    fi
    
    tmp_manifest="$(mktemp)"
    if fetch_manifest "$tmp_manifest"; then
        if [ "$target_version" = "unknown" ] || [ -z "$target_version" ]; then
        target_version="$(get_latest_version "$tmp_manifest")"
        fi
    else
        rm -f "$tmp_manifest"
        fail "Could not retrieve latest release metadata."
    fi
    
    file_name="Aero-P2P-Chat-Linux-x64.${format}"
    case "$format" in
        deb)
            download_url="$(read_manifest_value "linuxDebUrl" "$tmp_manifest")"
            expected_sha256="$(read_manifest_value "linuxDebSha256" "$tmp_manifest")"
            ;;
        rpm)
            download_url="$(read_manifest_value "linuxRpmUrl" "$tmp_manifest")"
            expected_sha256="$(read_manifest_value "linuxRpmSha256" "$tmp_manifest")"
            ;;
        *)
            rm -f "$tmp_manifest"
            fail "Unsupported installer format: $format"
            ;;
    esac
    rm -f "$tmp_manifest"
    [ -n "$download_url" ] || download_url="${RELEASE_BASE}/${file_name}"
    tmp_dir="$(mktemp -d)"
    # APT runs downloads as the restricted _apt user. mktemp creates a 0700
    # directory by default, so make this temporary package readable to _apt.
    chmod 755 "$tmp_dir"
    tmp_file="${tmp_dir}/${file_name}"
    
    info "Downloading $(format_name "$format") v${target_version}..."
    download "$download_url" "$tmp_file"
    verify_sha256 "$tmp_file" "${expected_sha256:-}" "$(format_name "$format")"
    chmod 644 "$tmp_file"
    
    # Only remove the previous format after the new file was downloaded and
    # verified. App data in ~/.config/Aero P2P Chat is deliberately retained.
    prepare_target_format "$format"
    info "Installing $(format_name "$format")... (sudo may be required)"
    case "$format" in
        deb)
            sudo apt-get install -y "$tmp_file"
            ;;
        rpm)
            if command -v dnf >/dev/null 2>&1; then
                sudo dnf install -y "$tmp_file"
            elif command -v zypper >/dev/null 2>&1; then
                sudo zypper install -y "$tmp_file"
            elif command -v yum >/dev/null 2>&1; then
                sudo yum install -y "$tmp_file"
            else
                sudo rpm -U "$tmp_file"
            fi
            ;;
    esac
    
    rm -rf "$tmp_dir"
    write_launcher
    write_terminal_command
    refresh_desktop_integration
    ok "Installation complete. Your existing settings were kept."
    print_paths
}

install_appimage() {

    title
    install_dependencies
    mkdir -p "$INSTALL_DIR"
    
    tmp_manifest="$(mktemp)"
    tmp_appimage="$(mktemp)"
    trap 'rm -f "$tmp_manifest" "$tmp_appimage"' EXIT
    
    fetch_manifest "$tmp_manifest"
    latest_version="$(get_latest_version "$tmp_manifest")"
    appimage_url="$(get_manifest_appimage_url "$tmp_manifest")"
    appimage_sha256="$(read_manifest_value "linuxSha256" "$tmp_manifest")"
    if [ -z "$appimage_sha256" ]; then
        appimage_sha256="$(read_manifest_value "linuxX64AppImageSha256" "$tmp_manifest")"
    fi
    installed_version="$(get_installed_version)"
    
    if is_installed; then
        printf '%s %s\n' "$(color dim 'Installed')" "$installed_version"
        printf '%s %s\n' "$(color dim 'Latest   ')" "$latest_version"
        if [ "$installed_version" = "$latest_version" ] && ! has_system_package; then
            ensure_terminal_integration
            ok "Already installed and up to date."
            print_paths
            return
        fi
        info "Updating to ${latest_version}..."
    elif has_system_package; then
        info "Switching from $(format_name "$(get_system_package_format)") to AppImage ${latest_version}..."
    else
        info "Installing ${latest_version}..."
    fi
    
    download "$appimage_url" "$tmp_appimage"
    verify_sha256 "$tmp_appimage" "$appimage_sha256" "AppImage"
    prepare_target_format "appimage"
    chmod +x "$tmp_appimage"
    mv "$tmp_appimage" "$APPIMAGE_PATH"
    printf '%s\n' "$latest_version" > "$VERSION_PATH"
    
    write_launcher
    write_terminal_command
    install_icon
    write_desktop_entry
    
    ok "${APP_NAME} ${latest_version} installed. Your existing settings were kept."
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
    
    printf '   %s %s\n' "Installed:" "$(color cyan "$installed_version")"
    printf '   %s %s\n' "Latest:   " "$(color cyan "$latest_version")"
    printf '\n'
    
    if has_any_installation; then
        if [ "$latest_version" != "unknown" ] && [ "$installed_version" = "$latest_version" ]; then
            ensure_terminal_integration
            ok "You are up to date."
        elif [ "$latest_version" != "unknown" ]; then
            warn "Update available."
            print_update_commands
        else
            ok "Installed."
        fi
    else
        warn "Not installed."
    fi
    print_paths
}

uninstall_app() {
    title
    if ! has_any_installation && [ ! -e "$BIN_PATH" ] && [ ! -e "$CLI_PATH" ] && [ ! -e "$DESKTOP_PATH" ]; then
        warn "${APP_NAME} is not installed."
        return
    fi
    
    keep_user_data=1
    if [ -e "$APP_DATA_DIR" ] && ! confirm_keep_user_data; then
        keep_user_data=0
    fi
    
    close_running_instances
    remove_appimage_installation
    remove_deb_package
    remove_rpm_package
    rm -f "$BIN_PATH" "$CLI_PATH"
    refresh_desktop_integration
    
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
  bash <(curl -s <installer-url>)
  bash <(curl -s <installer-url>) -s -- status
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
