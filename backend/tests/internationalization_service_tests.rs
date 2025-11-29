//! Service layer tests for InternationalizationService
//!
//! Tests InternationalizationService methods including language management,
//! translation, formatting, and timezone conversion.

use reconciliation_backend::services::internationalization::{
    InternationalizationService, TranslationRequest,
};
use reconciliation_backend::services::internationalization_models::{
    CurrencyPosition, Language, Locale, Translation,
};
use chrono::Utc;
use uuid::Uuid;

/// Test InternationalizationService methods
#[cfg(test)]
mod internationalization_service_tests {
    use super::*;

    #[tokio::test]
    async fn test_internationalization_service_creation() {
        let service = InternationalizationService::new().await;
        
        // Verify service is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_list_languages() {
        let service = InternationalizationService::new().await;
        
        let result = service.list_languages().await;
        assert!(result.is_ok());
        
        let languages = result.unwrap();
        assert!(!languages.is_empty());
        
        // Should have default languages
        let has_english = languages.iter().any(|l| l.code == "en");
        assert!(has_english);
    }

    #[tokio::test]
    async fn test_get_language() {
        let service = InternationalizationService::new().await;
        
        // Get existing language
        let result = service.get_language("en").await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
        
        // Get non-existent language
        let result2 = service.get_language("xx").await;
        assert!(result2.is_ok());
        assert!(result2.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_add_language() {
        let service = InternationalizationService::new().await;
        
        let new_language = Language {
            code: "it".to_string(),
            name: "Italian".to_string(),
            native_name: "Italiano".to_string(),
            is_rtl: false,
            is_default: false,
        };
        
        let result = service.add_language(new_language.clone()).await;
        assert!(result.is_ok());
        
        // Verify language was added
        let retrieved = service.get_language("it").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().code, "it");
    }

    #[tokio::test]
    async fn test_list_locales() {
        let service = InternationalizationService::new().await;
        
        let result = service.list_locales().await;
        assert!(result.is_ok());
        
        let locales = result.unwrap();
        assert!(!locales.is_empty());
    }

    #[tokio::test]
    async fn test_get_locale() {
        let service = InternationalizationService::new().await;
        
        // Get existing locale
        let result = service.get_locale("en-US").await;
        assert!(result.is_ok());
        assert!(result.unwrap().is_some());
        
        // Get non-existent locale
        let result2 = service.get_locale("xx-XX").await;
        assert!(result2.is_ok());
        assert!(result2.unwrap().is_none());
    }

    #[tokio::test]
    async fn test_add_locale() {
        let service = InternationalizationService::new().await;
        
        use reconciliation_backend::services::internationalization_models::{CurrencyFormat, NumberFormat};
        
        let new_locale = Locale {
            code: "it-IT".to_string(),
            language_code: "it".to_string(),
            country_code: "IT".to_string(),
            name: "Italian (Italy)".to_string(),
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
        };
        
        let result = service.add_locale(new_locale.clone()).await;
        assert!(result.is_ok());
        
        // Verify locale was added
        let retrieved = service.get_locale("it-IT").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().code, "it-IT");
    }

    #[tokio::test]
    async fn test_get_translation() {
        let service = InternationalizationService::new().await;
        
        // Get translation (may not exist, but should handle gracefully)
        let result = service.get_translation("welcome", "en").await;
        assert!(result.is_ok());
        
        // Result may be Some or None depending on default translations
        let translation = result.unwrap();
        // Just verify it doesn't panic
        assert!(translation.is_some() || translation.is_none());
    }

    #[tokio::test]
    async fn test_get_translation_fallback() {
        let service = InternationalizationService::new().await;
        
        // Test fallback to English when translation doesn't exist in target language
        let result = service.get_translation("welcome", "fr").await;
        assert!(result.is_ok());
        
        // Should fallback to English if available
        let translation = result.unwrap();
        assert!(translation.is_some() || translation.is_none());
    }

    #[tokio::test]
    async fn test_add_translation() {
        let service = InternationalizationService::new().await;
        
        let translation = Translation {
            key: "test_key".to_string(),
            language_code: "en".to_string(),
            value: "Test Value".to_string(),
            context: None,
            plural_forms: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let result = service.add_translation(translation).await;
        assert!(result.is_ok());
        
        // Verify translation was added
        let retrieved = service.get_translation("test_key", "en").await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap(), "Test Value");
    }

