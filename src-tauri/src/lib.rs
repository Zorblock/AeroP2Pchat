use std::fs;
use std::path::PathBuf;
use std::time::Duration;

use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, Window};

const CONFIG_FILE_NAME: &str = "config.json";
const UPDATE_MANIFEST_URL: &str =
    "https://github.com/Zorblock/AeroP2Pchat/releases/latest/download/latest.yml";

#[derive(Serialize)]
struct CommandOk {
    ok: bool,
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    Ok(dir.join(CONFIG_FILE_NAME))
}

fn default_config() -> Value {
    json!({
        "appSettings": {
            "autostart": false,
            "startHidden": false,
            "closeToTray": false,
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

#[tauri::command]
fn install_update(_details: Value) -> Result<CommandOk, String> {
    Err("Automatic installer updates are not wired for the Tauri build yet.".into())
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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
            if let Some(window) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        let _ = handle.emit("system-shutdown", json!({ "reason": "quit" }));
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
