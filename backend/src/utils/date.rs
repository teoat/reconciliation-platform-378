//! Date and time utility functions

use chrono::{DateTime, Utc, TimeZone};
use std::time::{SystemTime, UNIX_EPOCH};

/// Get current timestamp as Unix timestamp
/// Returns 0 if system time is before Unix epoch (should never happen in practice)
pub fn current_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| {
            log::error!("System time is before Unix epoch - this should never happen");
            std::time::Duration::ZERO
        })
        .as_secs() as i64
}

/// Get current UTC datetime
pub fn current_utc() -> DateTime<Utc> {
    Utc::now()
}

/// Convert Unix timestamp to UTC datetime
/// Returns current time if timestamp is invalid
pub fn timestamp_to_utc(timestamp: i64) -> DateTime<Utc> {
    Utc.timestamp_opt(timestamp, 0)
        .single()
        .unwrap_or_else(|| {
            log::warn!("Invalid timestamp {}, using current time", timestamp);
            Utc::now()
        })
}

/// Convert UTC datetime to Unix timestamp
pub fn utc_to_timestamp(dt: DateTime<Utc>) -> i64 {
    dt.timestamp()
}

/// Format datetime for display
pub fn format_datetime(dt: DateTime<Utc>) -> String {
    dt.format("%Y-%m-%d %H:%M:%S UTC").to_string()
}

/// Format date for display
pub fn format_date(dt: DateTime<Utc>) -> String {
    dt.format("%Y-%m-%d").to_string()
}

/// Parse ISO 8601 datetime string
pub fn parse_iso_datetime(iso_str: &str) -> Result<DateTime<Utc>, String> {
    DateTime::parse_from_rfc3339(iso_str)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| format!("Failed to parse datetime: {}", e))
}

/// Get start of day for a given datetime
pub fn start_of_day(dt: DateTime<Utc>) -> DateTime<Utc> {
    dt.date_naive()
        .and_hms_opt(0, 0, 0)
        .ok_or_else(|| {
            log::warn!("Failed to create start of day for datetime, using original datetime");
            dt.naive_utc()
        })
        .unwrap_or_else(|_| dt.naive_utc())
        .and_utc()
}

/// Get end of day for a given datetime
pub fn end_of_day(dt: DateTime<Utc>) -> DateTime<Utc> {
    dt.date_naive()
        .and_hms_opt(23, 59, 59)
        .ok_or_else(|| {
            log::warn!("Failed to create end of day for datetime, using original datetime");
            dt.naive_utc()
        })
        .unwrap_or_else(|_| dt.naive_utc())
        .and_utc()
}

/// Check if a datetime is within a date range
pub fn is_within_date_range(dt: DateTime<Utc>, start: DateTime<Utc>, end: DateTime<Utc>) -> bool {
    dt >= start && dt <= end
}

/// Get days between two datetimes
pub fn days_between(start: DateTime<Utc>, end: DateTime<Utc>) -> i64 {
    (end - start).num_days()
}