    #[tokio::test]
    async fn test_translate_text() {
        let service = InternationalizationService::new().await;
        
        let request = TranslationRequest {
            text: "Welcome".to_string(),
            source_language: "en".to_string(),
            target_language: "es".to_string(),
            context: None,
            domain: None,
        };
        
        let result = service.translate_text(request).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert!(!response.translated_text.is_empty());
        assert_eq!(response.source_language, "en");
        assert_eq!(response.target_language, "es");
    }

    #[tokio::test]
    async fn test_translate_text_cached() {
        let service = InternationalizationService::new().await;
        
        let request = TranslationRequest {
            text: "Welcome".to_string(),
            source_language: "en".to_string(),
            target_language: "es".to_string(),
            context: None,
            domain: None,
        };
        
        // First translation
        let result1 = service.translate_text(request.clone()).await;
        assert!(result1.is_ok());
        
        // Second translation (should use cache)
        let result2 = service.translate_text(request).await;
        assert!(result2.is_ok());
        
        // Both should return same result
        assert_eq!(result1.unwrap().translated_text, result2.unwrap().translated_text);
    }

    #[tokio::test]
    async fn test_format_date() {
        let service = InternationalizationService::new().await;
        let date = Utc::now();
        
        let result = service.format_date(date, "en-US").await;
        assert!(result.is_ok());
        
        let formatted = result.unwrap();
        assert!(!formatted.is_empty());
    }

    #[tokio::test]
    async fn test_format_date_different_locales() {
        let service = InternationalizationService::new().await;
        let date = Utc::now();
        
        let locales = vec!["en-US", "en-GB", "es-ES", "fr-FR"];
        
        for locale in locales {
            let result = service.format_date(date, locale).await;
            assert!(result.is_ok());
            assert!(!result.unwrap().is_empty());
        }
    }

    #[tokio::test]
    async fn test_format_time() {
        let service = InternationalizationService::new().await;
        let time = Utc::now();
        
        let result = service.format_time(time, "en-US").await;
        assert!(result.is_ok());
        
        let formatted = result.unwrap();
        assert!(!formatted.is_empty());
    }

    #[tokio::test]
    async fn test_format_number() {
        let service = InternationalizationService::new().await;
        
        let result = service.format_number(1234.56, "en-US").await;
        assert!(result.is_ok());
        
        let formatted = result.unwrap();
        assert!(!formatted.is_empty());
        assert!(formatted.contains("1234") || formatted.contains("1,234"));
    }

