use tauri::{command, AppHandle};

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
    let page_count = crate::pdf::renderer::verify_password(&app, &path, &password)?;
    crate::pdf::reader::open_pdf_with_password(&path, page_count)
}

/// Renders a single page and returns a base64-encoded PNG.
#[command]
pub fn render_page(
    app: AppHandle,
    path: String,
    page: u32,
    zoom: f32,
) -> Result<PageRenderResult, PdfError> {
    crate::pdf::renderer::render_page(&app, &path, page, zoom, None)
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
    crate::pdf::renderer::render_page(&app, &path, page, zoom, Some(&password))
}

#[cfg(test)]
mod tests;
