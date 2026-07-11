const fs = require('fs');

let content = fs.readFileSync('.pages/public/install.sh', 'utf8');

const newLogic = `detect_best_format() {
    if command -v apt-get >/dev/null 2>&1; then echo "deb"; return; fi
    if command -v dnf >/dev/null 2>&1 || command -v zypper >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then echo "rpm"; return; fi
    if command -v snap >/dev/null 2>&1; then echo "snap"; return; fi
    if command -v flatpak >/dev/null 2>&1; then echo "flatpak"; return; fi
    echo "appimage"
}

format_name() {
    case "$1" in
        deb) echo "DEB (Debian/Ubuntu/Mint)" ;;
        rpm) echo "RPM (Fedora/RedHat/SUSE)" ;;
        snap) echo "Snap (Ubuntu Software Center)" ;;
        flatpak) echo "Flatpak" ;;
        appimage) echo "AppImage (Portable)" ;;
        *) echo "$1" ;;
    esac
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
    
    best_format="$(detect_best_format)"
    
    printf '%s %s\\n' "$(color dim 'Installed')" "$installed_version"
    printf '%s %s\\n' "$(color dim 'Latest   ')" "$latest_version"
    printf '\\n'
    
    printf '%s\\n' "$(color bold "1 - Auto Install [Recommended: $(format_name "$best_format")]")"
    printf '%s\\n' "$(color cyan "2 - Install DEB")"
    printf '%s\\n' "$(color cyan "3 - Install RPM")"
    printf '%s\\n' "$(color cyan "4 - Install Snap")"
    printf '%s\\n' "$(color cyan "5 - Install Flatpak")"
    printf '%s\\n' "$(color cyan "6 - Install AppImage")"
    
    opt_uninstall=0
    opt_index=7
    if is_installed; then
        printf '%s\\n' "$(color red "$opt_index - Uninstall AppImage")"
        opt_uninstall=$opt_index
        opt_index=$((opt_index + 1))
    fi
    
    printf '%s\\n' "$(color dim "$opt_index - Exit")"
    opt_exit=$opt_index
    
    printf '\\n'
    choice="$(prompt_input "Choose an option [1-$opt_index]: ")"
    printf '\\n'
    
    rm -f "$tmp_manifest"
    trap - EXIT
    
    case "$choice" in
        1) install_app "$best_format" "$latest_version" ;;
        2) install_app "deb" "$latest_version" ;;
        3) install_app "rpm" "$latest_version" ;;
        4) install_app "snap" "$latest_version" ;;
        5) install_app "flatpak" "$latest_version" ;;
        6) install_app "appimage" "$latest_version" ;;
        $opt_uninstall)
            if [ "$opt_uninstall" -gt 0 ]; then
                if confirm_action "Run Uninstall?"; then
                    uninstall_app
                fi
            else
                fail "Unknown option: $choice"
            fi
        ;;
        $opt_exit) exit 0 ;;
        *)
            warn "Invalid choice."
            show_menu
        ;;
    esac
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
    format="\${1:-$(detect_best_format)}"
    target_version="$2"
    
    if [ "$format" = "appimage" ]; then
        install_appimage
        return
    fi
    
    if [ "$target_version" = "unknown" ] || [ -z "$target_version" ]; then
        tmp_manifest="$(mktemp)"
        fetch_manifest "$tmp_manifest"
        target_version="$(get_latest_version "$tmp_manifest")"
        rm -f "$tmp_manifest"
    fi
    
    file_name="Aero-P2P-Chat-Linux-x64.\${format}"
    download_url="\${RELEASE_BASE}/\${file_name}"
    tmp_file="$(mktemp -d)/\${file_name}"
    
    info "Downloading $(format_name "$format") v\${target_version}..."
    download "$download_url" "$tmp_file"
    
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
                sudo rpm -i "$tmp_file"
            fi
            ;;
        snap)
            sudo snap install --dangerous "$tmp_file"
            ;;
        flatpak)
            flatpak install --user -y "$tmp_file"
            ;;
    esac
    
    rm -rf "$(dirname "$tmp_file")"
    ok "Installation complete!"
    warn "Note: Native packages like DEB/RPM/Snap/Flatpak manage their own uninstallation via your system package manager."
}

install_appimage() {
`;

content = content.replace(/show_menu\(\) \{[\s\S]*?install_app\(\) \{/, newLogic);
fs.writeFileSync('.pages/public/install.sh', content, 'utf8');
