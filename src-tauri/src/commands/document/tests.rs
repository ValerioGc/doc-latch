use super::*;
use crate::test_support::{build_test_pdf, pdfium_dir, save_to_temp};

#[test]
fn open_pdf_delegates_to_the_reader_module() {
    let result = open_pdf("/nonexistent/path/file.pdf".to_string());

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}

#[test]
fn open_pdf_with_password_impl_propagates_wrong_password() {
    let Some(dir) = pdfium_dir() else {
        return;
    };

    // `verify_password` (and the impl built on top of it) maps any PDFium
    let result = open_pdf_with_password_impl(Some(dir), "/nonexistent/path/file.pdf", "wrong");

    assert!(matches!(result, Err(PdfError::WrongPassword)));
}

#[test]
fn open_pdf_with_password_impl_combines_verified_page_count_with_reader_info() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let path = file.path().to_str().unwrap();

    let info =
        open_pdf_with_password_impl(Some(dir), path, "irrelevant").expect("apertura PDF di test");

    assert_eq!(info.page_count, 1);
    assert!(info.is_encrypted);
}

#[test]
fn render_page_impl_renders_without_password() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let path = file.path().to_str().unwrap();

    let result = render_page_impl(Some(dir), path, 0, 1.0, None).expect("rendering pagina di test");

    assert_eq!(result.width_px, 200);
    assert_eq!(result.height_px, 300);
}

#[test]
fn render_page_impl_renders_with_password() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let path = file.path().to_str().unwrap();

    let result = render_page_impl(Some(dir), path, 0, 1.0, Some("irrelevant"));

    assert!(result.is_ok());
}

#[test]
fn render_page_impl_propagates_out_of_range_error() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let path = file.path().to_str().unwrap();

    let result = render_page_impl(Some(dir), path, 9, 1.0, None);

    assert!(matches!(result, Err(PdfError::RenderError(_))));
}
