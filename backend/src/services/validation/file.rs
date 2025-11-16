//! File validation

use crate::errors::AppError;
use regex::Regex;

pub struct FileValidator {
    file_extension_regex: Regex,
}

impl FileValidator {
    pub fn new() -> Result<Self, regex::Error> {
        Ok(Self {
            file_extension_regex: Regex::new(r"^\.(csv|xlsx|xls|json|xml|txt)$")?,
        })
    }

    pub fn with_regex(file_extension_regex: Regex) -> Self {
        Self { file_extension_regex }
    }

    pub fn validate_filename(&self, filename: &str) -> Result<(), AppError> {
        if filename.is_empty() {
            return Err(AppError::Validation("Filename is required".to_string()));
        }

        if filename.len() > 255 {
            return Err(AppError::Validation("Filename is too long".to_string()));
        }

        // Check for valid characters
        if filename.contains("..") || filename.contains("/") || filename.contains("\\") {
            return Err(AppError::Validation(
                "Filename contains invalid characters".to_string(),
            ));
        }

        // Check file extension
        if let Some(extension) = filename.split('.').next_back() {
            let ext_with_dot = format!(".{}", extension);
            if !self.file_extension_regex.is_match(&ext_with_dot) {
                return Err(AppError::Validation(
                    "Unsupported file extension".to_string(),
                ));
            }
        } else {
            return Err(AppError::Validation(
                "File must have an extension".to_string(),
            ));
        }

        Ok(())
    }

    pub fn validate_size(&self, size: u64, max_size: u64) -> Result<(), AppError> {
        if size == 0 {
            return Err(AppError::Validation("File is empty".to_string()));
        }

        if size > max_size {
            return Err(AppError::Validation(format!(
                "File size exceeds maximum allowed size of {} bytes",
                max_size
            )));
        }

        Ok(())
    }
}
