#![windows_subsystem = "windows"]

use std::{
    fs::{self, File},
    io::{Read, Write},
    path::PathBuf,
    process::Command,
    thread,
    time::Duration,
};

use reqwest::{blocking::Client, Url};
use sha2::{Digest, Sha256};
use single_instance::SingleInstance;
use slint::{ComponentHandle, SharedString, Weak};

slint::include_modules!();

const REPOSITORY: &str = "Zorblock/AeroP2Pchat";
const INSTALLER_ASSET: &str = "Aero-P2P-Chat-Windows-x64-Setup.exe";

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let instance = SingleInstance::new("Zorblock.AeroP2PChat.OnlineInstaller.8B09B5D9")?;
    if !instance.is_single() {
        return Ok(());
    }

    let ui = MainWindow::new()?;
    let weak_ui = ui.as_weak();
    ui.on_install(move || {
        let worker_ui = weak_ui.clone();
        update_ui(
            &worker_ui,
            "Checking the newest release...",
            "Connecting securely to GitHub...",
            "Latest version: checking",
            0.0,
            "Installing...",
            false,
            true,
        );
        thread::spawn(move || {
            if let Err(error) = install_latest(&worker_ui) {
                update_ui(
                    &worker_ui,
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
    });

    ui.run()?;
    Ok(())
}

fn install_latest(ui: &Weak<MainWindow>) -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::builder().timeout(Duration::from_secs(600)).build()?;
    let manifest_url = format!("https://github.com/{REPOSITORY}/releases/latest/download/latest.yml");
    let manifest = client.get(manifest_url).send()?.error_for_status()?.text()?;
    let latest_version = manifest_value(&manifest, "version").ok_or("The latest release metadata is incomplete.")?;
    let download_url = manifest_value(&manifest, "windowsUrl").or_else(|| manifest_value(&manifest, "url")).ok_or("The latest release metadata is incomplete.")?;
    let expected_hash = manifest_value(&manifest, "windowsSha256").or_else(|| manifest_value(&manifest, "sha256")).ok_or("The latest release metadata is incomplete.")?;
    let parsed_url = Url::parse(&download_url)?;
    if parsed_url.scheme() != "https" || parsed_url.host_str() != Some("github.com") {
        return Err("The release did not provide a trusted GitHub download URL.".into());
    }

    update_ui(ui, &format!("Downloading Aero P2P Chat {latest_version}"), "Preparing the secure download...", &format!("Latest version: {latest_version}"), 0.0, "Installing...", false, true);
    let target_path = temporary_installer_path();
    download_file(&client, parsed_url, &target_path, ui, &latest_version)?;

    update_ui(ui, "Verifying the download...", "Checking the published SHA-256 checksum...", &format!("Latest version: {latest_version}"), 1.0, "Installing...", false, true);
    let actual_hash = sha256_file(&target_path)?;
    if !actual_hash.eq_ignore_ascii_case(&expected_hash) {
        let _ = fs::remove_file(&target_path);
        return Err("The downloaded installer did not match the published checksum.".into());
    }

    update_ui(ui, "Opening Windows setup...", "The verified Aero installer is starting now.", &format!("Latest version: {latest_version}"), 1.0, "Installing...", false, true);
    let status = Command::new(&target_path).status()?;
    let _ = fs::remove_file(&target_path);
    if !status.success() && status.code() != Some(3010) {
        return Err(format!("The setup ended with exit code {:?}.", status.code()).into());
    }

    update_ui(ui, "Installation complete.", "Aero P2P Chat is ready to use. You can close this window.", &format!("Latest version: {latest_version}"), 1.0, "Install", false, false);
    Ok(())
}

fn download_file(client: &Client, url: Url, target_path: &PathBuf, ui: &Weak<MainWindow>, version: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut response = client.get(url).send()?.error_for_status()?;
    let total = response.content_length();
    let mut target = File::create(target_path)?;
    let mut buffer = [0_u8; 128 * 1024];
    let mut downloaded = 0_u64;
    let mut last_percent = u64::MAX;

    loop {
        let read = response.read(&mut buffer)?;
        if read == 0 { break; }
        target.write_all(&buffer[..read])?;
        downloaded += read as u64;
        let progress = total.map(|size| downloaded as f32 / size as f32).unwrap_or(0.0);
        let percent = (progress * 100.0).floor() as u64;
        if total.is_none() || percent != last_percent {
            let detail = match total {
                Some(size) => format!("{} of {} downloaded ({percent}%)", format_bytes(downloaded), format_bytes(size)),
                None => format!("{} downloaded", format_bytes(downloaded)),
            };
            update_ui(ui, &format!("Downloading Aero P2P Chat {version}"), &detail, &format!("Latest version: {version}"), progress, "Installing...", false, true);
            last_percent = percent;
        }
    }
    Ok(())
}

fn update_ui(ui: &Weak<MainWindow>, status: &str, detail: &str, version: &str, progress: f32, button_text: &str, can_install: bool, show_button: bool) {
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
    manifest.lines().find_map(|line| line.strip_prefix(&prefix).map(|value| value.trim().trim_matches('"').to_owned()))
}

fn temporary_installer_path() -> PathBuf {
    std::env::temp_dir().join(format!("{INSTALLER_ASSET}-{}.exe", std::process::id()))
}

fn sha256_file(path: &PathBuf) -> Result<String, Box<dyn std::error::Error>> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 128 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 { break; }
        hasher.update(&buffer[..read]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn format_bytes(bytes: u64) -> String {
    if bytes >= 1024 * 1024 { format!("{:.1} MB", bytes as f64 / 1024.0 / 1024.0) } else { format!("{} KB", bytes / 1024) }
}
