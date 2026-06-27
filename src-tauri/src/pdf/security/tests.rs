use lopdf::{dictionary, Document, Object};
use tempfile::NamedTempFile;

use super::*;
use crate::test_support::{build_test_pdf, encrypt_test_pdf, save_to_temp};

/// Builds on top of the shared unencrypted test PDF by attaching a hand-crafted
/// `/Encrypt` dictionary to the trailer. The `/O` and `/U` hashes are placeholders
/// (lopdf 0.33 can't write real encryption) — `get_security_info` never decrypts
/// content, it only reads the dictionary fields, so this is enough to test it.
fn build_encrypted_test_pdf(
    version: i64,
    length: i64,
    permissions: i64,
    cfm: Option<&str>,
) -> lopdf::Document {
    let mut doc = build_test_pdf();

    let mut encrypt_dict = dictionary! {
        "Filter" => "Standard",
        "V" => version,
        "R" => 3,
        "Length" => length,
        "P" => permissions,
        "O" => Object::string_literal("owner-hash-placeholder"),
        "U" => Object::string_literal("user-hash-placeholder"),
    };

    if let Some(cfm_name) = cfm {
        let std_cf = dictionary! {
            "CFM" => Object::Name(cfm_name.as_bytes().to_vec()),
            "AuthEvent" => "DocOpen",
            "Length" => length / 8,
        };
        let cf = dictionary! {
            "StdCF" => Object::Dictionary(std_cf),
        };
        encrypt_dict.set("CF", Object::Dictionary(cf));
        encrypt_dict.set("StmF", Object::Name(b"StdCF".to_vec()));
        encrypt_dict.set("StrF", Object::Name(b"StdCF".to_vec()));
    }

    let encrypt_id = doc.add_object(Object::Dictionary(encrypt_dict));
    doc.trailer.set("Encrypt", encrypt_id);
    doc
}

#[test]
fn returns_file_not_found_for_missing_file() {
    let result = get_security_info("/nonexistent/path/file.pdf");

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}

#[test]
fn unencrypted_document_has_no_restrictions() {
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert!(!info.is_encrypted);
    assert_eq!(info.encryption_method, None);
    assert!(info.can_print);
    assert!(info.can_modify);
    assert!(info.can_copy);
    assert!(info.can_annotate);
    assert!(info.can_fill_forms);
    assert!(info.can_extract_for_accessibility);
    assert!(info.can_assemble);
    assert!(info.can_print_high_res);
}

#[test]
fn rc4_40bit_reports_fixed_key_length_regardless_of_length_field() {
    let mut doc = build_encrypted_test_pdf(1, 128, 0, None);
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert!(info.is_encrypted);
    assert_eq!(info.encryption_method.as_deref(), Some("RC4"));
    assert_eq!(info.key_length_bits, Some(40));
}

#[test]
fn rc4_variable_length_reports_length_field() {
    let mut doc = build_encrypted_test_pdf(2, 128, 0, None);
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert_eq!(info.encryption_method.as_deref(), Some("RC4"));
    assert_eq!(info.key_length_bits, Some(128));
}

#[test]
fn crypt_filter_aesv2_reports_aes_128() {
    let mut doc = build_encrypted_test_pdf(4, 128, 0, Some("AESV2"));
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert_eq!(info.encryption_method.as_deref(), Some("AES"));
    assert_eq!(info.key_length_bits, Some(128));
}

#[test]
fn crypt_filter_aesv3_reports_aes_256() {
    let mut doc = build_encrypted_test_pdf(4, 256, 0, Some("AESV3"));
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert_eq!(info.encryption_method.as_deref(), Some("AES"));
    assert_eq!(info.key_length_bits, Some(256));
}

#[test]
fn version_5_reports_aes_256() {
    let mut doc = build_encrypted_test_pdf(5, 256, 0, None);
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert_eq!(info.encryption_method.as_deref(), Some("AES"));
    assert_eq!(info.key_length_bits, Some(256));
}

#[test]
fn unknown_version_reports_a_fallback_label() {
    let mut doc = build_encrypted_test_pdf(99, 128, 0, None);
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert_eq!(info.encryption_method.as_deref(), Some("Sconosciuto"));
}

#[test]
fn remove_password_returns_file_not_found_for_missing_file() {
    let result = remove_password("/nonexistent/path/file.pdf", "secret", "/tmp/out.pdf");

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}

