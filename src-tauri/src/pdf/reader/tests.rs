use lopdf::{dictionary, Dictionary, Document, Object, Stream, StringFormat};
use tempfile::NamedTempFile;

use super::*;

/// Builds a minimal one-page PDF in memory, with the MediaBox set on the
/// /Pages node (inherited by the page) to mirror real-world documents
fn build_test_pdf(title: Option<&str>, author_utf16be: Option<&str>) -> Document {
    let mut doc = Document::with_version("1.7");

    let mut info = Dictionary::new();
    if let Some(t) = title {
        info.set("Title", Object::string_literal(t));
    }
    if let Some(a) = author_utf16be {
        let mut bytes = vec![0xFEu8, 0xFF];
        for unit in a.encode_utf16() {
            bytes.extend_from_slice(&unit.to_be_bytes());
        }
        info.set("Author", Object::String(bytes, StringFormat::Literal));
    }
    let info_id = doc.add_object(info);

    let pages_id = doc.new_object_id();
    let content_id = doc.add_object(Stream::new(Dictionary::new(), b"BT ET".to_vec()));
    let page_id = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => content_id,
    });
    let pages = dictionary! {
        "Type" => "Pages",
        "Kids" => vec![page_id.into()],
        "Count" => 1,
        "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
    };
    doc.objects.insert(pages_id, Object::Dictionary(pages));

    let catalog_id = doc.add_object(dictionary! {
        "Type" => "Catalog",
        "Pages" => pages_id,
    });

    doc.trailer.set("Root", catalog_id);
    doc.trailer.set("Info", info_id);
    doc.compress();
    doc
}

fn save_to_temp(doc: &mut Document) -> NamedTempFile {
    let file = NamedTempFile::new().expect("creazione file temporaneo");
    doc.save(file.path()).expect("salvataggio PDF di test");
    file
}

#[test]
fn open_nonexistent_file_returns_error() {
    let result = open_pdf("/nonexistent/path/file.pdf");
    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}

#[test]
fn open_with_password_nonexistent_file_returns_error() {
    let result = open_pdf_with_password("/nonexistent/path/file.pdf", 0);
    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}

#[test]
fn decode_pdf_string_handles_plain_ascii() {
    assert_eq!(decode_pdf_string(b"Valerio Genco"), "Valerio Genco");
}

#[test]
fn decode_pdf_string_handles_empty_input() {
    assert_eq!(decode_pdf_string(b""), "");
}

#[test]
fn decode_pdf_string_handles_utf16be_with_bom() {
    let mut bytes = vec![0xFE, 0xFF];
    for unit in "Microsoft® Word".encode_utf16() {
        bytes.extend_from_slice(&unit.to_be_bytes());
    }

    assert_eq!(decode_pdf_string(&bytes), "Microsoft® Word");
}

#[test]
fn open_pdf_reads_page_count_and_size_from_inherited_media_box() {
    let mut doc = build_test_pdf(Some("Test Title"), None);
    let file = save_to_temp(&mut doc);

    let info = open_pdf(file.path().to_str().unwrap()).expect("apertura PDF di test");

    assert_eq!(info.page_count, 1);
    assert_eq!(info.page_width_pt, 595.0);
    assert_eq!(info.page_height_pt, 842.0);
    assert!(!info.is_encrypted);
}

#[test]
fn open_pdf_decodes_plain_ascii_title() {
    let mut doc = build_test_pdf(Some("Test Title"), None);
    let file = save_to_temp(&mut doc);

    let info = open_pdf(file.path().to_str().unwrap()).expect("apertura PDF di test");

    assert_eq!(info.title.as_deref(), Some("Test Title"));
}

#[test]
fn open_pdf_decodes_utf16be_author() {
    let mut doc = build_test_pdf(None, Some("Müller®"));
    let file = save_to_temp(&mut doc);

    let info = open_pdf(file.path().to_str().unwrap()).expect("apertura PDF di test");

    assert_eq!(info.author.as_deref(), Some("Müller®"));
}

#[test]
fn open_pdf_returns_none_for_missing_info_fields() {
    let mut doc = build_test_pdf(None, None);
    let file = save_to_temp(&mut doc);

    let info = open_pdf(file.path().to_str().unwrap()).expect("apertura PDF di test");

    assert_eq!(info.title, None);
    assert_eq!(info.author, None);
}

#[test]
fn find_media_box_walks_up_to_parent_pages_dict() {
    let doc = build_test_pdf(None, None);
    let (_, &page_id) = doc.get_pages().iter().next().expect("pagina di test");

    let media_box = find_media_box(&doc, page_id).expect("MediaBox ereditato dal Parent");

    assert_eq!(media_box.len(), 4);
}

#[test]
fn read_first_page_size_returns_zero_for_document_without_pages() {
    let doc = Document::with_version("1.7");

    assert_eq!(read_first_page_size(&doc), (0.0, 0.0));
}
