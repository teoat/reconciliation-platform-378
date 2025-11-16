//! Internationalization service data models and types
//!
//! This module contains all the data structures used by the internationalization service.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Supported language
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Language {
    pub code: String,        // ISO 639-1 code (e.g., "en", "es", "fr")
    pub name: String,        // Display name (e.g., "English", "Spanish", "French")
    pub native_name: String, // Native name (e.g., "English", "Español", "Français")
    pub is_rtl: bool,        // Right-to-left language
    pub is_default: bool,
}

/// Supported locale
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Locale {
    pub code: String, // ISO 639-1 + ISO 3166-1 (e.g., "en-US", "es-ES", "fr-FR")
    pub language_code: String,
    pub country_code: String,
    pub name: String,
    pub date_format: String,
    pub time_format: String,
    pub number_format: NumberFormat,
    pub currency_format: CurrencyFormat,
}

/// Number format configuration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct NumberFormat {
    pub decimal_separator: String,
    pub thousands_separator: String,
    pub grouping: Vec<usize>,
    pub precision: usize,
}

/// Currency format configuration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct CurrencyFormat {
    pub symbol: String,
    pub position: CurrencyPosition,
    pub decimal_places: usize,
    pub symbol_spacing: bool,
}

/// Currency symbol position
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum CurrencyPosition {
    Before,
    After,
}

/// Translation entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Translation {
    pub key: String,
    pub language_code: String,
    pub value: String,
    pub context: Option<String>,
    pub plural_forms: Option<HashMap<String, String>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Translation request
#[derive(Debug, Deserialize)]
pub struct TranslationRequest {
    pub key: String,
    pub language_code: String,
    pub context: Option<String>,
}

/// Translation response
#[derive(Debug, Serialize)]
pub struct TranslationResponse {
    pub key: String,
    pub value: String,
    pub language_code: String,
    pub context: Option<String>,
}

/// Timezone information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimezoneInfo {
    pub code: String, // IANA timezone code (e.g., "America/New_York", "Europe/London")
    pub name: String, // Display name
    pub offset_seconds: i32,
    pub is_dst: bool,
    pub dst_offset_seconds: Option<i32>,
}

/// Localization context for requests
#[derive(Debug, Clone)]
pub struct LocalizationContext {
    pub language_code: String,
    pub locale_code: String,
    pub timezone: String,
}

/// Translation statistics
#[derive(Debug, Serialize)]
pub struct TranslationStats {
    pub total_translations: usize,
    pub total_languages: usize,
    pub total_keys: usize,
    pub coverage_percentage: f64,
}