#[test]
fn remove_password_returns_not_encrypted_for_unprotected_document() {
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let destination = NamedTempFile::new().expect("creazione file temporaneo");

    let result = remove_password(
        file.path().to_str().unwrap(),
        "irrelevant",
        destination.path().to_str().unwrap(),
    );

    assert!(matches!(result, Err(PdfError::NotEncrypted)));
}

#[test]
fn remove_password_returns_wrong_password_for_incorrect_password() {
    let mut doc = encrypt_test_pdf(build_test_pdf(), "owner-secret", "user-secret");
    let file = save_to_temp(&mut doc);
    let destination = NamedTempFile::new().expect("creazione file temporaneo");

    let result = remove_password(
        file.path().to_str().unwrap(),
        "wrong-password",
        destination.path().to_str().unwrap(),
    );

    assert!(matches!(result, Err(PdfError::WrongPassword)));
}

#[test]
fn remove_password_saves_an_unencrypted_copy_on_success() {
    let mut doc = encrypt_test_pdf(build_test_pdf(), "owner-secret", "user-secret");
    let file = save_to_temp(&mut doc);
    let destination = NamedTempFile::new().expect("creazione file temporaneo");

    remove_password(
        file.path().to_str().unwrap(),
        "user-secret",
        destination.path().to_str().unwrap(),
    )
    .expect("rimozione password");

    let result_doc = Document::load(destination.path()).expect("lettura copia decifrata");
    assert!(!result_doc.is_encrypted());
    assert_eq!(result_doc.get_pages().len(), 1);
}

#[test]
fn add_password_returns_file_not_found_for_missing_file() {
    let result = add_password("/nonexistent/path/file.pdf", "secret", "/tmp/out.pdf");

    assert!(matches!(result, Err(PdfError::FileNotFound(_))));
}

#[test]
fn add_password_returns_already_encrypted_for_protected_document() {
    let mut doc = encrypt_test_pdf(build_test_pdf(), "owner-secret", "user-secret");
    let file = save_to_temp(&mut doc);
    let destination = NamedTempFile::new().expect("creazione file temporaneo");

    let result = add_password(
        file.path().to_str().unwrap(),
        "new-secret",
        destination.path().to_str().unwrap(),
    );

    assert!(matches!(result, Err(PdfError::AlreadyEncrypted)));
}

#[test]
fn add_password_saves_an_encrypted_copy_on_success() {
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let destination = NamedTempFile::new().expect("creazione file temporaneo");

    add_password(
        file.path().to_str().unwrap(),
        "new-secret",
        destination.path().to_str().unwrap(),
    )
    .expect("aggiunta password");

    let unauthenticated = Document::load(destination.path()).expect("lettura copia cifrata");
    assert!(unauthenticated.is_encrypted());

    let decrypted = Document::load_with_password(destination.path(), "new-secret")
        .expect("apertura con la nuova password");
    assert_eq!(decrypted.get_pages().len(), 1);
}

#[test]
fn add_password_rejects_the_wrong_password_afterwards() {
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let destination = NamedTempFile::new().expect("creazione file temporaneo");

    add_password(
        file.path().to_str().unwrap(),
        "new-secret",
        destination.path().to_str().unwrap(),
    )
    .expect("aggiunta password");

    let result = Document::load_with_password(destination.path(), "wrong-password");
    assert!(result.is_err());
}

#[test]
fn add_password_encrypts_with_aes_256() {
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);
    let destination = NamedTempFile::new().expect("creazione file temporaneo");

    add_password(
        file.path().to_str().unwrap(),
        "new-secret",
        destination.path().to_str().unwrap(),
    )
    .expect("aggiunta password");

    let info = get_security_info(destination.path().to_str().unwrap())
        .expect("lettura informazioni di sicurezza");

    assert_eq!(info.encryption_method.as_deref(), Some("AES"));
    assert_eq!(info.key_length_bits, Some(256));
    assert!(info.can_print);
    assert!(info.can_modify);
}

#[test]
fn permission_bits_are_decoded_individually() {
    // print (bit3=4) + copy (bit5=16) + fill forms (bit9=256) + assemble (bit11=1024)
    let permissions = 4 + 16 + 256 + 1024;
    let mut doc = build_encrypted_test_pdf(2, 128, permissions, None);
    let file = save_to_temp(&mut doc);

    let info = get_security_info(file.path().to_str().unwrap()).expect("lettura PDF di test");

    assert!(info.can_print);
    assert!(!info.can_modify);
    assert!(info.can_copy);
    assert!(!info.can_annotate);
    assert!(info.can_fill_forms);
    assert!(!info.can_extract_for_accessibility);
    assert!(info.can_assemble);
    assert!(!info.can_print_high_res);
}
