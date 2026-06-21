use super::*;

// `bind_pdfium`, `render_page` and `verify_password` all require a real
// `&AppHandle<R>`. Building one via `tauri::test::mock_app()` crashes the
// whole test binary on this dev machine (STATUS_ENTRYPOINT_NOT_FOUND) before
// any assertion runs, so only the AppHandle-independent IPC contract is
// covered here.

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
