#![windows_subsystem = "windows"]

use std::{
    cmp::Ordering,
    fs::{self, File},
    io::{Read, Write},
    path::PathBuf,
    process::Command,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering as AtomicOrdering},
    },
    thread,
    time::Duration,
};

use reqwest::{Url, blocking::Client};
use sha2::{Digest, Sha256};
use single_instance::SingleInstance;
use slint::{Color, ComponentHandle, SharedString, Weak};
#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
use winreg::{
    RegKey,
    enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE},
};
#[cfg(windows)]
use windows::{
    Win32::{
        Foundation::HWND,
        System::Com::{CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, CoCreateInstance, CoInitializeEx, CoUninitialize},
        UI::{
            Shell::{ITaskbarList3, ShellExecuteW, TBPF_NOPROGRESS, TBPF_NORMAL, TaskbarList},
            WindowsAndMessaging::{FindWindowW, SW_SHOWNORMAL},
        },
    },
    core::PCWSTR,
};

slint::include_modules!();

const REPOSITORY: &str = "Zorblock/AeroP2Pchat";
const INSTALLER_ASSET: &str = "Aero-P2P-Chat-Windows-x64-Setup.exe";
const TEMP_SETUP_DIRECTORY_PREFIX: &str = "aero-p2p-setup-";
const WINDOW_TITLE: &str = "Aero P2P Chat Online Installer";
const MICROSOFT_STORE_PACKAGE_FAMILY_NAME: &str = "Zorblock.AeroP2PChat_cgb7tdbkexs70";
const MICROSOFT_STORE_PRODUCT_URI: &str = "ms-windows-store://pdp/?productid=9MTXC0M7P403";
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let instance = SingleInstance::new("Zorblock.AeroP2PChat.OnlineInstaller.8B09B5D9")?;
    if !instance.is_single() {
        return Ok(());
    }

    let options = launch_options();
    let ui = MainWindow::new()?;
    apply_system_theme(&ui);
    let store_version = installed_microsoft_store_version();
    if let Some(store_version) = &store_version {
        configure_microsoft_store_update_ui(&ui, store_version, false);
    } else if let Some(installed_version) = installed_aero_version() {
        ui.set_version(format!(
            "Installed version: {installed_version} · Latest version will be checked after you continue."
        )
        .into());
    }
    let weak_ui = ui.as_weak();
    let switch_ui = ui.as_weak();
    let wait_for_pid = options.wait_for_pid;
    let store_install_state = Arc::new(Mutex::new(store_version.clone()));
    let store_install_state_for_install = Arc::clone(&store_install_state);
    ui.on_install(move || {
        let store_version = store_install_state_for_install.lock().ok().and_then(|state| state.clone());
        if let Some(store_version) = &store_version {
            open_microsoft_store_updates(&weak_ui, store_version);
        } else if let Some(pid) = wait_for_pid {
            wait_then_install(weak_ui.clone(), pid, true);
        } else {
            start_installation(weak_ui.clone());
        }
    });
    let is_waiting_for_store_removal = Arc::new(AtomicBool::new(false));
    let store_install_state_for_switch = Arc::clone(&store_install_state);
    let is_waiting_for_store_removal_for_switch = Arc::clone(&is_waiting_for_store_removal);
    ui.on_switch_to_windows_setup(move || {
        open_windows_setup_switch(
            &switch_ui,
            Arc::clone(&store_install_state_for_switch),
            Arc::clone(&is_waiting_for_store_removal_for_switch),
        );
    });

    if store_version.is_none() && let Some(pid) = options.wait_for_pid {
        wait_then_install(ui.as_weak(), pid, options.auto_install);
    }

    ui.run()?;
    Ok(())
}

#[derive(Default)]
struct LaunchOptions {
    wait_for_pid: Option<u32>,
    auto_install: bool,
}

struct UiTheme {
    window: Color,
    surface: Color,
    border: Color,
    text: Color,
    muted: Color,
    accent: Color,
    accent_pressed: Color,
    accent_text: Color,
    disabled: Color,
}

