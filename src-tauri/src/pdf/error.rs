/// Errors that can occur during PDF operations.
/// Sent to the frontend as structured JSON.
#[derive(Debug, thiserror::Error, serde::Serialize, serde::Deserialize, Clone)]
#[serde(tag = "kind", content = "message")]
pub enum PdfError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Wrong password")]
    WrongPassword,

    #[error("Password required to open the document")]
    PasswordRequired,

    #[error("Invalid or corrupted PDF document")]
    InvalidPdf,

    #[error("The document is not password protected")]
    NotEncrypted,

    #[error("The document is already password protected")]
    AlreadyEncrypted,

    #[error("Render error: {0}")]
    RenderError(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<lopdf::Error> for PdfError {
    fn from(_err: lopdf::Error) -> Self {
        PdfError::InvalidPdf
    }
}

impl From<std::io::Error> for PdfError {
    fn from(err: std::io::Error) -> Self {
        if err.kind() == std::io::ErrorKind::NotFound {
            PdfError::FileNotFound(err.to_string())
        } else {
            PdfError::Unknown(err.to_string())
        }
    }
}
