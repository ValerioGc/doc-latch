//! Shared helpers for unit tests across `pdf::renderer` and `commands::document`.
//! `#[cfg(test)]`-only, so it never ships in a release build.

use std::path::PathBuf;

use lopdf::encryption::{EncryptionState, EncryptionVersion, Permissions};
use lopdf::{dictionary, Dictionary, Document, Object, Stream};
use tempfile::NamedTempFile;

/// Resolves the local PDFium binary directory checked into `pdfium-bin/`, or
/// `None` if it hasn't been downloaded on this machine. Tests that need a
/// real PDFium binding skip themselves when this returns `None`.
pub fn pdfium_dir() -> Option<PathBuf> {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("pdfium-bin/windows");
    dir.join("pdfium.dll").exists().then_some(dir)
}

/// Builds a minimal one-page, 200x300pt PDF in memory for rendering tests.
pub fn build_test_pdf() -> Document {
    let mut doc = Document::with_version("1.7");

    let content_id = doc.add_object(Stream::new(Dictionary::new(), b"BT ET".to_vec()));
    let pages_id = doc.new_object_id();
    let page_id = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content_id,
    });
    let pages = dictionary! {
        "Type" => "Pages",
        "Kids" => vec![page_id.into()],
        "Count" => 1,
        "MediaBox" => vec![0.into(), 0.into(), 200.into(), 300.into()],
    };
    doc.objects.insert(pages_id, Object::Dictionary(pages));

    let catalog_id = doc.add_object(dictionary! {
        "Type" => "Catalog",
        "Pages" => pages_id,
    });

    doc.trailer.set("Root", catalog_id);
    doc.compress();
    doc
}

pub fn save_to_temp(doc: &mut Document) -> NamedTempFile {
    let file = NamedTempFile::new().expect("creating temporary file");
    doc.save(file.path()).expect("saving test PDF");
    file
}

/// Encrypts a document with real RC4-128 (V2/R3) encryption, for tests that need
/// a password-protected PDF (e.g. to exercise `Document::load_with_password`).
pub fn encrypt_test_pdf(mut doc: Document, owner_password: &str, user_password: &str) -> Document {
    doc.trailer.set(
        "ID",
        vec![
            Object::string_literal("test-file-id"),
            Object::string_literal("test-file-id"),
        ],
    );

    let state = EncryptionState::try_from(EncryptionVersion::V2 {
        document: &doc,
        owner_password,
        user_password,
        key_length: 128,
        permissions: Permissions::all(),
    })
    .expect("creating test encryption state");

    doc.encrypt(&state).expect("encrypting test PDF");
    doc
}