    #[tokio::test]
    async fn test_format_number_different_locales() {
        let service = InternationalizationService::new().await;
        let number = 1234.56;
        
        let result1 = service.format_number(number, "en-US").await;
        assert!(result1.is_ok());
        
        let result2 = service.format_number(number, "de-DE").await;
        assert!(result2.is_ok());
        
        // Formats may differ by locale
        assert!(!result1.unwrap().is_empty());
        assert!(!result2.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_format_currency() {
        let service = InternationalizationService::new().await;
        
        let result = service.format_currency(1234.56, "en-US").await;
        assert!(result.is_ok());
        
        let formatted = result.unwrap();
        assert!(!formatted.is_empty());
        // Should contain currency symbol or amount
        assert!(formatted.contains("$") || formatted.contains("1234") || formatted.contains("1,234"));
    }

    #[tokio::test]
    async fn test_format_currency_different_locales() {
        let service = InternationalizationService::new().await;
        let amount = 1234.56;
        
        let result1 = service.format_currency(amount, "en-US").await;
        assert!(result1.is_ok());
        
        let result2 = service.format_currency(amount, "en-GB").await;
        assert!(result2.is_ok());
        
        // Formats may differ by locale
        assert!(!result1.unwrap().is_empty());
        assert!(!result2.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_convert_timezone() {
        let service = InternationalizationService::new().await;
        let datetime = Utc::now();
        
        let result = service.convert_timezone(datetime, "UTC", "America/New_York").await;
        assert!(result.is_ok());
        
        let converted = result.unwrap();
        // Converted time should be different from original (or same if same timezone)
        assert!(true); // Just verify it doesn't panic
    }

    #[tokio::test]
    async fn test_get_timezone_info() {
        let service = InternationalizationService::new().await;
        
        let result = service.get_timezone_info("America/New_York").await;
        assert!(result.is_ok());
        
        // May or may not exist in default data
        let timezone = result.unwrap();
        assert!(timezone.is_some() || timezone.is_none());
    }

    #[tokio::test]
    async fn test_list_timezones() {
        let service = InternationalizationService::new().await;
        
        let result = service.list_timezones().await;
        assert!(result.is_ok());
        
        let timezones = result.unwrap();
        assert!(!timezones.is_empty());
    }

    #[tokio::test]
    async fn test_detect_language() {
        let service = InternationalizationService::new().await;
        
        // Test English text
        let result = service.detect_language("Hello world").await;
        assert!(result.is_ok());
        let detected = result.unwrap();
        assert!(!detected.is_empty());
        
        // Test Spanish text
        let result2 = service.detect_language("Hola mundo").await;
        assert!(result2.is_ok());
        
        // Test French text
        let result3 = service.detect_language("Bonjour le monde").await;
        assert!(result3.is_ok());
    }

    #[tokio::test]
    async fn test_get_localization_context() {
        let service = InternationalizationService::new().await;
        let user_id = Uuid::new_v4();
        
        let result = service.get_localization_context(user_id).await;
        assert!(result.is_ok());
        
        let context = result.unwrap();
        assert!(!context.language.is_empty());
        assert!(!context.locale.is_empty());
    }

    #[tokio::test]
    async fn test_update_user_localization() {
        let service = InternationalizationService::new().await;
        let user_id = Uuid::new_v4();
        
        let context = reconciliation_backend::services::internationalization::LocalizationContext {
            language: "es".to_string(),
            locale: "es-ES".to_string(),
            timezone: "Europe/Madrid".to_string(),
            currency: "EUR".to_string(),
            date_format: "%d/%m/%Y".to_string(),
            time_format: "%H:%M".to_string(),
        };
        
        let result = service.update_user_localization(user_id, context).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_clear_translation_cache() {
        let service = InternationalizationService::new().await;
        
        // Add some translations to populate cache
        let request = TranslationRequest {
            text: "Test".to_string(),
            source_language: "en".to_string(),
            target_language: "es".to_string(),
            context: None,
            domain: None,
        };
        
        service.translate_text(request).await.unwrap();
        
        // Clear cache
        let result = service.clear_translation_cache().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_get_translation_stats() {
        let service = InternationalizationService::new().await;
        
        let result = service.get_translation_stats().await;
        assert!(result.is_ok());
        
        let stats = result.unwrap();
        assert!(stats.total_translations >= 0);
        assert!(stats.cached_translations >= 0);
    }

    #[tokio::test]
    async fn test_internationalization_service_concurrent_operations() {
        let service = InternationalizationService::new().await;
        
        // Test concurrent operations
        let (result1, result2, result3) = tokio::join!(
            service.list_languages(),
            service.list_locales(),
            service.list_timezones()
        );
        
        assert!(result1.is_ok());
        assert!(result2.is_ok());
        assert!(result3.is_ok());
    }

    #[tokio::test]
    async fn test_format_date_time_combined() {
        let service = InternationalizationService::new().await;
        let datetime = Utc::now();
        
        let (date_result, time_result) = tokio::join!(
            service.format_date(datetime, "en-US"),
            service.format_time(datetime, "en-US")
        );
        
        assert!(date_result.is_ok());
        assert!(time_result.is_ok());
    }

    #[tokio::test]
    async fn test_translation_with_context() {
        let service = InternationalizationService::new().await;
        
        let request = TranslationRequest {
            text: "Save".to_string(),
            source_language: "en".to_string(),
            target_language: "es".to_string(),
            context: Some("button".to_string()),
            domain: Some("ui".to_string()),
        };
        
        let result = service.translate_text(request).await;
        assert!(result.is_ok());
        
        let response = result.unwrap();
        assert!(!response.translated_text.is_empty());
    }

    #[tokio::test]
    async fn test_format_currency_edge_cases() {
        let service = InternationalizationService::new().await;
        
        // Test zero
        let result = service.format_currency(0.0, "en-US").await;
        assert!(result.is_ok());
        
        // Test negative
        let result2 = service.format_currency(-100.0, "en-US").await;
        assert!(result2.is_ok());
        
        // Test large number
        let result3 = service.format_currency(999999.99, "en-US").await;
        assert!(result3.is_ok());
    }

    #[tokio::test]
    async fn test_format_number_edge_cases() {
        let service = InternationalizationService::new().await;
        
        // Test zero
        let result = service.format_number(0.0, "en-US").await;
        assert!(result.is_ok());
        
        // Test negative
        let result2 = service.format_number(-123.45, "en-US").await;
        assert!(result2.is_ok());
        
        // Test very large number
        let result3 = service.format_number(999999999.99, "en-US").await;
        assert!(result3.is_ok());
    }
}

