use tauri::command;

/// Returns `Some(true)` if DocLatch is the default PDF viewer,
/// `Some(false)` if another app is the default, or `None` on non-Windows
/// platforms where this check is not supported.
#[command]
pub fn check_default_pdf_viewer() -> Option<bool> {
    #[cfg(target_os = "windows")]
    {
        Some(windows::is_default())
    }
    #[cfg(not(target_os = "windows"))]
    {
        None
    }
}

/// Opens the OS default-apps settings so the user can set DocLatch as the
/// default PDF viewer. Does nothing on non-Windows platforms.
#[command]
pub fn set_default_pdf_viewer() {
    #[cfg(target_os = "windows")]
    {
        windows::open_default_apps_settings();
    }
}

#[cfg(target_os = "windows")]
mod windows {
    use winreg::enums::{HKEY_CLASSES_ROOT, HKEY_CURRENT_USER};
    use winreg::RegKey;

    pub fn is_default() -> bool {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);

        let prog_id: String = match hkcu
            .open_subkey(
                r"Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.pdf\UserChoice",
            )
            .and_then(|k| k.get_value("ProgId"))
        {
            Ok(v) => v,
            Err(_) => return false,
        };

        let command = find_open_command(&prog_id).unwrap_or_default();
        let exe_name = std::env::current_exe()
            .ok()
            .and_then(|p| {
                p.file_name()
                    .map(|n| n.to_string_lossy().to_lowercase().to_string())
            })
            .unwrap_or_default();

        !exe_name.is_empty() && command.to_lowercase().contains(&exe_name)
    }

    fn find_open_command(prog_id: &str) -> Option<String> {
        let subkey = format!(r"{}\shell\open\command", prog_id);

        if let Ok(v) = RegKey::predef(HKEY_CLASSES_ROOT)
            .open_subkey(&subkey)
            .and_then(|k| k.get_value(""))
        {
            return Some(v);
        }

        RegKey::predef(HKEY_CURRENT_USER)
            .open_subkey(format!(r"Software\Classes\{}", subkey))
            .and_then(|k| k.get_value(""))
            .ok()
    }

    pub fn open_default_apps_settings() {
        let _ = std::process::Command::new("cmd")
            .args(["/c", "start", "ms-settings:defaultapps"])
            .spawn();
    }
}
