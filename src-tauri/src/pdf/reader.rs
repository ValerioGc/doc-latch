use lopdf::Document;
use serde::{Deserialize, Serialize};
use std::path::Path;

use super::error::PdfError;

/// Document metadata and properties — mirrors the TypeScript `DocumentInfo` interface.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DocumentInfo {
    pub path: String,
    pub page_count: u32,
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub creator: Option<String>,
    pub producer: Option<String>,
    pub creation_date: Option<String>,
    pub mod_date: Option<String>,
    pub pdf_version: String,
    pub page_width_pt: f64,
    pub page_height_pt: f64,
    pub is_encrypted: bool,
}

/// Attempts to load a PDF without a password.
/// Returns `PdfError::PasswordRequired` if the document is encrypted.
pub fn open_pdf(path: &str) -> Result<DocumentInfo, PdfError> {
    let file_path = Path::new(path);
    if !file_path.exists() {
        return Err(PdfError::FileNotFound(path.to_string()));
    }

    let doc = Document::load(file_path)?;

    if doc.is_encrypted() {
        return Err(PdfError::PasswordRequired);
    }

    extract_info(path, &doc)
}

/// Loads an encrypted PDF after the password has already been verified by pdfium.
pub fn open_pdf_with_password(path: &str, page_count: u32) -> Result<DocumentInfo, PdfError> {
    let file_path = Path::new(path);
    if !file_path.exists() {
        return Err(PdfError::FileNotFound(path.to_string()));
    }

    let doc = Document::load(file_path)?;

    Ok(DocumentInfo {
        path: path.to_string(),
        page_count,
        title: None,
        author: None,
        subject: None,
        creator: None,
        producer: None,
        creation_date: None,
        mod_date: None,
        pdf_version: doc.version.to_string(),
        page_width_pt: 0.0,
        page_height_pt: 0.0,
        is_encrypted: true,
    })
}

/// Extracts `DocumentInfo` from an already-loaded `lopdf::Document`.
fn extract_info(path: &str, doc: &Document) -> Result<DocumentInfo, PdfError> {
    let page_count = doc.get_pages().len() as u32;
    let pdf_version = doc.version.to_string();
    let is_encrypted = doc.is_encrypted();

    // Read optional Info dictionary
    let (title, author, subject, creator, producer, creation_date, mod_date) = read_info_dict(doc);

    // Read first page size
    let (page_width_pt, page_height_pt) = read_first_page_size(doc);

    Ok(DocumentInfo {
        path: path.to_string(),
        page_count,
        title,
        author,
        subject,
        creator,
        producer,
        creation_date,
        mod_date,
        pdf_version,
        page_width_pt,
        page_height_pt,
        is_encrypted,
    })
}

/// Decodes a raw PDF string per the spec
fn decode_pdf_string(bytes: &[u8]) -> String {
    if let [0xFE, 0xFF, rest @ ..] = bytes {
        let utf16: Vec<u16> = rest
            .chunks_exact(2)
            .map(|pair| u16::from_be_bytes([pair[0], pair[1]]))
            .collect();
        return String::from_utf16_lossy(&utf16);
    }

    bytes.iter().map(|&b| b as char).collect()
}

/// (title, author, subject, creator, producer, creation_date, mod_date)
type InfoDictFields = (
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>,
    Option<String>,
);

/// Reads string fields from the PDF /Info dictionary.
fn read_info_dict(doc: &Document) -> InfoDictFields {
    let get_str = |key: &str| -> Option<String> {
        doc.trailer
            .get(b"Info")
            .ok()
            .and_then(|obj| obj.as_reference().ok())
            .and_then(|id| doc.get_object(id).ok())
            .and_then(|obj| obj.as_dict().ok())
            .and_then(|dict| dict.get(key.as_bytes()).ok())
            .and_then(|obj| obj.as_str().ok())
            .map(decode_pdf_string)
    };

    (
        get_str("Title"),
        get_str("Author"),
        get_str("Subject"),
        get_str("Creator"),
        get_str("Producer"),
        get_str("CreationDate"),
        get_str("ModDate"),
    )
}

fn find_media_box(doc: &Document, page_id: lopdf::ObjectId) -> Option<&Vec<lopdf::Object>> {
    let mut current_id = page_id;

    for _ in 0..32 {
        let dict = doc.get_object(current_id).ok()?.as_dict().ok()?;

        if let Ok(arr) = dict.get(b"MediaBox").and_then(|obj| obj.as_array()) {
            return Some(arr);
        }

        current_id = dict
            .get(b"Parent")
            .and_then(|obj| obj.as_reference())
            .ok()?;
    }

    None
}

fn read_first_page_size(doc: &Document) -> (f64, f64) {
    let pages = doc.get_pages();
    let Some((_, &page_id)) = pages.iter().next() else {
        return (0.0, 0.0);
    };

    let Some(arr) = find_media_box(doc, page_id) else {
        return (0.0, 0.0);
    };

    if arr.len() == 4 {
        let w = arr[2].as_float().unwrap_or(0.0) - arr[0].as_float().unwrap_or(0.0);
        let h = arr[3].as_float().unwrap_or(0.0) - arr[1].as_float().unwrap_or(0.0);
        return (w as f64, h as f64);
    }

    (0.0, 0.0)
}

#[cfg(test)]
mod tests;
