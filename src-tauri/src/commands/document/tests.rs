use super::*;

// `open_pdf_with_password`, `render_page` and `render_page_with_password` all
// take a `tauri::AppHandle`, which can't be constructed in tests without
// `tauri::test::mock_app()` — that crashes the test binary on this dev
// machine. Only `open_pdf`, the one command with no AppHandle dependency, is
// covered here.

#[test]
fn open_pdf_delegates_to_the_reader_module() {
    let result = open_pdf("/nonexistent/path/file.pdf".to_string());

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}
