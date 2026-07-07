use std::fs;
#[cfg(target_os = "windows")]
use std::io::Write;
use std::path::PathBuf;
#[cfg(target_os = "windows")]
use std::process::Command;
use std::time::Duration;

#[cfg(target_os = "windows")]
use base64::Engine;
use serde::Serialize;
use serde_json::{json, Value};
#[cfg(target_os = "windows")]
use sha2::{Digest, Sha256, Sha512};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Window};

const TRAY_MENU_OPEN: &str = "tray-open";
const TRAY_MENU_HIDE: &str = "tray-hide";
const TRAY_MENU_QUIT: &str = "tray-quit";
const UPDATE_MANIFEST_URL: &str =
    "https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/latest.yml";
#[cfg(target_os = "windows")]
const RELEASE_DOWNLOAD_PREFIX: &str = "https://github.com/Zorblock/AeroP2Pchat/releases/download/";

#[derive(Serialize)]
struct CommandOk {
    ok: bool,
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    let dir = {
        let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
        exe_path.parent().ok_or("No parent directory")?.to_path_buf()
    };

    #[cfg(not(target_os = "windows"))]
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;

    let profile = std::env::var("AEROP2P_PROFILE").unwrap_or_default();
    let file_name = if profile.is_empty() {
        "config.json".to_string()
    } else {
        format!("config-{}.json", profile)
    };

    Ok(dir.join(file_name))
}

fn default_config() -> Value {
    json!({
        "appSettings": {
            "autostart": false,
            "startHidden": false,
            "closeToTray": true,
            "readReceipts": true,
            "sidebarWidth": 230,
            "theme": "light",
            "presenceStatus": "online"
        },
        "audio": {
            "inputDeviceId": "default",
            "cameraDeviceId": "default",
            "outputDeviceId": "default",
            "remoteVolume": 100,
            "micMode": "auto",
            "micSensitivity": 55,
            "micBoost": 100,
            "micNoiseReduction": 55,
            "micEqLow": 0,
            "micEqMid": 0,
            "micEqHigh": 0,
            "micProfile": "voice-isolation"
        }
    })
}

#[tauri::command]
fn load_config(app: AppHandle) -> Result<Value, String> {
    let path = config_path(&app)?;
    if !path.exists() {
        return Ok(default_config());
    }

    let text = fs::read_to_string(path).map_err(|error| error.to_string())?;
    serde_json::from_str(&text).map_err(|error| error.to_string())
}

#[tauri::command]
fn save_config(app: AppHandle, config: Value) -> Result<CommandOk, String> {
    let path = config_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let text = serde_json::to_string_pretty(&config).map_err(|error| error.to_string())?;
    fs::write(path, format!("{text}\n")).map_err(|error| error.to_string())?;
    Ok(CommandOk { ok: true })
}

#[tauri::command]
fn get_config_path(app: AppHandle) -> Result<String, String> {
    Ok(config_path(&app)?.to_string_lossy().into_owned())
}

fn app_config(app: &AppHandle) -> Value {
    let Ok(path) = config_path(app) else {
        return default_config();
    };
    if !path.exists() {
        return default_config();
    }

    fs::read_to_string(path)
        .ok()
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_else(default_config)
}

fn should_close_to_tray(app: &AppHandle) -> bool {
    app_config(app)
        .get("appSettings")
        .and_then(|settings| settings.get("closeToTray"))
        .and_then(Value::as_bool)
        .unwrap_or(true)
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn hide_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(
        app,
        TRAY_MENU_OPEN,
        "Open Aero P2P Chat",
        true,
        None::<&str>,
    )?;
    let hide = MenuItem::with_id(app, TRAY_MENU_HIDE, "Hide to tray", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, TRAY_MENU_QUIT, "Quit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&open, &hide, &separator, &quit])?;

    let mut tray = TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .tooltip("Aero P2P Chat")
        .show_menu_on_left_click(true);

    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }

    tray.build(app)?;
    Ok(())
}

#[tauri::command]
fn write_clipboard(text: String) -> Result<CommandOk, String> {
    let mut clipboard = arboard::Clipboard::new().map_err(|error| error.to_string())?;
    clipboard
        .set_text(text)
        .map_err(|error| error.to_string())?;
    Ok(CommandOk { ok: true })
}

#[tauri::command]
fn fetch_update_manifest(url: String) -> Result<Value, String> {
    if url != UPDATE_MANIFEST_URL {
        return Ok(json!({
            "ok": false,
            "error": "Refused untrusted update manifest URL."
        }));
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(12))
        .user_agent("AeroP2P-Tauri")
        .build()
        .map_err(|error| error.to_string())?;
    let response = client.get(url).send().map_err(|error| error.to_string())?;
    if !response.status().is_success() {
        return Ok(json!({
            "ok": false,
            "error": format!("Update manifest failed with HTTP {}.", response.status())
        }));
    }

    let text = response.text().map_err(|error| error.to_string())?;
    Ok(json!({ "ok": true, "text": text }))
}

