//! User preferences service
//!
//! Handles user preferences and settings management.

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use diesel::prelude::*;
use diesel::{QueryDsl, ExpressionMethods, RunQueryDsl};
use diesel::upsert::excluded;
use chrono::Utc;
use std::sync::Arc;
use async_trait::async_trait;
use crate::services::user::PreferencesServiceTrait;

use crate::database::{Database, transaction::with_transaction};
use crate::errors::{AppError, AppResult};
use crate::models::UserPreference;
use crate::models::schema::user_preferences;

/// Preferences service for managing user preferences
pub struct PreferencesService {
    db: Arc<Database>,
}

/// User preferences structure
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserPreferences {
    pub theme: Option<String>,
    pub language: Option<String>,
    pub timezone: Option<String>,
    pub notifications_enabled: Option<bool>,
    pub email_notifications: Option<bool>,
}

/// User settings structure (comprehensive settings including security)
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserSettings {
    pub notifications: UserSettingsNotifications,
    pub preferences: UserSettingsPreferences,
    pub security: UserSettingsSecurity,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserSettingsNotifications {
    pub email: bool,
    pub push: bool,
    pub reconciliation_complete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserSettingsPreferences {
    pub theme: String,
    pub language: String,
    pub timezone: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserSettingsSecurity {
    pub two_factor_enabled: bool,
    pub session_timeout: i32,
}

impl PreferencesService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Internal: Get user preferences
    async fn get_preferences_impl(&self, user_id: Uuid) -> AppResult<UserPreferences> {
        let mut conn = self.db.get_connection()?;

        // Query all preferences for the user
        let user_prefs = user_preferences::table
            .filter(user_preferences::user_id.eq(user_id))
            .load::<UserPreference>(&mut conn)
            .map_err(AppError::Database)?;

        // Convert to UserPreferences struct
        let mut preferences = UserPreferences::default();

        for pref in user_prefs {
            match pref.preference_key.as_str() {
                "theme" => preferences.theme = pref.preference_value,
                "language" => preferences.language = pref.preference_value,
                "timezone" => preferences.timezone = pref.preference_value,
                "notifications_enabled" => {
                    if let Some(val) = pref.preference_value {
                        preferences.notifications_enabled = val.parse::<bool>().ok();
                    }
                }
                "email_notifications" => {
                    if let Some(val) = pref.preference_value {
                        preferences.email_notifications = val.parse::<bool>().ok();
                    }
                }
                _ => {} // Ignore unknown preferences
            }
        }

        Ok(preferences)
    }

    /// Internal: Update user preferences (atomic operation within transaction)
    async fn update_preferences_impl(
        &self,
        user_id: Uuid,
        preferences: UserPreferences,
    ) -> AppResult<UserPreferences> {
        // Convert boolean preferences to strings upfront
        let notifications_enabled_str = preferences.notifications_enabled.map(|b| b.to_string());
        let email_notifications_str = preferences.email_notifications.map(|b| b.to_string());
        
        // Use transaction to ensure all preference updates are atomic
        with_transaction(self.db.get_pool(), |tx| {
            // Define the preference mappings
            let pref_mappings = vec![
                ("theme", preferences.theme.as_ref()),
                ("language", preferences.language.as_ref()),
                ("timezone", preferences.timezone.as_ref()),
                ("notifications_enabled", notifications_enabled_str.as_ref()),
                ("email_notifications", email_notifications_str.as_ref()),
            ];

            // Update or insert each preference
            for (key, value) in pref_mappings {
                if let Some(val) = value {
                    // Use ON CONFLICT to upsert
                    let upsert_query = diesel::sql_query(
                        "INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at) \
                         VALUES ($1, $2, $3, $4) \
                         ON CONFLICT (user_id, preference_key) \
                         DO UPDATE SET preference_value = EXCLUDED.preference_value, \
                                       updated_at = EXCLUDED.updated_at"
                    )
                    .bind::<diesel::sql_types::Uuid, _>(user_id)
                    .bind::<diesel::sql_types::Varchar, _>(key)
                    .bind::<diesel::sql_types::Text, _>(val)
                    .bind::<diesel::sql_types::Timestamptz, _>(Utc::now());

                    upsert_query.execute(tx).map_err(AppError::Database)?;
                } else {
                    // If value is None, delete the preference
                    diesel::delete(
                        user_preferences::table
                            .filter(user_preferences::user_id.eq(user_id))
                            .filter(user_preferences::preference_key.eq(key))
                    )
                    .execute(tx)
                    .map_err(AppError::Database)?;
                }
            }

            Ok(())
        }).await?;

        // Return the updated preferences
        self.get_preferences_impl(user_id).await
    }

    /// Internal: Update a specific preference (atomic operation within transaction)
    async fn update_preference_impl(
        &self,
        user_id: Uuid,
        key: &str,
        value: &str,
    ) -> AppResult<()> {
        // Validate the key
        match key {
            "theme" | "language" | "timezone" | "notifications_enabled" | "email_notifications" => {}
            _ => return Err(AppError::Validation(format!("Invalid preference key: {}", key))),
        }

        // Use transaction for atomicity
        with_transaction(self.db.get_pool(), |tx| {
            // Upsert the specific preference
            let upsert_query = diesel::sql_query(
                "INSERT INTO user_preferences (user_id, preference_key, preference_value, updated_at) \
                 VALUES ($1, $2, $3, $4) \
                 ON CONFLICT (user_id, preference_key) \
                 DO UPDATE SET preference_value = EXCLUDED.preference_value, \
                               updated_at = EXCLUDED.updated_at"
            )
            .bind::<diesel::sql_types::Uuid, _>(user_id)
            .bind::<diesel::sql_types::Varchar, _>(key)
            .bind::<diesel::sql_types::Text, _>(value)
            .bind::<diesel::sql_types::Timestamptz, _>(Utc::now());

            upsert_query.execute(tx).map_err(AppError::Database)?;
            Ok(())
        }).await
    }
}

// Implement the trait for PreferencesService
#[async_trait]
impl PreferencesServiceTrait for PreferencesService {
    async fn get_preferences(&self, user_id: Uuid) -> AppResult<UserPreferences> {
        self.get_preferences_impl(user_id).await
    }

    async fn update_preferences(
        &self,
        user_id: Uuid,
        preferences: UserPreferences,
    ) -> AppResult<UserPreferences> {
        self.update_preferences_impl(user_id, preferences).await
    }

    async fn update_preference(
        &self,
        user_id: Uuid,
        key: &str,
        value: &str,
    ) -> AppResult<()> {
        self.update_preference_impl(user_id, key, value).await
    }

    async fn get_settings(&self, user_id: Uuid) -> AppResult<UserSettings> {
        let mut conn = self.db.get_connection()?;

        // Query all preferences for the user
        let user_prefs = user_preferences::table
            .filter(user_preferences::user_id.eq(user_id))
            .load::<UserPreference>(&mut conn)
            .map_err(AppError::Database)?;

        // Convert to UserSettings struct with defaults
        let mut settings = UserSettings::default();

        for pref in user_prefs {
            match pref.preference_key.as_str() {
                // Notifications
                "notifications.email" => {
                    if let Some(val) = pref.preference_value {
                        settings.notifications.email = val.parse::<bool>().unwrap_or(false);
                    }
                }
                "notifications.push" => {
                    if let Some(val) = pref.preference_value {
                        settings.notifications.push = val.parse::<bool>().unwrap_or(false);
                    }
                }
                "notifications.reconciliation_complete" => {
                    if let Some(val) = pref.preference_value {
                        settings.notifications.reconciliation_complete = val.parse::<bool>().unwrap_or(true);
                    }
                }
                // Preferences
                "preferences.theme" => {
                    settings.preferences.theme = pref.preference_value.unwrap_or_else(|| "light".to_string());
                }
                "preferences.language" => {
                    settings.preferences.language = pref.preference_value.unwrap_or_else(|| "en".to_string());
                }
                "preferences.timezone" => {
                    settings.preferences.timezone = pref.preference_value.unwrap_or_else(|| "UTC".to_string());
                }
                // Security
                "security.two_factor_enabled" => {
                    if let Some(val) = pref.preference_value {
                        settings.security.two_factor_enabled = val.parse::<bool>().unwrap_or(false);
                    }
                }
                "security.session_timeout" => {
                    if let Some(val) = pref.preference_value {
                        settings.security.session_timeout = val.parse::<i32>().unwrap_or(3600);
                    }
                }
                _ => {} // Ignore unknown preferences
            }
        }

        Ok(settings)
    }

    async fn update_settings(
        &self,
        user_id: Uuid,
        settings: UserSettings,
    ) -> AppResult<UserSettings> {
        let mut conn = self.db.get_connection()?;

        // Start transaction
        conn.transaction::<_, AppError, _>(|conn| {
            // Prepare preference updates
            let updates = vec![
                // Notifications
                ("notifications.email", Some(settings.notifications.email.to_string())),
                ("notifications.push", Some(settings.notifications.push.to_string())),
                ("notifications.reconciliation_complete", Some(settings.notifications.reconciliation_complete.to_string())),
                // Preferences
                ("preferences.theme", Some(settings.preferences.theme.clone())),
                ("preferences.language", Some(settings.preferences.language.clone())),
                ("preferences.timezone", Some(settings.preferences.timezone.clone())),
                // Security
                ("security.two_factor_enabled", Some(settings.security.two_factor_enabled.to_string())),
                ("security.session_timeout", Some(settings.security.session_timeout.to_string())),
            ];

            for (key, value) in updates {
                if let Some(val) = value {
                    // Upsert preference
                    diesel::insert_into(user_preferences::table)
                        .values((
                            user_preferences::user_id.eq(user_id),
                            user_preferences::preference_key.eq(key),
                            user_preferences::preference_value.eq(val),
                            user_preferences::updated_at.eq(diesel::dsl::now),
                        ))
                        .on_conflict((user_preferences::user_id, user_preferences::preference_key))
                        .do_update()
                        .set((
                            user_preferences::preference_value.eq(excluded(user_preferences::preference_value)),
                            user_preferences::updated_at.eq(diesel::dsl::now),
                        ))
                        .execute(conn)
                        .map_err(AppError::Database)?;
                }
            }

            Ok(())
        })?;

        // Return the updated settings
        self.get_settings(user_id).await
    }
}