fn color(red: u8, green: u8, blue: u8) -> Color {
    Color::from_rgb_u8(red, green, blue)
}

fn system_prefers_dark_mode() -> bool {
    #[cfg(windows)]
    {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(personalize) = hkcu.open_subkey(
            "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
        ) {
            if let Ok(value) = personalize.get_value::<u32, _>("AppsUseLightTheme") {
                return value == 0;
            }
        }
    }

    false
}

fn system_theme() -> UiTheme {
    if system_prefers_dark_mode() {
        UiTheme {
            window: color(0, 0, 0),
            surface: color(10, 10, 10),
            border: color(35, 35, 35),
            text: color(245, 245, 245),
            muted: color(154, 154, 154),
            accent: color(242, 242, 242),
            accent_pressed: color(215, 215, 215),
            accent_text: color(5, 5, 5),
            disabled: color(56, 56, 56),
        }
    } else {
        UiTheme {
            window: color(234, 241, 245),
            surface: color(255, 255, 255),
            border: color(215, 226, 231),
            text: color(16, 41, 54),
            muted: color(106, 129, 140),
            accent: color(20, 127, 166),
            accent_pressed: color(11, 92, 123),
            accent_text: color(255, 255, 255),
            disabled: color(195, 210, 217),
        }
    }
}

fn apply_system_theme(ui: &MainWindow) {
    let theme = system_theme();
    ui.set_window_color(theme.window);
    ui.set_surface_color(theme.surface);
    ui.set_border_color(theme.border);
    ui.set_text_color(theme.text);
    ui.set_muted_color(theme.muted);
    ui.set_accent_color(theme.accent);
    ui.set_accent_pressed_color(theme.accent_pressed);
    ui.set_accent_text_color(theme.accent_text);
    ui.set_disabled_color(theme.disabled);
}

#[cfg(windows)]
struct TaskbarProgress {
    taskbar: ITaskbarList3,
    window: HWND,
    com_initialized: bool,
}

#[cfg(windows)]
impl TaskbarProgress {
    fn new() -> Option<Self> {
        let com_initialized = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED).is_ok() };
        let title: Vec<u16> = WINDOW_TITLE.encode_utf16().chain(std::iter::once(0)).collect();
        let window = unsafe { FindWindowW(None, PCWSTR(title.as_ptr())).ok()? };
        let taskbar: ITaskbarList3 = unsafe {
            CoCreateInstance(&TaskbarList, None, CLSCTX_INPROC_SERVER).ok()?
        };
        unsafe { taskbar.HrInit().ok()? };

        Some(Self {
            taskbar,
            window,
            com_initialized,
        })
    }

    fn set_progress(&self, progress: f32) {
        let completed = (progress.clamp(0.0, 1.0) * 10_000.0).round() as u64;
        unsafe {
            let _ = self.taskbar.SetProgressState(self.window, TBPF_NORMAL);
            let _ = self.taskbar.SetProgressValue(self.window, completed, 10_000);
        }
    }

    fn clear(&self) {
        unsafe {
            let _ = self.taskbar.SetProgressState(self.window, TBPF_NOPROGRESS);
        }
    }
}

#[cfg(windows)]
impl Drop for TaskbarProgress {
    fn drop(&mut self) {
        self.clear();
        if self.com_initialized {
            unsafe { CoUninitialize() };
        }
    }
}

#[cfg(not(windows))]
struct TaskbarProgress;

#[cfg(not(windows))]
impl TaskbarProgress {
    fn new() -> Option<Self> {
        None
    }

    fn set_progress(&self, _progress: f32) {}
}

fn launch_options() -> LaunchOptions {
    let mut options = LaunchOptions::default();
    for argument in std::env::args().skip(1) {
        if argument == "--auto-install" {
            options.auto_install = true;
        } else if let Some(pid) = argument.strip_prefix("--wait-for-pid=") {
            options.wait_for_pid = pid.parse().ok();
        }
    }
    options
}

