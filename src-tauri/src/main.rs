// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "windows")]
    {
        // Portable Mode: Force WebView2 data into a 'webview_data' folder next to the .exe
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(dir) = exe_path.parent() {
                // Only set it if it's not already overridden by testing profiles
                if std::env::var("WEBVIEW2_USER_DATA_FOLDER").is_err() {
                    std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", dir.join("webview_data"));
                }
            }
        }
    }
    #[cfg(target_os = "linux")]
    {
        // Dies behebt den "weißen Bildschirm" auf Linux (oft durch Nvidia/Hardwarebeschleunigung verursacht)
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    aerop2p_lib::run()
}
