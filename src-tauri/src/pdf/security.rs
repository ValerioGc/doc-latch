use lopdf::Document;
use serde::{Deserialize, Serialize};
use std::path::Path;

use super::error::PdfError;

/// Security/encryption status of a PDF — mirrors the TypeScript `SecurityInfo` interface.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SecurityInfo {
    pub is_encrypted: bool,
    pub encryption_method: Option<String>,
    pub key_length_bits: Option<u32>,
    pub can_print: bool,
    pub can_print_high_res: bool,
    pub can_modify: bool,
    pub can_copy: bool,
    pub can_annotate: bool,
    pub can_fill_forms: bool,
    pub can_extract_for_accessibility: bool,
    pub can_assemble: bool,
}

impl SecurityInfo {
    /// An unencrypted document has no restrictions.
    fn unrestricted() -> Self {
        SecurityInfo {
            is_encrypted: false,
            encryption_method: None,
            key_length_bits: None,
            can_print: true,
            can_print_high_res: true,
            can_modify: true,
            can_copy: true,
            can_annotate: true,
            can_fill_forms: true,
            can_extract_for_accessibility: true,
            can_assemble: true,
        }
    }
}

/// Reads encryption status and permissions from a PDF's `/Encrypt` dictionary.
/// This never needs the document's password: the dictionary itself isn't
/// encrypted, only the page content is, so `Document::load` can always parse it.
pub fn get_security_info(path: &str) -> Result<SecurityInfo, PdfError> {
    let file_path = Path::new(path);
    if !file_path.exists() {
        return Err(PdfError::FileNotFound(path.to_string()));
    }

    let doc = Document::load(file_path)?;

    if !doc.is_encrypted() {
        return Ok(SecurityInfo::unrestricted());
    }

    let encrypt_dict = doc.get_encrypted()?;

    let version = encrypt_dict.get(b"V").and_then(|o| o.as_i64()).unwrap_or(0);
    let length = encrypt_dict
        .get(b"Length")
        .and_then(|o| o.as_i64())
        .unwrap_or(40) as u32;
    let permissions = encrypt_dict.get(b"P").and_then(|o| o.as_i64()).unwrap_or(0);

    let (encryption_method, key_length_bits) = describe_encryption(encrypt_dict, version, length);

    Ok(SecurityInfo {
        is_encrypted: true,
        encryption_method: Some(encryption_method),
        key_length_bits,
        can_print: has_permission(permissions, 3),
        can_modify: has_permission(permissions, 4),
        can_copy: has_permission(permissions, 5),
        can_annotate: has_permission(permissions, 6),
        can_fill_forms: has_permission(permissions, 9),
        can_extract_for_accessibility: has_permission(permissions, 10),
        can_assemble: has_permission(permissions, 11),
        can_print_high_res: has_permission(permissions, 12),
    })
}

/// Checks bit `n` (1-indexed, per PDF32000-1:2008 Table 22) of the `/P` permissions integer.
fn has_permission(permissions: i64, bit: u8) -> bool {
    permissions & (1 << (bit - 1)) != 0
}

/// Maps the `/Encrypt` dictionary's `/V` (and, for V4, `/CF`/`/StdCF`/`/CFM`) to a
/// human-readable algorithm name and key length.
fn describe_encryption(
    encrypt_dict: &lopdf::Dictionary,
    version: i64,
    length: u32,
) -> (String, Option<u32>) {
    match version {
        1 => ("RC4".to_string(), Some(40)),
        2 => ("RC4".to_string(), Some(length)),
        4 => crypt_filter_method(encrypt_dict).unwrap_or(("RC4/AES".to_string(), Some(length))),
        5 => ("AES".to_string(), Some(256)),
        _ => ("Sconosciuto".to_string(), Some(length)),
    }
}

/// Reads `/CF/StdCF/CFM` for `V4` documents, which use crypt filters instead of a flat algorithm.
fn crypt_filter_method(encrypt_dict: &lopdf::Dictionary) -> Option<(String, Option<u32>)> {
    let cfm = encrypt_dict
        .get(b"CF")
        .and_then(|o| o.as_dict())
        .and_then(|cf| cf.get(b"StdCF"))
        .and_then(|o| o.as_dict())
        .and_then(|std_cf| std_cf.get(b"CFM"))
        .and_then(|o| o.as_name_str())
        .ok()?;

    Some(match cfm {
        "V2" => ("RC4".to_string(), Some(128)),
        "AESV2" => ("AES".to_string(), Some(128)),
        "AESV3" => ("AES".to_string(), Some(256)),
        other => (other.to_string(), None),
    })
}

#[cfg(test)]
mod tests;