fn start_installation(ui: Weak<MainWindow>) {
    update_ui(
        &ui,
        "Checking the newest release...",
        "Connecting securely to GitHub...",
        "Latest version: checking",
        0.0,
        "Installing...",
        false,
        true,
    );
    thread::spawn(move || {
        if let Err(error) = install_latest(&ui) {
            update_ui(
                &ui,
                "The latest version could not be installed.",
                &error.to_string(),
                "Download was not completed.",
                0.0,
                "Try again",
                true,
                true,
            );
        }
    });
}

fn configure_microsoft_store_update_ui(ui: &MainWindow, version: &str, store_opened: bool) {
    ui.set_status(
        if store_opened {
        "Microsoft Store opened"
    } else {
        "Aero P2P Chat is installed from Microsoft Store"
    }
        .into(),
    );
    ui.set_detail(
        if store_opened {
        "Use Microsoft Store to check for and install updates."
    } else {
        "This online installer is for the standard Windows setup. Your current app updates through Microsoft Store."
    }
        .into(),
    );
    ui.set_version(format!("Microsoft Store version: {version}").into());
    ui.set_progress(0.0);
    ui.set_button_text("Open Store updates".into());
    ui.set_can_install(true);
    ui.set_show_install(true);
    ui.set_show_switch_action(true);
    ui.set_security_note(
        "Uninstall the Store version first."
            .into(),
    );
}

fn show_microsoft_store_update_ui(ui: &Weak<MainWindow>, version: &str, store_opened: bool) {
    let version = version.to_owned();
    let _ = ui.upgrade_in_event_loop(move |window| {
        configure_microsoft_store_update_ui(&window, &version, store_opened);
    });
}

fn open_microsoft_store_updates(ui: &Weak<MainWindow>, version: &str) {
    match open_windows_uri(MICROSOFT_STORE_PRODUCT_URI) {
        Ok(_) => show_microsoft_store_update_ui(ui, version, true),
        Err(error) => update_ui(
            ui,
            "Microsoft Store could not be opened.",
            &error.to_string(),
            &format!("Microsoft Store version: {version}"),
            0.0,
            "Try again",
            true,
            true,
        ),
    }
}

fn open_windows_setup_switch(
    ui: &Weak<MainWindow>,
    store_install_state: Arc<Mutex<Option<String>>>,
    is_waiting_for_store_removal: Arc<AtomicBool>,
) {
    if installed_microsoft_store_version().is_none() {
        if let Ok(mut state) = store_install_state.lock() {
            *state = None;
        }
        show_ready_for_windows_setup_ui(ui);
        return;
    }

    if let Err(error) = open_windows_uri("ms-settings:appsfeatures") {
        update_ui(
            ui,
            "Installed apps could not be opened.",
            &error.to_string(),
            "Uninstall the Microsoft Store version, then reopen this installer.",
            0.0,
            "Open Store updates",
            true,
            true,
        );
        return;
    }

    if is_waiting_for_store_removal.swap(true, AtomicOrdering::AcqRel) {
        return;
    }

    let ui = ui.clone();
    thread::spawn(move || {
        loop {
            thread::sleep(Duration::from_secs(2));
            if installed_microsoft_store_version().is_some() {
                continue;
            }

            if let Ok(mut state) = store_install_state.lock() {
                *state = None;
            }
            is_waiting_for_store_removal.store(false, AtomicOrdering::Release);
            show_ready_for_windows_setup_ui(&ui);
            break;
        }
    });
}

fn show_ready_for_windows_setup_ui(ui: &Weak<MainWindow>) {
    let _ = ui.upgrade_in_event_loop(|window| {
        window.set_status("Ready to install Aero P2P Chat".into());
        window.set_detail("Click Install to download the newest version from GitHub.".into());
        window.set_version("The newest version will be checked after you continue.".into());
        window.set_progress(0.0);
        window.set_button_text("Install".into());
        window.set_can_install(true);
        window.set_show_install(true);
        window.set_show_switch_action(false);
        window.set_security_note("Each download is checked against its GitHub SHA-256 checksum.".into());
    });
}

