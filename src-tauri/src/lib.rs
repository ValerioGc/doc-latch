pub mod commands;
pub mod pdf;
#[cfg(any(test, feature = "test-support"))]
pub mod test_support;

use commands::document::{
    open_pdf, open_pdf_with_password, render_page, render_page_with_password,
};
use commands::security::{add_password, get_security_info, remove_password};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            open_pdf,
            open_pdf_with_password,
            render_page,
            render_page_with_password,
            get_security_info,
            remove_password,
            add_password,
        ])
        .run(tauri::generate_context!())
        .expect("Error during the startup of the Tauri application");
}
