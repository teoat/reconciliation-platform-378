//! Network segmentation for zero-trust middleware

use crate::errors::{AppError, AppResult};
use actix_web::dev::ServiceRequest;

/// Check network segmentation
///
/// Validates that requests to admin endpoints originate from internal network ranges.
/// Uses RFC 1918 private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).
pub async fn check_network_segmentation(req: &ServiceRequest) -> AppResult<()> {
    let connection_info = req.connection_info();
    let peer_addr = connection_info.peer_addr();

    // Define internal network ranges (RFC 1918 private IP ranges)
    let internal_ranges = vec![
        ("10.0.0.0", "10.255.255.255"),
        ("172.16.0.0", "172.31.255.255"),
        ("192.168.0.0", "192.168.255.255"),
        ("127.0.0.1", "127.0.0.1"), // localhost
    ];

    // Example: Allow only internal IPs for admin endpoints
    if req.path().starts_with("/api/admin") {
        if let Some(addr) = peer_addr {
            // Extract IP from "IP:port" format
            let ip_str = addr.split(':').next().unwrap_or("");
            
            // Check if IP is in internal network range
            let is_internal = is_ip_in_ranges(ip_str, &internal_ranges);
            
            if !is_internal {
                log::warn!("Admin endpoint accessed from external IP: {}", ip_str);
                return Err(AppError::Forbidden(
                    "Admin endpoints are only accessible from internal networks".to_string()
                ));
            }
            
            log::debug!("Admin endpoint accessed from internal IP: {}", ip_str);
        } else {
            // If we can't determine the IP, be conservative
            log::warn!("Could not determine peer address for network segmentation check");
            return Err(AppError::Forbidden(
                "Could not verify network origin".to_string()
            ));
        }
    }

    Ok(())
}

/// Check if IP address is in any of the specified ranges
///
/// Validates if an IP address falls within any of the provided IP ranges.
/// Supports CIDR-like range checking for network segmentation.
pub fn is_ip_in_ranges(ip_str: &str, ranges: &[(&str, &str)]) -> bool {
    // Parse IP address
    let ip_parts: Vec<u32> = ip_str
        .split('.')
        .filter_map(|s| s.parse().ok())
        .collect();

    if ip_parts.len() != 4 {
        return false;
    }

    let ip_value = (ip_parts[0] << 24) | (ip_parts[1] << 16) | (ip_parts[2] << 8) | ip_parts[3];

    for (start_str, end_str) in ranges {
        let start_parts: Vec<u32> = start_str
            .split('.')
            .filter_map(|s| s.parse().ok())
            .collect();
        let end_parts: Vec<u32> = end_str
            .split('.')
            .filter_map(|s| s.parse().ok())
            .collect();

        if start_parts.len() == 4 && end_parts.len() == 4 {
            let start_value = (start_parts[0] << 24) | (start_parts[1] << 16) | (start_parts[2] << 8) | start_parts[3];
            let end_value = (end_parts[0] << 24) | (end_parts[1] << 16) | (end_parts[2] << 8) | end_parts[3];

            if ip_value >= start_value && ip_value <= end_value {
                return true;
            }
        }
    }

    false
}

