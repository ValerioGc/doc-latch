use std::io::Cursor;
use std::path::PathBuf;

use base64::{engine::general_purpose, Engine};
use image::ImageFormat;
use pdfium_render::prelude::*;
use serde::{Deserialize, Serialize};

use super::error::PdfError;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PageRenderResult {
    pub image_base64: String,
    pub width_px: u32,
    pub height_px: u32,
}

/// Loads the native PDFium library. `resource_dir` is the Tauri app's resource directory
fn bind_pdfium(resource_dir: Option<PathBuf>) -> Result<Pdfium, PdfError> {
    let candidate_dirs: Vec<PathBuf> = [
        resource_dir,
        std::env::current_exe() 
            .ok()
            .and_then(|p| p.parent().map(std::path::Path::to_path_buf)),
    ]
    .into_iter()
    .flatten()
    .collect();

    let bindings = candidate_dirs
        .iter()
        .find_map(|dir| {
            Pdfium::bind_to_library(Pdfium::pdfium_platform_library_name_at_path(dir)).ok()
        })
        .or_else(|| {
            Pdfium::bind_to_library(Pdfium::pdfium_platform_library_name_at_path("./")).ok()
        })
        .or_else(|| Pdfium::bind_to_system_library().ok())
        .ok_or_else(|| {
            PdfError::RenderError(
                "PDFium not found: add pdfium.dll in src-tauri/".to_string(),
            )
        })?;

    Ok(Pdfium::new(bindings))
}

/// Renders a PDF page to a base64-encoded PNG image string, along with its dimensions in pixels.
pub fn render_page(
    resource_dir: Option<PathBuf>,
    path: &str,
    page: u32,
    zoom: f32,
    password: Option<&str>,
) -> Result<PageRenderResult, PdfError> {
    let pdfium = bind_pdfium(resource_dir)?;

    let doc = match password {
        Some(pwd) => pdfium
            .load_pdf_from_file(path, Some(pwd))
            .map_err(|e| PdfError::RenderError(e.to_string()))?,
        None => pdfium
            .load_pdf_from_file(path, None)
            .map_err(|e| PdfError::RenderError(e.to_string()))?,
    };

    let page_count = doc.pages().len() as u32;
    if page >= page_count {
        return Err(PdfError::RenderError(format!(
            "Page {page} out of range (total: {page_count})"
        )));
    }

    let pdf_page = doc
        .pages()
        .get(page as u16)
        .map_err(|e| PdfError::RenderError(e.to_string()))?;

    let render_config = PdfRenderConfig::new()
        .set_target_width((pdf_page.width().value * zoom) as i32)
        .set_target_height((pdf_page.height().value * zoom) as i32);

    let bitmap = pdf_page
        .render_with_config(&render_config)
        .map_err(|e| PdfError::RenderError(e.to_string()))?;

    let img = bitmap.as_image();
    let width_px = img.width();
    let height_px = img.height();

    let mut png_bytes: Vec<u8> = Vec::new();
    img.write_to(&mut Cursor::new(&mut png_bytes), ImageFormat::Png)
        .map_err(|e| PdfError::RenderError(e.to_string()))?;

    let image_base64 = general_purpose::STANDARD.encode(&png_bytes);

    Ok(PageRenderResult {
        image_base64,
        width_px,
        height_px,
    })
}

/// Verifies that a password is correct for an encrypted PDF.
pub fn verify_password(
    resource_dir: Option<PathBuf>,
    path: &str,
    password: &str,
) -> Result<u32, PdfError> {
    let pdfium = bind_pdfium(resource_dir)?;

    let doc = pdfium
        .load_pdf_from_file(path, Some(password))
        .map_err(|_| PdfError::WrongPassword)?;

    Ok(doc.pages().len() as u32)
}

#[cfg(test)]
mod tests;