#[cfg(windows)]
fn open_windows_uri(uri: &str) -> Result<(), std::io::Error> {
    let operation: Vec<u16> = "open\0".encode_utf16().collect();
    let uri: Vec<u16> = format!("{uri}\0").encode_utf16().collect();
    let handle = unsafe {
        ShellExecuteW(
            None,
            PCWSTR(operation.as_ptr()),
            PCWSTR(uri.as_ptr()),
            PCWSTR::null(),
            PCWSTR::null(),
            SW_SHOWNORMAL,
        )
    };
    if handle.0 as isize > 32 {
        Ok(())
    } else {
        Err(std::io::Error::other("Windows did not accept this system link."))
    }
}

#[cfg(not(windows))]
fn open_windows_uri(_uri: &str) -> Result<(), std::io::Error> {
    Err(std::io::Error::other("This action is only available on Windows."))
}

fn wait_then_install(ui: Weak<MainWindow>, pid: u32, install_when_closed: bool) {
    update_ui(
        &ui,
        "Preparing the update...",
        "Waiting for Aero P2P Chat to close safely...",
        "The latest version will be checked next.",
        0.0,
        "Installing...",
        false,
        true,
    );
    thread::spawn(move || {
        if let Err(error) = wait_for_process_exit(pid, Duration::from_secs(20)) {
            update_ui(
                &ui,
                "Aero P2P Chat is still running.",
                &error.to_string(),
                "Close the app and try again.",
                0.0,
                "Try again",
                true,
                true,
            );
        } else if install_when_closed {
            start_installation(ui);
        } else {
            update_ui(
                &ui,
                "Ready to install Aero P2P Chat",
                "Click Install to download the newest version from GitHub.",
                "The newest version will be checked after you continue.",
                0.0,
                "Install",
                true,
                true,
            );
        }
    });
}

fn wait_for_process_exit(pid: u32, timeout: Duration) -> Result<(), Box<dyn std::error::Error>> {
    let deadline = std::time::Instant::now() + timeout;
    while process_is_running(pid) {
        if std::time::Instant::now() >= deadline {
            return Err("The app did not close within 20 seconds.".into());
        }
        thread::sleep(Duration::from_millis(250));
    }
    Ok(())
}

fn process_is_running(pid: u32) -> bool {
    Command::new("tasklist")
        .args(["/FI", &format!("PID eq {pid}"), "/FO", "CSV", "/NH"])
        .output()
        .map(|output| String::from_utf8_lossy(&output.stdout).contains(&format!("\"{pid}\"")))
        .unwrap_or(false)
}

fn install_latest(ui: &Weak<MainWindow>) -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder()
        .timeout(Duration::from_secs(600))
        .build()?;
    let manifest_url =
        format!("https://github.com/{REPOSITORY}/releases/latest/download/latest.yml");
    let manifest = client
        .get(manifest_url)
        .send()?
        .error_for_status()?
        .text()?;
    let latest_version =
        manifest_value(&manifest, "version").ok_or("The latest release metadata is incomplete.")?;
    let download_url = manifest_value(&manifest, "windowsUrl")
        .or_else(|| manifest_value(&manifest, "url"))
        .ok_or("The latest release metadata is incomplete.")?;
    let expected_hash = manifest_value(&manifest, "windowsSha256")
        .or_else(|| manifest_value(&manifest, "sha256"))
        .ok_or("The latest release metadata is incomplete.")?;
    let parsed_url = Url::parse(&download_url)?;
    if parsed_url.scheme() != "https" || parsed_url.host_str() != Some("github.com") {
        return Err("The release did not provide a trusted GitHub download URL.".into());
    }

    if let Some(installed_version) = installed_aero_version()
        && compare_versions(&installed_version, &latest_version) != Ordering::Less
    {
        let detail = if installed_version == latest_version {
            "The newest version is already installed. No download is needed."
        } else {
            "A newer version is already installed. Aero will not be downgraded."
        };
        update_ui(
            ui,
            "Aero P2P Chat is up to date.",
            detail,
            &format!("Installed: {installed_version} · Latest: {latest_version}"),
            1.0,
            "Check again",
            true,
            true,
        );
        return Ok(());
    }

    update_ui(
        ui,
        &format!("Downloading Aero P2P Chat {latest_version}"),
        "Preparing the secure download...",
        &format!("Latest version: {latest_version}"),
        0.0,
        "Installing...",
        false,
        true,
    );
    let target_path = temporary_installer_path();
    download_file(&client, parsed_url, &target_path, ui, &latest_version)?;

    update_ui(
        ui,
        "Verifying the download...",
        "Checking the published SHA-256 checksum...",
        &format!("Latest version: {latest_version}"),
        1.0,
        "Installing...",
        false,
        true,
    );
    let actual_hash = sha256_file(&target_path)?;
    if !actual_hash.eq_ignore_ascii_case(&expected_hash) {
        if let Some(parent) = target_path.parent() {
            let _ = fs::remove_dir_all(parent);
        }
        return Err("The downloaded installer did not match the published checksum.".into());
    }

    update_ui(
        ui,
        "Opening Windows setup...",
        "The verified Aero installer is starting now.",
        &format!("Latest version: {latest_version}"),
        1.0,
        "Installing...",
        false,
        true,
    );
    Command::new(&target_path)
        .args(["/CLOSEAPPLICATIONS", "/RESTARTAPPLICATIONS"])
        .spawn()?;

    // The setup updates this executable in the installation directory. Exit now
    // so it is no longer locked when Inno Setup copies the new version.
    std::process::exit(0);
}

