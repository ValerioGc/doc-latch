/// Errors that can occur during PDF operations.
/// Sent to the frontend as structured JSON.
#[derive(Debug, thiserror::Error, serde::Serialize, serde::Deserialize, Clone)]
#[serde(tag = "kind", content = "message")]
pub enum PdfError {
    #[error("File non trovato: {0}")]
    FileNotFound(String),

    #[error("Password errata")]
    WrongPassword,

    #[error("Password richiesta per aprire il documento")]
    PasswordRequired,

    #[error("PDF non valido o corrotto")]
    InvalidPdf,

    #[error("Il documento non è protetto da password")]
    NotEncrypted,

    #[error("Il documento è già protetto da password")]
    AlreadyEncrypted,

    #[error("Errore di rendering: {0}")]
    RenderError(String),

    #[error("Errore sconosciuto: {0}")]
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
