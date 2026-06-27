use tauri::command;

use crate::pdf::{error::PdfError, security::SecurityInfo};

/// Reads encryption status and permissions for a PDF, without needing its password.
#[command]
pub fn get_security_info(path: String) -> Result<SecurityInfo, PdfError> {
    crate::pdf::security::get_security_info(&path)
}

#[cfg(test)]
mod tests;