fn download_file(
    client: &Client,
    url: Url,
    target_path: &PathBuf,
    ui: &Weak<MainWindow>,
    version: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut response = client.get(url).send()?.error_for_status()?;
    let total = response.content_length();
    let mut target = File::create(target_path)?;
    let mut buffer = [0_u8; 128 * 1024];
    let mut downloaded = 0_u64;
    let mut last_percent = u64::MAX;
    let taskbar_progress = TaskbarProgress::new();

    loop {
        let read = response.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        target.write_all(&buffer[..read])?;
        downloaded += read as u64;
        let progress = total
            .map(|size| downloaded as f32 / size as f32)
            .unwrap_or(0.0);
        let percent = (progress * 100.0).floor() as u64;
        if total.is_none() || percent != last_percent {
            if let Some(taskbar) = &taskbar_progress {
                taskbar.set_progress(progress);
            }
            let detail = match total {
                Some(size) => format!(
                    "{} of {} downloaded ({percent}%)",
                    format_bytes(downloaded),
                    format_bytes(size)
                ),
                None => format!("{} downloaded", format_bytes(downloaded)),
            };
            update_ui(
                ui,
                &format!("Downloading Aero P2P Chat {version}"),
                &detail,
                &format!("Latest version: {version}"),
                progress,
                "Installing...",
                false,
                true,
            );
            last_percent = percent;
        }
    }
    Ok(())
}

fn update_ui(
    ui: &Weak<MainWindow>,
    status: &str,
    detail: &str,
    version: &str,
    progress: f32,
    button_text: &str,
    can_install: bool,
    show_button: bool,
) {
    let status = SharedString::from(status);
    let detail = SharedString::from(detail);
    let version = SharedString::from(version);
    let button_text = SharedString::from(button_text);
    let _ = ui.upgrade_in_event_loop(move |window| {
        window.set_status(status);
        window.set_detail(detail);
        window.set_version(version);
        window.set_progress(progress.clamp(0.0, 1.0));
        window.set_button_text(button_text);
        window.set_can_install(can_install);
        window.set_show_install(show_button);
    });
}

fn manifest_value(manifest: &str, key: &str) -> Option<String> {
    let prefix = format!("{key}:");
    manifest.lines().find_map(|line| {
        line.strip_prefix(&prefix)
            .map(|value| value.trim().trim_matches('"').to_owned())
    })
}

