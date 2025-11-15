//! Internationalization service default data
//!
//! This module contains default languages, locales, and translations data.

use crate::services::internationalization_models::{
    Language, Locale, NumberFormat, CurrencyFormat, CurrencyPosition, TimezoneInfo, Translation
};
use chrono::Utc;

/// Get default languages
pub fn get_default_languages() -> Vec<Language> {
    vec![
        Language {
            code: "en".to_string(),
            name: "English".to_string(),
            native_name: "English".to_string(),
            is_rtl: false,
            is_default: true,
        },
        Language {
            code: "es".to_string(),
            name: "Spanish".to_string(),
            native_name: "Español".to_string(),
            is_rtl: false,
            is_default: false,
        },
        Language {
            code: "fr".to_string(),
            name: "French".to_string(),
            native_name: "Français".to_string(),
            is_rtl: false,
            is_default: false,
        },
        Language {
            code: "de".to_string(),
            name: "German".to_string(),
            native_name: "Deutsch".to_string(),
            is_rtl: false,
            is_default: false,
        },
        Language {
            code: "ar".to_string(),
            name: "Arabic".to_string(),
            native_name: "العربية".to_string(),
            is_rtl: true,
            is_default: false,
        },
        Language {
            code: "zh".to_string(),
            name: "Chinese".to_string(),
            native_name: "中文".to_string(),
            is_rtl: false,
            is_default: false,
        },
        Language {
            code: "ja".to_string(),
            name: "Japanese".to_string(),
            native_name: "日本語".to_string(),
            is_rtl: false,
            is_default: false,
        },
    ]
}

/// Get default locales
pub fn get_default_locales() -> Vec<Locale> {
    vec![
        Locale {
            code: "en-US".to_string(),
            language_code: "en".to_string(),
            country_code: "US".to_string(),
            name: "English (United States)".to_string(),
            date_format: "%m/%d/%Y".to_string(),
            time_format: "%I:%M %p".to_string(),
            number_format: NumberFormat {
                decimal_separator: ".".to_string(),
                thousands_separator: ",".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "$".to_string(),
                position: CurrencyPosition::Before,
                decimal_places: 2,
                symbol_spacing: false,
            },
        },
        Locale {
            code: "en-GB".to_string(),
            language_code: "en".to_string(),
            country_code: "GB".to_string(),
            name: "English (United Kingdom)".to_string(),
            date_format: "%d/%m/%Y".to_string(),
            time_format: "%H:%M".to_string(),
            number_format: NumberFormat {
                decimal_separator: ".".to_string(),
                thousands_separator: ",".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "£".to_string(),
                position: CurrencyPosition::Before,
                decimal_places: 2,
                symbol_spacing: false,
            },
        },
        Locale {
            code: "es-ES".to_string(),
            language_code: "es".to_string(),
            country_code: "ES".to_string(),
            name: "Spanish (Spain)".to_string(),
            date_format: "%d/%m/%Y".to_string(),
            time_format: "%H:%M".to_string(),
            number_format: NumberFormat {
                decimal_separator: ",".to_string(),
                thousands_separator: ".".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "€".to_string(),
                position: CurrencyPosition::After,
                decimal_places: 2,
                symbol_spacing: true,
            },
        },
        Locale {
            code: "fr-FR".to_string(),
            language_code: "fr".to_string(),
            country_code: "FR".to_string(),
            name: "French (France)".to_string(),
            date_format: "%d/%m/%Y".to_string(),
            time_format: "%H:%M".to_string(),
            number_format: NumberFormat {
                decimal_separator: ",".to_string(),
                thousands_separator: " ".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "€".to_string(),
                position: CurrencyPosition::After,
                decimal_places: 2,
                symbol_spacing: true,
            },
        },
        Locale {
            code: "de-DE".to_string(),
            language_code: "de".to_string(),
            country_code: "DE".to_string(),
            name: "German (Germany)".to_string(),
            date_format: "%d.%m.%Y".to_string(),
            time_format: "%H:%M".to_string(),
            number_format: NumberFormat {
                decimal_separator: ",".to_string(),
                thousands_separator: ".".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "€".to_string(),
                position: CurrencyPosition::After,
                decimal_places: 2,
                symbol_spacing: true,
            },
        },
        Locale {
            code: "ar-SA".to_string(),
            language_code: "ar".to_string(),
            country_code: "SA".to_string(),
            name: "Arabic (Saudi Arabia)".to_string(),
            date_format: "%d/%m/%Y".to_string(),
            time_format: "%h:%M %p".to_string(),
            number_format: NumberFormat {
                decimal_separator: ".".to_string(),
                thousands_separator: ",".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "ر.س".to_string(),
                position: CurrencyPosition::After,
                decimal_places: 2,
                symbol_spacing: true,
            },
        },
        Locale {
            code: "zh-CN".to_string(),
            language_code: "zh".to_string(),
            country_code: "CN".to_string(),
            name: "Chinese (China)".to_string(),
            date_format: "%Y-%m-%d".to_string(),
            time_format: "%H:%M".to_string(),
            number_format: NumberFormat {
                decimal_separator: ".".to_string(),
                thousands_separator: ",".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "¥".to_string(),
                position: CurrencyPosition::Before,
                decimal_places: 2,
                symbol_spacing: false,
            },
        },
        Locale {
            code: "ja-JP".to_string(),
            language_code: "ja".to_string(),
            country_code: "JP".to_string(),
            name: "Japanese (Japan)".to_string(),
            date_format: "%Y/%m/%d".to_string(),
            time_format: "%H:%M".to_string(),
            number_format: NumberFormat {
                decimal_separator: ".".to_string(),
                thousands_separator: ",".to_string(),
                grouping: vec![3],
                precision: 2,
            },
            currency_format: CurrencyFormat {
                symbol: "¥".to_string(),
                position: CurrencyPosition::Before,
                decimal_places: 0,
                symbol_spacing: false,
            },
        },
    ]
}

