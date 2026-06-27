use super::*;
use crate::test_support::{build_test_pdf, pdfium_dir, save_to_temp};

// `bind_pdfium`, `render_page` and `verify_password` no longer take an
// `AppHandle` (see the refactor in renderer.rs): the resource directory is
// now a plain `Option<PathBuf>`, so they can be exercised directly with the
// real PDFium binary checked into `pdfium-bin/` for local development.
// Tests that need that binary skip themselves (instead of failing) when it
// isn't present, e.g. on a machine that hasn't run the PDFium download step.

// A dedicated "PDFium not found" test isn't reliable here: `cargo test` runs
// every test in this binary in one process, and once any other test in this
// file successfully binds the library, Windows keeps it loaded for the
// process — later `bind_to_library` calls with an unrelated path then
// resolve against that already-loaded module instead of failing.

#[test]
fn bind_pdfium_finds_library_in_resource_dir() {
    let Some(dir) = pdfium_dir() else {
        return;
    };

    assert!(bind_pdfium(Some(dir)).is_ok());
}

#[test]
fn render_page_returns_image_with_expected_dimensions() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);

    let result = render_page(Some(dir), file.path().to_str().unwrap(), 0, 1.0, None)
        .expect("rendering pagina di test");

    assert_eq!(result.width_px, 200);
    assert_eq!(result.height_px, 300);
    assert!(!result.image_base64.is_empty());
}

#[test]
fn render_page_scales_dimensions_by_zoom() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);

    let result = render_page(Some(dir), file.path().to_str().unwrap(), 0, 2.0, None)
        .expect("rendering pagina di test");

    assert_eq!(result.width_px, 400);
    assert_eq!(result.height_px, 600);
}

#[test]
fn render_page_with_password_renders_unencrypted_document() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);

    let result = render_page(
        Some(dir),
        file.path().to_str().unwrap(),
        0,
        1.0,
        Some("anything"),
    );

    assert!(result.is_ok());
}

#[test]
fn render_page_out_of_range_returns_render_error() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);

    let result = render_page(Some(dir), file.path().to_str().unwrap(), 5, 1.0, None);

    assert!(matches!(result, Err(PdfError::RenderError(_))));
}

#[test]
fn render_page_with_missing_file_returns_render_error() {
    let Some(dir) = pdfium_dir() else {
        return;
    };

    let result = render_page(Some(dir), "/nonexistent/path/file.pdf", 0, 1.0, None);

    assert!(matches!(result, Err(PdfError::RenderError(_))));
}

#[test]
fn verify_password_succeeds_for_unencrypted_pdf() {
    let Some(dir) = pdfium_dir() else {
        return;
    };
    let mut doc = build_test_pdf();
    let file = save_to_temp(&mut doc);

    let page_count = verify_password(Some(dir), file.path().to_str().unwrap(), "irrelevant")
        .expect("verifica password su PDF non protetto");

    assert_eq!(page_count, 1);
}

#[test]
fn verify_password_maps_load_failure_to_wrong_password() {
    let Some(dir) = pdfium_dir() else {
        return;
    };

    let result = verify_password(Some(dir), "/nonexistent/path/file.pdf", "anything");

    assert!(matches!(result, Err(PdfError::WrongPassword)));
}

#[test]
fn page_render_result_serializes_with_camel_case_fields() {
    let result = PageRenderResult {
        image_base64: "QUJD".to_string(),
        width_px: 800,
        height_px: 600,
    };

    let json = serde_json::to_value(&result).unwrap();

    assert_eq!(json["imageBase64"], "QUJD");
    assert_eq!(json["widthPx"], 800);
    assert_eq!(json["heightPx"], 600);
}

#[test]
fn page_render_result_round_trips_through_json() {
    let json = serde_json::json!({
        "imageBase64": "QUJD",
        "widthPx": 800,
        "heightPx": 600,
    });

    let result: PageRenderResult = serde_json::from_value(json).unwrap();

    assert_eq!(result.image_base64, "QUJD");
    assert_eq!(result.width_px, 800);
    assert_eq!(result.height_px, 600);
}
