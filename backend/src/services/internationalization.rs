// backend/src/services/internationalization.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;
use log::info;

/// Supported language
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Language {
    pub code: String, // ISO 639-1 code (e.g., "en", "es", "fr")
    pub name: String, // Display name (e.g., "English", "Spanish", "French")
    pub native_name: String, // Native name (e.g., "English", "Español", "Français")
    pub is_rtl: bool, // Right-to-left language
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
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationRequest {
    pub text: String,
    pub source_language: String,
    pub target_language: String,
    pub context: Option<String>,
    pub domain: Option<String>,
}

/// Translation response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResponse {
    pub translated_text: String,
    pub confidence: f64,
    pub source_language: String,
    pub target_language: String,
    pub alternatives: Vec<String>,
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

/// Localization context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalizationContext {
    pub language: String,
    pub locale: String,
    pub timezone: String,
    pub currency: String,
    pub date_format: String,
    pub time_format: String,
}

/// Internationalization service
pub struct InternationalizationService {
    languages: Arc<RwLock<HashMap<String, Language>>>,
    locales: Arc<RwLock<HashMap<String, Locale>>>,
    translations: Arc<RwLock<HashMap<String, Translation>>>,
    timezones: Arc<RwLock<HashMap<String, TimezoneInfo>>>,
    translation_cache: Arc<RwLock<HashMap<String, String>>>,
}

impl InternationalizationService {
    pub async fn new() -> Self {
        let mut service = Self {
            languages: Arc::new(RwLock::new(HashMap::new())),
            locales: Arc::new(RwLock::new(HashMap::new())),
            translations: Arc::new(RwLock::new(HashMap::new())),
            timezones: Arc::new(RwLock::new(HashMap::new())),
            translation_cache: Arc::new(RwLock::new(HashMap::new())),
        };
        
        // Initialize with default languages and locales
        service.initialize_default_languages().await;
        service.initialize_default_locales().await;
        service.initialize_default_timezones().await;
        service.initialize_default_translations().await;
        
        service
    }

    /// Initialize default languages
    async fn initialize_default_languages(&mut self) {
        let languages = vec![
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
        ];

        for language in languages {
            self.languages.write().await.insert(language.code.clone(), language);
        }
    }

    /// Initialize default locales
    async fn initialize_default_locales(&mut self) {
        let locales = vec![
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
                name: "Español (España)".to_string(),
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
                name: "Français (France)".to_string(),
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
        ];

        for locale in locales {
            self.locales.write().await.insert(locale.code.clone(), locale);
        }
    }

    /// Initialize default timezones
    async fn initialize_default_timezones(&mut self) {
        let timezones = vec![
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
                code: "Asia/Tokyo".to_string(),
                name: "Japan Standard Time".to_string(),
                offset_seconds: 32400,
                is_dst: false,
                dst_offset_seconds: None,
            },
            TimezoneInfo {
                code: "Asia/Shanghai".to_string(),
                name: "China Standard Time".to_string(),
                offset_seconds: 28800,
                is_dst: false,
                dst_offset_seconds: None,
            },
        ];

