//! Helper functions for handlers
//! 
//! Shared utility functions used across multiple handler modules.

use actix_web::HttpRequest;
use crate::utils::extract_user_id as extract_user_id_util;

/// Helper function to mask email addresses for logging
pub fn mask_email(email: &str) -> String {
    if let Some(at_pos) = email.find('@') {
        let local = &email[..at_pos];
        let domain = &email[at_pos..];
        if local.len() > 2 {
            format!("{}***{}", &local[..2], domain)
        } else {
            format!("***{}", domain)
        }
    } else {
        "***@***".to_string()
    }
}

/// Helper function to get client IP address
pub fn get_client_ip(req: &HttpRequest) -> String {
    // Try X-Forwarded-For header first (for proxies/load balancers)
    if let Some(forwarded_for) = req.headers().get("X-Forwarded-For") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            // Take the first IP if there are multiple
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return first_ip.trim().to_string();
            }
        }
    }

    // Try X-Real-IP header
    if let Some(real_ip) = req.headers().get("X-Real-IP") {
        if let Ok(real_ip_str) = real_ip.to_str() {
            return real_ip_str.to_string();
        }
    }

    // Fall back to connection info
    req.connection_info()
        .remote_addr()
        .unwrap_or("unknown")
        .to_string()
}

/// Helper function to get user agent
pub fn get_user_agent(req: &HttpRequest) -> String {
    req.headers()
        .get("User-Agent")
        .and_then(|ua| ua.to_str().ok())
        .unwrap_or("unknown")
        .to_string()
}

/// Helper function to extract user ID from request
pub fn extract_user_id(req: &HttpRequest) -> Result<uuid::Uuid, crate::errors::AppError> {
    extract_user_id_util(req)
}

/// Helper function to get memory usage percentage
pub fn get_memory_usage() -> f64 {
    // Placeholder for actual memory monitoring
    // In production, use system-level APIs like sysinfo crate
    45.0 // Mock value
}
