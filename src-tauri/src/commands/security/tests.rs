use super::*;

#[test]
fn get_security_info_delegates_to_the_pdf_security_module() {
    let result = get_security_info("/nonexistent/path/file.pdf".to_string());

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}

#[test]
fn add_password_delegates_to_the_pdf_security_module() {
    let result = add_password(
        "/nonexistent/path/file.pdf".to_string(),
        "secret".to_string(),
        "/tmp/out.pdf".to_string(),
    );

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}
