use super::*;

#[test]
fn get_security_info_delegates_to_the_pdf_security_module() {
    let result = get_security_info("/nonexistent/path/file.pdf".to_string());

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}