        for timezone in timezones {
            self.timezones.write().await.insert(timezone.code.clone(), timezone);
        }
    }

    /// Initialize default translations
    async fn initialize_default_translations(&mut self) {
        let translations = vec![
            // English translations
            Translation {
                key: "welcome".to_string(),
                language_code: "en".to_string(),
                value: "Welcome".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "login".to_string(),
                language_code: "en".to_string(),
                value: "Login".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "logout".to_string(),
                language_code: "en".to_string(),
                value: "Logout".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "dashboard".to_string(),
                language_code: "en".to_string(),
                value: "Dashboard".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "projects".to_string(),
                language_code: "en".to_string(),
                value: "Projects".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "reconciliation".to_string(),
                language_code: "en".to_string(),
                value: "Reconciliation".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "analytics".to_string(),
                language_code: "en".to_string(),
                value: "Analytics".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "settings".to_string(),
                language_code: "en".to_string(),
                value: "Settings".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "profile".to_string(),
                language_code: "en".to_string(),
                value: "Profile".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "help".to_string(),
                language_code: "en".to_string(),
                value: "Help".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            // Spanish translations
            Translation {
                key: "welcome".to_string(),
                language_code: "es".to_string(),
                value: "Bienvenido".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "login".to_string(),
                language_code: "es".to_string(),
                value: "Iniciar sesión".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "logout".to_string(),
                language_code: "es".to_string(),
                value: "Cerrar sesión".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "dashboard".to_string(),
                language_code: "es".to_string(),
                value: "Panel de control".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "projects".to_string(),
                language_code: "es".to_string(),
                value: "Proyectos".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "reconciliation".to_string(),
                language_code: "es".to_string(),
                value: "Reconciliación".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "analytics".to_string(),
                language_code: "es".to_string(),
                value: "Análisis".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "settings".to_string(),
                language_code: "es".to_string(),
                value: "Configuración".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "profile".to_string(),
                language_code: "es".to_string(),
                value: "Perfil".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Translation {
                key: "help".to_string(),
                language_code: "es".to_string(),
                value: "Ayuda".to_string(),
                context: None,
                plural_forms: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        ];

        for translation in translations {
            let key = format!("{}:{}", translation.language_code, translation.key);
            self.translations.write().await.insert(key, translation);
        }
    }

    /// Add language
    pub async fn add_language(&self, language: Language) -> AppResult<()> {
        self.languages.write().await.insert(language.code.clone(), language);
        Ok(())
    }

    /// Get language
    pub async fn get_language(&self, code: &str) -> AppResult<Option<Language>> {
        let languages = self.languages.read().await;
        Ok(languages.get(code).cloned())
    }

    /// List languages
    pub async fn list_languages(&self) -> AppResult<Vec<Language>> {
        let languages = self.languages.read().await;
        Ok(languages.values().cloned().collect())
    }

    /// Add locale
    pub async fn add_locale(&self, locale: Locale) -> AppResult<()> {
        self.locales.write().await.insert(locale.code.clone(), locale);
        Ok(())
    }

    /// Get locale
    pub async fn get_locale(&self, code: &str) -> AppResult<Option<Locale>> {
        let locales = self.locales.read().await;
        Ok(locales.get(code).cloned())
    }

    /// List locales
    pub async fn list_locales(&self) -> AppResult<Vec<Locale>> {
        let locales = self.locales.read().await;
        Ok(locales.values().cloned().collect())
    }

    /// Add translation
    pub async fn add_translation(&self, translation: Translation) -> AppResult<()> {
        let key = format!("{}:{}", translation.language_code, translation.key);
        self.translations.write().await.insert(key, translation);
        Ok(())
    }

    /// Get translation
    pub async fn get_translation(&self, key: &str, language_code: &str) -> AppResult<Option<String>> {
        let cache_key = format!("{}:{}", language_code, key);
        
        // Check cache first
        {
            let cache = self.translation_cache.read().await;
            if let Some(cached_value) = cache.get(&cache_key) {
                return Ok(Some(cached_value.clone()));
            }
        }

        // Check translations
        let translation_key = format!("{}:{}", language_code, key);
        let translations = self.translations.read().await;
        
        if let Some(translation) = translations.get(&translation_key) {
            // Cache the result
            self.translation_cache.write().await.insert(cache_key, translation.value.clone());
            Ok(Some(translation.value.clone()))
        } else {
            // Fallback to default language (English)
            if language_code != "en" {
                let fallback_key = format!("en:{}", key);
                if let Some(fallback_translation) = translations.get(&fallback_key) {
                    Ok(Some(fallback_translation.value.clone()))
                } else {
                    Ok(None)
                }
            } else {
                Ok(None)
            }
        }
    }

    /// Translate text
    pub async fn translate_text(&self, request: TranslationRequest) -> AppResult<TranslationResponse> {
        // In a real implementation, this would use a translation service like Google Translate, DeepL, etc.
        // For now, we'll simulate this with a simple lookup
        
        let cache_key = format!("{}:{}:{}", request.source_language, request.target_language, request.text);
        
        // Check cache first
        {
            let cache = self.translation_cache.read().await;
            if let Some(cached_translation) = cache.get(&cache_key) {
                return Ok(TranslationResponse {
                    translated_text: cached_translation.clone(),
                    confidence: 0.9,
                    source_language: request.source_language.clone(),
                    target_language: request.target_language.clone(),
                    alternatives: vec![],
                });
            }
        }

        // Simulate translation (in real implementation, call external service)
        let translated_text = match request.target_language.as_str() {
            "es" => match request.text.as_str() {
                "Welcome" => "Bienvenido".to_string(),
                "Login" => "Iniciar sesión".to_string(),
                "Logout" => "Cerrar sesión".to_string(),
                "Dashboard" => "Panel de control".to_string(),
                "Projects" => "Proyectos".to_string(),
                "Reconciliation" => "Reconciliación".to_string(),
                "Analytics" => "Análisis".to_string(),
                "Settings" => "Configuración".to_string(),
                "Profile" => "Perfil".to_string(),
                "Help" => "Ayuda".to_string(),
                _ => request.text.clone(), // Fallback to original text
            },
            "fr" => match request.text.as_str() {
                "Welcome" => "Bienvenue".to_string(),
                "Login" => "Se connecter".to_string(),
                "Logout" => "Se déconnecter".to_string(),
                "Dashboard" => "Tableau de bord".to_string(),
                "Projects" => "Projets".to_string(),
                "Reconciliation" => "Réconciliation".to_string(),
                "Analytics" => "Analyses".to_string(),
                "Settings" => "Paramètres".to_string(),
                "Profile" => "Profil".to_string(),
                "Help" => "Aide".to_string(),
                _ => request.text.clone(),
            },
            _ => request.text.clone(),
        };

        // Cache the result
        self.translation_cache.write().await.insert(cache_key, translated_text.clone());

        Ok(TranslationResponse {
            translated_text,
            confidence: 0.8,
            source_language: request.source_language,
            target_language: request.target_language,
            alternatives: vec![],
        })
    }

    /// Format date according to locale
    pub async fn format_date(&self, date: DateTime<Utc>, locale_code: &str) -> AppResult<String> {
        let locales = self.locales.read().await;
        if let Some(locale) = locales.get(locale_code) {
            // Convert UTC to local timezone
            let local_date = date.with_timezone(&chrono::Utc);
            Ok(local_date.format(&locale.date_format).to_string())
        } else {
            // Fallback to default format
            Ok(date.format("%Y-%m-%d").to_string())
        }
    }

    /// Format time according to locale
    pub async fn format_time(&self, time: DateTime<Utc>, locale_code: &str) -> AppResult<String> {
        let locales = self.locales.read().await;
        if let Some(locale) = locales.get(locale_code) {
            let local_time = time.with_timezone(&chrono::Utc);
            Ok(local_time.format(&locale.time_format).to_string())
        } else {
            // Fallback to default format
            Ok(time.format("%H:%M:%S").to_string())
        }
    }

    /// Format number according to locale
    pub async fn format_number(&self, number: f64, locale_code: &str) -> AppResult<String> {
        let locales = self.locales.read().await;
        if let Some(locale) = locales.get(locale_code) {
            let formatted = format!("{:.2}", number);
            let parts: Vec<&str> = formatted.split('.').collect();
            let integer_part = parts[0];
            let decimal_part = parts.get(1).unwrap_or(&"00");

            // Add thousands separators
            let mut result = String::new();
            let chars: Vec<char> = integer_part.chars().collect();
            let mut count = 0;

            for &ch in chars.iter().rev() {
                if count > 0 && count % 3 == 0 {
                    result.insert(0, locale.number_format.thousands_separator.chars().next().unwrap_or(','));
                }
                result.insert(0, ch);
                count += 1;
            }

            result.push_str(&locale.number_format.decimal_separator);
            result.push_str(decimal_part);

            Ok(result)
        } else {
            // Fallback to default format
            Ok(format!("{:.2}", number))
        }
    }

    /// Format currency according to locale
    pub async fn format_currency(&self, amount: f64, locale_code: &str) -> AppResult<String> {
        let locales = self.locales.read().await;
        if let Some(locale) = locales.get(locale_code) {
            let formatted_number = self.format_number(amount, locale_code).await?;
            
            match locale.currency_format.position {
                CurrencyPosition::Before => {
                    if locale.currency_format.symbol_spacing {
                        Ok(format!("{} {}", locale.currency_format.symbol, formatted_number))
                    } else {
                        Ok(format!("{}{}", locale.currency_format.symbol, formatted_number))
                    }
                }
                CurrencyPosition::After => {
                    if locale.currency_format.symbol_spacing {
                        Ok(format!("{} {}", formatted_number, locale.currency_format.symbol))
                    } else {
                        Ok(format!("{}{}", formatted_number, locale.currency_format.symbol))
                    }
                }
            }
        } else {
            // Fallback to default format
            Ok(format!("${:.2}", amount))
        }
    }

    /// Convert timezone
    pub async fn convert_timezone(&self, datetime: DateTime<Utc>, from_tz: &str, to_tz: &str) -> AppResult<DateTime<Utc>> {
        // In a real implementation, this would use chrono-tz
        // For now, we'll simulate this
        
        let timezones = self.timezones.read().await;
        let from_timezone = timezones.get(from_tz);
        let to_timezone = timezones.get(to_tz);

        if let (Some(from), Some(to)) = (from_timezone, to_timezone) {
            let offset_diff = to.offset_seconds - from.offset_seconds;
            Ok(datetime + chrono::Duration::seconds(offset_diff as i64))
        } else {
            Err(AppError::Validation(format!("Invalid timezone: {} or {}", from_tz, to_tz)))
        }
    }

    /// Get timezone information
    pub async fn get_timezone_info(&self, timezone_code: &str) -> AppResult<Option<TimezoneInfo>> {
        let timezones = self.timezones.read().await;
        Ok(timezones.get(timezone_code).cloned())
    }

    /// List timezones
    pub async fn list_timezones(&self) -> AppResult<Vec<TimezoneInfo>> {
        let timezones = self.timezones.read().await;
        Ok(timezones.values().cloned().collect())
    }

    /// Detect language from text
    pub async fn detect_language(&self, text: &str) -> AppResult<String> {
        // In a real implementation, this would use a language detection library
        // For now, we'll use simple heuristics
        
        let text_lower = text.to_lowercase();
        
        // Check for common English words
        let english_words = ["the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
        let english_count = english_words.iter().filter(|word| text_lower.contains(*word)).count();
        
        // Check for common Spanish words
        let spanish_words = ["el", "la", "de", "que", "y", "a", "en", "un", "es", "se", "no", "te", "lo", "le", "da", "su", "por", "son", "con", "para"];
        let spanish_count = spanish_words.iter().filter(|word| text_lower.contains(*word)).count();
        
        // Check for common French words
        let french_words = ["le", "la", "de", "et", "à", "un", "il", "que", "ne", "se", "ce", "pas", "dans", "du", "pour", "par", "sur", "avec", "une", "être"];
        let french_count = french_words.iter().filter(|word| text_lower.contains(*word)).count();
        
        if english_count > spanish_count && english_count > french_count {
            Ok("en".to_string())
        } else if spanish_count > french_count {
            Ok("es".to_string())
        } else if french_count > 0 {
            Ok("fr".to_string())
        } else {
            Ok("en".to_string()) // Default to English
        }
    }

    /// Get localization context for user
    pub async fn get_localization_context(&self, user_id: Uuid) -> AppResult<LocalizationContext> {
        // In a real implementation, this would get user preferences from database
        // For now, we'll return default context
        
        Ok(LocalizationContext {
            language: "en".to_string(),
            locale: "en-US".to_string(),
            timezone: "UTC".to_string(),
            currency: "USD".to_string(),
            date_format: "%m/%d/%Y".to_string(),
            time_format: "%I:%M %p".to_string(),
        })
    }

    /// Update user localization preferences
    pub async fn update_user_localization(&self, user_id: Uuid, context: LocalizationContext) -> AppResult<()> {
        // In a real implementation, this would update user preferences in database
        // For now, we'll just log the update
        info!("Updated localization context for user {}: {:?}", user_id, context);
        Ok(())
    }

    /// Clear translation cache
    pub async fn clear_translation_cache(&self) -> AppResult<()> {
        self.translation_cache.write().await.clear();
        Ok(())
    }

    /// Get translation statistics
    pub async fn get_translation_stats(&self) -> AppResult<TranslationStats> {
        let translations = self.translations.read().await;
        let cache = self.translation_cache.read().await;
        
        let mut stats = TranslationStats::default();
        stats.total_translations = translations.len() as u32;
        stats.cached_translations = cache.len() as u32;
        
        // Count translations by language
        for translation in translations.values() {
            *stats.translations_by_language.entry(translation.language_code.clone()).or_insert(0) += 1;
        }
        
        Ok(stats)
    }
}

/// Translation statistics
#[derive(Debug, Clone, Default)]
pub struct TranslationStats {
    pub total_translations: u32,
    pub cached_translations: u32,
    pub translations_by_language: HashMap<String, u32>,
}

impl Default for InternationalizationService {
    fn default() -> Self {
        // Create a synchronous version for Default
        Self {
            languages: Arc::new(RwLock::new(HashMap::new())),
            locales: Arc::new(RwLock::new(HashMap::new())),
            timezones: Arc::new(RwLock::new(HashMap::new())),
            translations: Arc::new(RwLock::new(HashMap::new())),
            translation_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_internationalization_service() {
        let service = InternationalizationService::new().await;
        
        // Test getting language
        let language = service.get_language("en").await.unwrap();
        assert!(language.is_some());
        assert_eq!(language.unwrap().code, "en");
        
        // Test listing languages
        let languages = service.list_languages().await.unwrap();
        assert!(!languages.is_empty());
        
        // Test getting locale
        let locale = service.get_locale("en-US").await.unwrap();
        assert!(locale.is_some());
        assert_eq!(locale.unwrap().code, "en-US");
        
        // Test getting translation
        let translation = service.get_translation("welcome", "en").await.unwrap();
        assert_eq!(translation, Some("Welcome".to_string()));
        
        // Test translation fallback
        let translation = service.get_translation("welcome", "es").await.unwrap();
        assert_eq!(translation, Some("Bienvenido".to_string()));
        
        // Test text translation
        let request = TranslationRequest {
            text: "Welcome".to_string(),
            source_language: "en".to_string(),
            target_language: "es".to_string(),
            context: None,
            domain: None,
        };
        
        let response = service.translate_text(request).await.unwrap();
        assert_eq!(response.translated_text, "Bienvenido");
        
        // Test date formatting
        let date = Utc::now();
        let formatted_date = service.format_date(date, "en-US").await.unwrap();
        assert!(!formatted_date.is_empty());
        
        // Test number formatting
        let formatted_number = service.format_number(1234.56, "en-US").await.unwrap();
        assert!(formatted_number.contains("1,234"));
        
        // Test currency formatting
        let formatted_currency = service.format_currency(1234.56, "en-US").await.unwrap();
        assert!(formatted_currency.contains("$"));
        
        // Test language detection
        let detected_language = service.detect_language("Hello world").await.unwrap();
        assert_eq!(detected_language, "en");
        
        // Test timezone conversion
        let datetime = Utc::now();
        let converted = service.convert_timezone(datetime, "UTC", "America/New_York").await.unwrap();
        assert!(converted != datetime);
    }

    #[tokio::test]
    async fn test_translation_management() {
        let service = InternationalizationService::new().await;
        
        // Test adding translation
        let translation = Translation {
            key: "test_key".to_string(),
            language_code: "en".to_string(),
            value: "Test Value".to_string(),
            context: None,
            plural_forms: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        service.add_translation(translation).await.unwrap();
        
        // Test getting added translation
        let retrieved = service.get_translation("test_key", "en").await.unwrap();
        assert_eq!(retrieved, Some("Test Value".to_string()));
        
        // Test clearing cache
        service.clear_translation_cache().await.unwrap();
        
        // Test getting translation stats
        let stats = service.get_translation_stats().await.unwrap();
        assert!(stats.total_translations > 0);
    }

    #[tokio::test]
    async fn test_locale_formatting() {
        let service = InternationalizationService::new().await;
        
        // Test different locale formatting
        let number = 1234.56;
        
        let us_format = service.format_number(number, "en-US").await.unwrap();
        assert!(us_format.contains("1,234"));
        
        let es_format = service.format_number(number, "es-ES").await.unwrap();
        assert!(es_format.contains("1.234"));
        
        let us_currency = service.format_currency(number, "en-US").await.unwrap();
        assert!(us_currency.contains("$"));
        
        let es_currency = service.format_currency(number, "es-ES").await.unwrap();
        assert!(es_currency.contains("€"));
    }
}