fn compare_versions(left: &str, right: &str) -> Ordering {
    let parse = |value: &str| {
        value
            .trim_start_matches('v')
            .split(['-', '+'])
            .next()
            .unwrap_or_default()
            .split('.')
            .map(|part| part.parse::<u64>().unwrap_or(0))
            .collect::<Vec<_>>()
    };

    let left_parts = parse(left);
    let right_parts = parse(right);
    let length = left_parts.len().max(right_parts.len());
    for index in 0..length {
        match left_parts
            .get(index)
            .copied()
            .unwrap_or(0)
            .cmp(&right_parts.get(index).copied().unwrap_or(0))
        {
            Ordering::Equal => continue,
            ordering => return ordering,
        }
    }
    Ordering::Equal
}

#[cfg(windows)]
fn installed_aero_version() -> Option<String> {
    const UNINSTALL_PATH: &str = "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
    for hive in [
        RegKey::predef(HKEY_CURRENT_USER),
        RegKey::predef(HKEY_LOCAL_MACHINE),
    ] {
        let Ok(uninstall) = hive.open_subkey(UNINSTALL_PATH) else {
            continue;
        };
        for key_name in uninstall.enum_keys().filter_map(Result::ok) {
            let Ok(app_key) = uninstall.open_subkey(&key_name) else {
                continue;
            };
            let Ok(display_name) = app_key.get_value::<String, _>("DisplayName") else {
                continue;
            };
            if display_name.trim() != "Aero P2P Chat" {
                continue;
            }
            if let Ok(version) = app_key.get_value::<String, _>("DisplayVersion") {
                return Some(version.trim().to_owned());
            }
        }
    }
    None
}

#[cfg(windows)]
fn installed_microsoft_store_version() -> Option<String> {
    installed_microsoft_store_version_from_powershell()
        .or_else(installed_microsoft_store_version_from_registry)
}

#[cfg(windows)]
fn installed_microsoft_store_version_from_powershell() -> Option<String> {
    const STORE_IDENTITY_NAME: &str = "Zorblock.AeroP2PChat";
    let command = format!(
        "$package = Get-AppxPackage -Name '{STORE_IDENTITY_NAME}' -ErrorAction SilentlyContinue | Where-Object {{ $_.PackageFamilyName -eq '{MICROSOFT_STORE_PACKAGE_FAMILY_NAME}' }} | Select-Object -First 1; if ($package) {{ $package.Version }}"
    );
    let mut process = Command::new("powershell.exe");
    process.args(["-NoProfile", "-NonInteractive", "-Command", &command]);
    process.creation_flags(CREATE_NO_WINDOW);
    let output = process.output().ok()?;
    if !output.status.success() {
        return None;
    }

    String::from_utf8_lossy(&output.stdout)
        .lines()
        .map(str::trim)
        .find(|value| !value.is_empty())
        .map(str::to_owned)
}

#[cfg(windows)]
fn installed_microsoft_store_version_from_registry() -> Option<String> {
    const ACTIVATABLE_PACKAGES_PATH: &str = "Software\\Classes\\ActivatableClasses\\Package";
    const STORE_IDENTITY_NAME: &str = "Zorblock.AeroP2PChat";

    let packages = RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey(ACTIVATABLE_PACKAGES_PATH)
        .ok()?;
    packages.enum_keys().filter_map(Result::ok).find_map(|full_name| {
        let suffix = full_name.strip_prefix(&format!("{STORE_IDENTITY_NAME}_"))?;
        if !full_name.ends_with("_cgb7tdbkexs70") {
            return None;
        }
        suffix.split('_').next().map(str::to_owned)
    })
}

#[cfg(not(windows))]
fn installed_aero_version() -> Option<String> {
    None
}

#[cfg(not(windows))]
fn installed_microsoft_store_version() -> Option<String> {
    None
}

fn temporary_installer_path() -> PathBuf {
    std::env::temp_dir()
        .join(format!(
            "{TEMP_SETUP_DIRECTORY_PREFIX}{}",
            std::process::id()
        ))
        .join(INSTALLER_ASSET)
}

fn sha256_file(path: &PathBuf) -> Result<String, Box<dyn std::error::Error>> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 128 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn format_bytes(bytes: u64) -> String {
    if bytes >= 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / 1024.0 / 1024.0)
    } else {
        format!("{} KB", bytes / 1024)
    }
}
