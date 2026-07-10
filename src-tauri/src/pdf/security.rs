use lopdf::encryption::crypt_filters::{Aes256CryptFilter, CryptFilter};
use lopdf::encryption::{EncryptionState, EncryptionVersion, Permissions};
use lopdf::{Document, Object};
use rand::RngExt;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Arc;

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

/// Decrypts a password-protected PDF and saves an unencrypted copy at `destination`.
pub fn remove_password(path: &str, password: &str, destination: &str) -> Result<(), PdfError> {
    let file_path = Path::new(path);
    if !file_path.exists() {
        return Err(PdfError::FileNotFound(path.to_string()));
    }

    if !Document::load(file_path)?.is_encrypted() {
        return Err(PdfError::NotEncrypted);
    }

    let mut doc =
        Document::load_with_password(file_path, password).map_err(|_| PdfError::WrongPassword)?;

    doc.trailer.remove(b"Encrypt");
    doc.save(destination)?;

    Ok(())
}

/// Encrypts an unprotected PDF with AES-256 (single password, full permissions)
/// and saves the protected copy at `destination`.
pub fn add_password(path: &str, password: &str, destination: &str) -> Result<(), PdfError> {
    let file_path = Path::new(path);
    if !file_path.exists() {
        return Err(PdfError::FileNotFound(path.to_string()));
    }

    let mut doc = Document::load(file_path)?;

    if doc.is_encrypted() {
        return Err(PdfError::AlreadyEncrypted);
    }

    ensure_file_id(&mut doc);

    let file_encryption_key = random_bytes::<32>();
    let crypt_filter: Arc<dyn CryptFilter> = Arc::new(Aes256CryptFilter);

    let state = EncryptionState::try_from(EncryptionVersion::V5 {
        encrypt_metadata: true,
        crypt_filters: BTreeMap::from([(b"StdCF".to_vec(), crypt_filter)]),
        file_encryption_key: &file_encryption_key,
        stream_filter: b"StdCF".to_vec(),
        string_filter: b"StdCF".to_vec(),
        owner_password: password,
        user_password: password,
        permissions: Permissions::all(),
    })?;

    doc.encrypt(&state)?;
    doc.save(destination)?;

    Ok(())
}

/// Sets the trailer's `/ID` entry if missing — required for encryption key
/// derivation, but freshly-built or already-decrypted documents may lack one.
fn ensure_file_id(doc: &mut Document) {
    if doc.trailer.get(b"ID").is_ok() {
        return;
    }

    let id = random_bytes::<16>().to_vec();
    doc.trailer.set(
        "ID",
        vec![
            Object::string_literal(id.clone()),
            Object::string_literal(id),
        ],
    );
}

/// Fills an array of `N` bytes from a CSPRNG, for file IDs and encryption keys.
fn random_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    rand::rng().fill(&mut bytes);
    bytes
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
        _ => ("Unknown".to_string(), Some(length)),
    }
}

/// Reads `/CF/StdCF/CFM` for `V4` documents, which use crypt filters instead of a flat algorithm.
fn crypt_filter_method(encrypt_dict: &lopdf::Dictionary) -> Option<(String, Option<u32>)> {
    let cfm_bytes = encrypt_dict
        .get(b"CF")
        .and_then(|o| o.as_dict())
        .and_then(|cf| cf.get(b"StdCF"))
        .and_then(|o| o.as_dict())
        .and_then(|std_cf| std_cf.get(b"CFM"))
        .and_then(|o| o.as_name())
        .ok()?;
    let cfm = std::str::from_utf8(cfm_bytes).ok()?;

    Some(match cfm {
        "V2" => ("RC4".to_string(), Some(128)),
        "AESV2" => ("AES".to_string(), Some(128)),
        "AESV3" => ("AES".to_string(), Some(256)),
        other => (other.to_string(), None),
    })
}
