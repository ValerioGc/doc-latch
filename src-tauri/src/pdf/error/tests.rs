use super::*;

#[test]
fn file_not_found_message_includes_the_path() {
    let err = PdfError::FileNotFound("/tmp/missing.pdf".to_string());
    assert_eq!(err.to_string(), "File non trovato: /tmp/missing.pdf");
}

#[test]
fn render_error_message_includes_the_detail() {
    let err = PdfError::RenderError("pagina fuori range".to_string());
    assert_eq!(err.to_string(), "Errore di rendering: pagina fuori range");
}

#[test]
fn unit_variants_have_fixed_messages() {
    assert_eq!(PdfError::WrongPassword.to_string(), "Password errata");
    assert_eq!(
        PdfError::PasswordRequired.to_string(),
        "Password richiesta per aprire il documento"
    );
    assert_eq!(
        PdfError::InvalidPdf.to_string(),
        "PDF non valido o corrotto"
    );
}

#[test]
fn from_lopdf_error_always_maps_to_invalid_pdf() {
    let err: PdfError = lopdf::Error::DictKey.into();
    assert!(matches!(err, PdfError::InvalidPdf));
}

#[test]
fn from_io_not_found_maps_to_file_not_found() {
    let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "no such file");
    let err: PdfError = io_err.into();
    assert!(matches!(err, PdfError::FileNotFound(_)));
}

#[test]
fn from_io_other_errors_map_to_unknown() {
    let io_err = std::io::Error::new(std::io::ErrorKind::PermissionDenied, "denied");
    let err: PdfError = io_err.into();
    assert!(matches!(err, PdfError::Unknown(_)));
}

#[test]
fn serializes_with_kind_and_message_for_tuple_variants() {
    let err = PdfError::FileNotFound("/tmp/missing.pdf".to_string());
    let json = serde_json::to_value(&err).unwrap();

    assert_eq!(json["kind"], "FileNotFound");
    assert_eq!(json["message"], "/tmp/missing.pdf");
}

#[test]
fn serializes_without_message_for_unit_variants() {
    let err = PdfError::PasswordRequired;
    let json = serde_json::to_value(&err).unwrap();

    assert_eq!(json["kind"], "PasswordRequired");
    assert!(json.get("message").is_none());
}