#[cfg(target_os = "windows")]
fn parse_update_detail(details: &Value, key: &str) -> String {
    details
        .get(key)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

#[cfg(target_os = "windows")]
fn verify_update_url(url: &str) -> Result<(), String> {
    if !url.starts_with(RELEASE_DOWNLOAD_PREFIX) || !url.ends_with(".exe") {
        return Err("Refused untrusted update URL.".into());
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn hex_digest(bytes: &[u8], algorithm: &str) -> String {
    match algorithm {
        "sha256" => format!("{:x}", Sha256::digest(bytes)),
        "sha512" => format!("{:x}", Sha512::digest(bytes)),
        _ => String::new(),
    }
}

#[cfg(target_os = "windows")]
fn sha512_base64(bytes: &[u8]) -> String {
    let digest = Sha512::digest(bytes);
    base64::engine::general_purpose::STANDARD.encode(digest)
}

#[tauri::command]
fn install_update(app: AppHandle, details: Value) -> Result<CommandOk, String> {
    #[cfg(not(target_os = "windows"))]
    {
        let _ = details;
        let _ = app;
        return Err("Automatic installer updates are only available on Windows.".into());
    }

    #[cfg(target_os = "windows")]
    {
        let url = parse_update_detail(&details, "url");
        let version = parse_update_detail(&details, "version");
        let expected_sha256 = parse_update_detail(&details, "sha256").to_lowercase();
        let expected_sha512 = parse_update_detail(&details, "sha512");
        verify_update_url(&url)?;
        if expected_sha256.is_empty() || expected_sha512.is_empty() {
            return Err("Update manifest is missing installer checksums.".into());
        }

        app.emit(
            "update-progress",
            json!({
                "phase": "download",
                "percent": 0,
                "receivedBytes": 0,
                "totalBytes": null
            }),
        )
        .ok();

        let client = reqwest::blocking::Client::builder()
            .timeout(Duration::from_secs(120))
            .user_agent("AeroP2P-Tauri")
            .build()
            .map_err(|error| error.to_string())?;
        let bytes = client
            .get(&url)
            .send()
            .map_err(|error| error.to_string())?
            .error_for_status()
            .map_err(|error| error.to_string())?
            .bytes()
            .map_err(|error| error.to_string())?;

        app.emit(
            "update-progress",
            json!({
                "phase": "download",
                "percent": 100,
                "receivedBytes": bytes.len(),
                "totalBytes": bytes.len()
            }),
        )
        .ok();
        app.emit(
            "update-progress",
            json!({ "phase": "verify", "percent": 100 }),
        )
        .ok();

        let actual_sha256 = hex_digest(&bytes, "sha256");
        if actual_sha256 != expected_sha256 {
            return Err("Update download SHA256 did not match latest.yml.".into());
        }
        let actual_sha512_hex = hex_digest(&bytes, "sha512");
        let actual_sha512_base64 = sha512_base64(&bytes);
        if expected_sha512 != actual_sha512_hex && expected_sha512 != actual_sha512_base64 {
            return Err("Update download SHA512 did not match latest.yml.".into());
        }

        let setup_path = std::env::temp_dir().join(format!(
            "Aero-P2P-Chat-Setup-{}.exe",
            if version.is_empty() {
                "latest"
            } else {
                &version
            }
        ));
        let mut file = fs::File::create(&setup_path).map_err(|error| error.to_string())?;
        file.write_all(&bytes).map_err(|error| error.to_string())?;

        app.emit(
            "update-progress",
            json!({ "phase": "install", "percent": 100 }),
        )
        .ok();
        Command::new(&setup_path)
            .args([
                "/SILENT",
                "/SUPPRESSMSGBOXES",
                "/NORESTART",
                "/FORCECLOSEAPPLICATIONS",
                "/RESTARTAPPLICATIONS",
            ])
            .spawn()
            .map_err(|error| error.to_string())?;
        app.exit(0);
        Ok(CommandOk { ok: true })
    }
}

#[tauri::command]
fn realtime_cleanup_complete() -> CommandOk {
    CommandOk { ok: true }
}

#[tauri::command]
fn window_control(window: Window, action: String) -> Result<Value, String> {
    match action.as_str() {
        "minimize" => window.minimize().map_err(|error| error.to_string())?,
        "maximize" => {
            if window.is_maximized().map_err(|error| error.to_string())? {
                window.unmaximize().map_err(|error| error.to_string())?;
            } else {
                window.maximize().map_err(|error| error.to_string())?;
            }
        }
        "close" => window.close().map_err(|error| error.to_string())?,
        _ => {}
    }

    Ok(json!({
        "ok": true,
        "maximized": window.is_maximized().unwrap_or(false)
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    #[cfg(not(debug_assertions))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }));
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .on_menu_event(|app, event| match event.id().as_ref() {
            TRAY_MENU_OPEN => show_main_window(app),
            TRAY_MENU_HIDE => hide_main_window(app),
            TRAY_MENU_QUIT => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            get_config_path,
            write_clipboard,
            fetch_update_manifest,
            install_update,
            realtime_cleanup_complete,
            window_control
        ])
        .setup(|app| {
            setup_tray(app.handle())?;
            if let Some(window) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        if should_close_to_tray(&handle) {
                            api.prevent_close();
                            hide_main_window(&handle);
                            return;
                        }
                        let _ = handle.emit("system-shutdown", json!({ "reason": "quit" }));
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
