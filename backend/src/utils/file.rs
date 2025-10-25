//! File utility functions

use std::path::Path;
use uuid::Uuid;

/// Check if file extension is valid
pub fn is_valid_file_extension(filename: &str) -> bool {
    let extension = get_file_extension(filename);
    match extension {
        Some(ext) => {
            let valid_extensions = ["csv", "json", "xlsx", "xls", "txt"];
            valid_extensions.contains(&ext.to_lowercase().as_str())
        }
        None => false,
    }
}

/// Get file extension from filename
pub fn get_file_extension(filename: &str) -> Option<String> {
    Path::new(filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|s| s.to_string())
}

/// Generate unique filename
pub fn generate_unique_filename(original_filename: &str) -> String {
    let extension = get_file_extension(original_filename)
        .map(|ext| format!(".{}", ext))
        .unwrap_or_default();
    
    let uuid = Uuid::new_v4();
    format!("{}{}", uuid, extension)
}

/// Validate file size
pub fn validate_file_size(size: usize, max_size: usize) -> Result<(), String> {
    if size > max_size {
        Err(format!("File size {} exceeds maximum allowed size of {}", size, max_size))
    } else {
        Ok(())
    }
}

/// Get file size in human readable format
pub fn format_file_size(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }
    
    format!("{:.1} {}", size, UNITS[unit_index])
}

/// Sanitize filename for safe storage
pub fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| match c {
            'a'..='z' | 'A'..='Z' | '0'..='9' | '.' | '-' | '_' => c,
            _ => '_',
        })
        .collect()
}

/// Get MIME type from file extension
pub fn get_mime_type(filename: &str) -> &'static str {
    match get_file_extension(filename).as_deref() {
        Some("csv") => "text/csv",
        Some("json") => "application/json",
        Some("xlsx") => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        Some("xls") => "application/vnd.ms-excel",
        Some("txt") => "text/plain",
        _ => "application/octet-stream",
    }
}