/// Get default timezones
pub fn get_default_timezones() -> Vec<TimezoneInfo> {
    vec![
        TimezoneInfo {
            code: "UTC".to_string(),
            name: "Coordinated Universal Time".to_string(),
            offset_seconds: 0,
            is_dst: false,
            dst_offset_seconds: None,
        },
        TimezoneInfo {
            code: "America/New_York".to_string(),
            name: "Eastern Time".to_string(),
            offset_seconds: -18000, // EST
            is_dst: false,
            dst_offset_seconds: Some(-14400), // EDT
        },
        TimezoneInfo {
            code: "America/Chicago".to_string(),
            name: "Central Time".to_string(),
            offset_seconds: -21600, // CST
            is_dst: false,
            dst_offset_seconds: Some(-18000), // CDT
        },
        TimezoneInfo {
            code: "America/Denver".to_string(),
            name: "Mountain Time".to_string(),
            offset_seconds: -25200, // MST
            is_dst: false,
            dst_offset_seconds: Some(-21600), // MDT
        },
        TimezoneInfo {
            code: "America/Los_Angeles".to_string(),
            name: "Pacific Time".to_string(),
            offset_seconds: -28800, // PST
            is_dst: false,
            dst_offset_seconds: Some(-25200), // PDT
        },
        TimezoneInfo {
            code: "Europe/London".to_string(),
            name: "Greenwich Mean Time".to_string(),
            offset_seconds: 0, // GMT
            is_dst: false,
            dst_offset_seconds: Some(3600), // BST
        },
        TimezoneInfo {
            code: "Europe/Paris".to_string(),
            name: "Central European Time".to_string(),
            offset_seconds: 3600, // CET
            is_dst: false,
            dst_offset_seconds: Some(7200), // CEST
        },
        TimezoneInfo {
            code: "Europe/Berlin".to_string(),
            name: "Central European Time".to_string(),
            offset_seconds: 3600, // CET
            is_dst: false,
            dst_offset_seconds: Some(7200), // CEST
        },
        TimezoneInfo {
            code: "Asia/Tokyo".to_string(),
            name: "Japan Standard Time".to_string(),
            offset_seconds: 32400, // JST
            is_dst: false,
            dst_offset_seconds: None,
        },
        TimezoneInfo {
            code: "Asia/Shanghai".to_string(),
            name: "China Standard Time".to_string(),
            offset_seconds: 28800, // CST
            is_dst: false,
            dst_offset_seconds: None,
        },
        TimezoneInfo {
            code: "Australia/Sydney".to_string(),
            name: "Australian Eastern Time".to_string(),
            offset_seconds: 36000, // AEST
            is_dst: false,
            dst_offset_seconds: Some(39600), // AEDT
        },
    ]
}

/// Get default translations
pub fn get_default_translations() -> Vec<Translation> {
    let now = Utc::now();
    vec![
        Translation {
            key: "welcome".to_string(),
            language_code: "en".to_string(),
            value: "Welcome".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "login".to_string(),
            language_code: "en".to_string(),
            value: "Login".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "logout".to_string(),
            language_code: "en".to_string(),
            value: "Logout".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "dashboard".to_string(),
            language_code: "en".to_string(),
            value: "Dashboard".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "projects".to_string(),
            language_code: "en".to_string(),
            value: "Projects".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "welcome".to_string(),
            language_code: "es".to_string(),
            value: "Bienvenido".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "login".to_string(),
            language_code: "es".to_string(),
            value: "Iniciar sesión".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "logout".to_string(),
            language_code: "es".to_string(),
            value: "Cerrar sesión".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "dashboard".to_string(),
            language_code: "es".to_string(),
            value: "Panel de control".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
        Translation {
            key: "projects".to_string(),
            language_code: "es".to_string(),
            value: "Proyectos".to_string(),
            context: None,
            plural_forms: None,
            created_at: now,
            updated_at: now,
        },
    ]
}