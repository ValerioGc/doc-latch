use std::path::PathBuf;

use tauri::{command, AppHandle, Manager};

use crate::pdf::{error::PdfError, reader::DocumentInfo, renderer::PageRenderResult};

/// Opens a PDF file without a password.
#[command]
pub fn open_pdf(path: String) -> Result<DocumentInfo, PdfError> {
    crate::pdf::reader::open_pdf(&path)
}

/// Opens a password-protected PDF.
#[command]
pub fn open_pdf_with_password(
    app: AppHandle,
    path: String,
    password: String,
) -> Result<DocumentInfo, PdfError> {
    open_pdf_with_password_impl(app.path().resource_dir().ok(), &path, &password)
}

/// Resource-dir-only composition for `open_pdf_with_password`, kept free of
/// `AppHandle` so it can be unit-tested directly (constructing a real
/// `AppHandle` in tests requires `tauri::test::mock_app()`, which crashes the
/// test binary on this dev machine).
fn open_pdf_with_password_impl(
    resource_dir: Option<PathBuf>,
    path: &str,
    password: &str,
) -> Result<DocumentInfo, PdfError> {
    let page_count = crate::pdf::renderer::verify_password(resource_dir, path, password)?;
    crate::pdf::reader::open_pdf_with_password(path, page_count)
}

/// Renders a single page and returns a base64-encoded PNG.
#[command]
pub fn render_page(
    app: AppHandle,
    path: String,
    page: u32,
    zoom: f32,
) -> Result<PageRenderResult, PdfError> {
    render_page_impl(app.path().resource_dir().ok(), &path, page, zoom, None)
}

/// Renders a page from a password-protected document.
#[command]
pub fn render_page_with_password(
    app: AppHandle,
    path: String,
    page: u32,
    zoom: f32,
    password: String,
) -> Result<PageRenderResult, PdfError> {
    render_page_impl(app.path().resource_dir().ok(), &path, page, zoom, Some(&password))
}

/// Resource-dir-only composition for both render commands; see
/// `open_pdf_with_password_impl` for why `AppHandle` isn't used here.
fn render_page_impl(
    resource_dir: Option<PathBuf>,
    path: &str,
    page: u32,
    zoom: f32,
    password: Option<&str>,
) -> Result<PageRenderResult, PdfError> {
    crate::pdf::renderer::render_page(resource_dir, path, page, zoom, password)
}

#[cfg(test)]
mod tests;
