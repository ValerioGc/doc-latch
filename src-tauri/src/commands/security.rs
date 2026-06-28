use tauri::command;

use crate::pdf::{error::PdfError, security::SecurityInfo};

/// Reads encryption status and permissions for a PDF, without needing its password.
#[command]
pub fn get_security_info(path: String) -> Result<SecurityInfo, PdfError> {
    crate::pdf::security::get_security_info(&path)
}

/// Decrypts a password-protected PDF and saves an unencrypted copy at `destination`.
#[command]
pub fn remove_password(
    path: String,
    password: String,
    destination: String,
) -> Result<(), PdfError> {
    crate::pdf::security::remove_password(&path, &password, &destination)
}

/// Encrypts an unprotected PDF with AES-256 and saves the protected copy at `destination`.
#[command]
pub fn add_password(path: String, password: String, destination: String) -> Result<(), PdfError> {
    crate::pdf::security::add_password(&path, &password, &destination)
}
