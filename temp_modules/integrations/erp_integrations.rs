use crate::utils::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use reqwest::Client;
use oauth2::{ClientId, ClientSecret, AuthUrl, TokenUrl, RedirectUrl, Scope};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::{AuthorizationCode, CsrfToken, PkceCodeChallenge, PkceCodeVerifier};
use oauth2::TokenResponse;

/// ERP system types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ERPType {
    SAP,
    Oracle,
    MicrosoftDynamics,
    NetSuite,
    Workday,
    Infor,
    Epicor,
    Sage,
}

/// ERP integration configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ERPConfig {
    pub id: Uuid,
    pub erp_type: ERPType,
    pub name: String,
    pub base_url: String,
    pub api_version: String,
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub redirect_url: String,
    pub scopes: Vec<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// ERP data mapping configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ERPDataMapping {
    pub id: Uuid,
    pub erp_config_id: Uuid,
    pub reconciliation_field: String,
    pub erp_field: String,
    pub field_type: String,
    pub transformation_rules: HashMap<String, serde_json::Value>,
    pub is_required: bool,
    pub created_at: DateTime<Utc>,
}

/// ERP transaction data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ERPTransaction {
    pub id: String,
    pub document_number: String,
    pub document_type: String,
    pub posting_date: chrono::NaiveDate,
    pub amount: f64,
    pub currency: String,
    pub description: String,
    pub account_code: String,
    pub cost_center: Option<String>,
    pub profit_center: Option<String>,
    pub reference: Option<String>,
    pub vendor_customer: Option<String>,
    pub additional_fields: HashMap<String, serde_json::Value>,
}

/// ERP integration manager
pub struct ERPIntegrationManager {
    configs: HashMap<Uuid, ERPConfig>,
    mappings: HashMap<Uuid, Vec<ERPDataMapping>>,
    clients: HashMap<Uuid, ERPClient>,
    http_client: Client,
}

/// ERP client for specific system
pub struct ERPClient {
    config: ERPConfig,
    oauth_client: BasicClient,
    access_token: Option<String>,
    token_expires_at: Option<DateTime<Utc>>,
}

impl ERPIntegrationManager {
    pub fn new() -> Self {
        Self {
            configs: HashMap::new(),
            mappings: HashMap::new(),
            clients: HashMap::new(),
            http_client: Client::new(),
        }
    }

    /// Add ERP configuration
    pub async fn add_erp_config(&mut self, config: ERPConfig) -> AppResult<()> {
        tracing::info!("Adding ERP configuration for {} ({:?})", config.name, config.erp_type);

        // Create OAuth client
        let oauth_client = BasicClient::new(
            ClientId::new(config.client_id.clone()),
            Some(ClientSecret::new(config.client_secret.clone())),
            AuthUrl::new(config.auth_url.clone())
                .map_err(|e| AppError::BadRequest(format!("Invalid auth URL: {}", e)))?,
            Some(TokenUrl::new(config.token_url.clone())
                .map_err(|e| AppError::BadRequest(format!("Invalid token URL: {}", e)))?),
        )
        .set_redirect_uri(RedirectUrl::new(config.redirect_url.clone())
            .map_err(|e| AppError::BadRequest(format!("Invalid redirect URL: {}", e)))?);

        let erp_client = ERPClient {
            config: config.clone(),
            oauth_client,
            access_token: None,
            token_expires_at: None,
        };

        self.configs.insert(config.id, config);
        self.clients.insert(config.id, erp_client);

        tracing::info!("ERP configuration added successfully");
        Ok(())
    }

    /// Authenticate with ERP system
    pub async fn authenticate(&mut self, erp_config_id: Uuid) -> AppResult<String> {
        let client = self.clients.get_mut(&erp_config_id)
            .ok_or_else(|| AppError::NotFound("ERP configuration not found".to_string()))?;

        tracing::info!("Authenticating with ERP system: {}", client.config.name);

        // Generate PKCE challenge
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        
        // Generate authorization URL
        let (auth_url, csrf_token) = client.oauth_client
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new("read".to_string()))
            .add_scope(Scope::new("write".to_string()))
            .set_pkce_challenge(pkce_challenge)
            .url();

        // In a real implementation, you would redirect the user to auth_url
        // and handle the callback with the authorization code
        // For now, we'll simulate the authentication process

        tracing::info!("Generated authorization URL: {}", auth_url);
        Ok(auth_url.to_string())
    }

    /// Exchange authorization code for access token
    pub async fn exchange_code_for_token(
        &mut self,
        erp_config_id: Uuid,
        auth_code: String,
        pkce_verifier: String,
    ) -> AppResult<()> {
        let client = self.clients.get_mut(&erp_config_id)
            .ok_or_else(|| AppError::NotFound("ERP configuration not found".to_string()))?;

        tracing::info!("Exchanging authorization code for access token");

        let token_result = client.oauth_client
            .exchange_code(AuthorizationCode::new(auth_code))
            .set_pkce_verifier(PkceCodeVerifier::new(pkce_verifier))
            .request_async(async_http_client)
            .await
            .map_err(|e| AppError::InternalServerError(format!("Token exchange failed: {}", e)))?;

        client.access_token = Some(token_result.access_token().secret().clone());
        
        // Calculate token expiration
        if let Some(expires_in) = token_result.expires_in() {
            client.token_expires_at = Some(Utc::now() + chrono::Duration::seconds(expires_in.as_secs() as i64));
        }

        tracing::info!("Access token obtained successfully");
        Ok(())
    }

    /// Fetch transactions from ERP system
    pub async fn fetch_transactions(
        &mut self,
        erp_config_id: Uuid,
        from_date: chrono::NaiveDate,
        to_date: chrono::NaiveDate,
        filters: HashMap<String, String>,
    ) -> AppResult<Vec<ERPTransaction>> {
        let client = self.clients.get_mut(&erp_config_id)
            .ok_or_else(|| AppError::NotFound("ERP configuration not found".to_string()))?;

        // Check if token is expired and refresh if needed
        if let Some(expires_at) = client.token_expires_at {
            if Utc::now() >= expires_at {
                self.refresh_token(erp_config_id).await?;
            }
        }

        let access_token = client.access_token.as_ref()
            .ok_or_else(|| AppError::Unauthorized("No access token available".to_string()))?;

        tracing::info!(
            "Fetching transactions from {} ERP system from {} to {}",
            client.config.name,
            from_date,
            to_date
        );

        // Build API URL based on ERP type
        let api_url = self.build_api_url(&client.config, "transactions")?;

        // Build query parameters
        let mut query_params = vec![
            ("from_date", from_date.to_string()),
            ("to_date", to_date.to_string()),
        ];

        for (key, value) in filters {
            query_params.push((key.as_str(), value));
        }

        // Make API request
        let response = self.http_client
            .get(&api_url)
            .bearer_auth(access_token)
            .query(&query_params)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("ERP API request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::InternalServerError(format!(
                "ERP API returned error: {}",
                response.status()
            )));
        }

        let transactions: Vec<ERPTransaction> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse ERP response: {}", e)))?;

        tracing::info!("Fetched {} transactions from ERP system", transactions.len());
        Ok(transactions)
    }

    /// Sync ERP data to reconciliation system
    pub async fn sync_erp_data(
        &mut self,
        erp_config_id: Uuid,
        project_id: Uuid,
        sync_config: ERPSyncConfig,
    ) -> AppResult<ERPSyncResult> {
        let start_time = std::time::Instant::now();

        tracing::info!("Starting ERP data sync for project {}", project_id);

        // Fetch transactions from ERP
        let transactions = self.fetch_transactions(
            erp_config_id,
            sync_config.from_date,
            sync_config.to_date,
            sync_config.filters,
        ).await?;

        // Transform ERP data to reconciliation format
        let reconciliation_records = self.transform_erp_data(
            erp_config_id,
            transactions,
            sync_config.mapping_config_id,
        ).await?;

        // Apply data quality checks
        let quality_report = self.validate_erp_data(&reconciliation_records).await?;

        // Store in reconciliation system
        let stored_count = self.store_reconciliation_records(
            project_id,
            reconciliation_records,
        ).await?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        let result = ERPSyncResult {
            erp_config_id,
            project_id,
            total_transactions: transactions.len() as u32,
            processed_records: stored_count,
            quality_score: quality_report.overall_score,
            processing_time_ms: processing_time,
            errors: quality_report.errors,
            warnings: quality_report.warnings,
            synced_at: Utc::now(),
        };

        tracing::info!(
            "ERP sync completed: {} transactions processed in {}ms",
            stored_count,
            processing_time
        );

        Ok(result)
    }

    /// Transform ERP data to reconciliation format
    async fn transform_erp_data(
        &self,
        erp_config_id: Uuid,
        transactions: Vec<ERPTransaction>,
        mapping_config_id: Option<Uuid>,
    ) -> AppResult<Vec<ReconciliationRecord>> {
        let mappings = if let Some(mapping_id) = mapping_config_id {
            self.mappings.get(&mapping_id)
                .ok_or_else(|| AppError::NotFound("Data mapping not found".to_string()))?
        } else {
            self.mappings.get(&erp_config_id)
                .ok_or_else(|| AppError::NotFound("Default data mapping not found".to_string()))?
        };

        let mut reconciliation_records = Vec::new();

        for transaction in transactions {
            let mut record = ReconciliationRecord {
                id: Uuid::new_v4(),
                project_id: Uuid::new_v4(), // Will be set by caller
                ingestion_job_id: Uuid::new_v4(), // Will be set by caller
                external_id: Some(transaction.id.clone()),
                status: "pending".to_string(),
                amount: Some(transaction.amount),
                transaction_date: Some(transaction.posting_date),
                description: Some(transaction.description),
                source_data: serde_json::to_string(&transaction).unwrap_or_default(),
                matching_results: "{}".to_string(),
                confidence: None,
                audit_trail: "{}".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            // Apply field mappings
            for mapping in mappings {
                self.apply_field_mapping(&mut record, &transaction, mapping)?;
            }

            reconciliation_records.push(record);
        }

        Ok(reconciliation_records)
    }

    /// Apply field mapping transformation
    fn apply_field_mapping(
        &self,
        record: &mut ReconciliationRecord,
        transaction: &ERPTransaction,
        mapping: &ERPDataMapping,
    ) -> AppResult<()> {
        // Get ERP field value
        let erp_value = self.get_erp_field_value(transaction, &mapping.erp_field)?;

        // Apply transformation rules
        let transformed_value = self.apply_transformation_rules(
            erp_value,
            &mapping.transformation_rules,
        )?;

        // Set reconciliation field
        self.set_reconciliation_field(record, &mapping.reconciliation_field, transformed_value)?;

        Ok(())
    }

    /// Get ERP field value
    fn get_erp_field_value(&self, transaction: &ERPTransaction, field_name: &str) -> AppResult<serde_json::Value> {
        match field_name {
            "id" => Ok(serde_json::Value::String(transaction.id.clone())),
            "document_number" => Ok(serde_json::Value::String(transaction.document_number.clone())),
            "document_type" => Ok(serde_json::Value::String(transaction.document_type.clone())),
            "posting_date" => Ok(serde_json::Value::String(transaction.posting_date.to_string())),
            "amount" => Ok(serde_json::Value::Number(serde_json::Number::from_f64(transaction.amount).unwrap_or_default())),
            "currency" => Ok(serde_json::Value::String(transaction.currency.clone())),
            "description" => Ok(serde_json::Value::String(transaction.description.clone())),
            "account_code" => Ok(serde_json::Value::String(transaction.account_code.clone())),
            "cost_center" => Ok(transaction.cost_center.as_ref().map(|v| serde_json::Value::String(v.clone())).unwrap_or(serde_json::Value::Null)),
            "profit_center" => Ok(transaction.profit_center.as_ref().map(|v| serde_json::Value::String(v.clone())).unwrap_or(serde_json::Value::Null)),
            "reference" => Ok(transaction.reference.as_ref().map(|v| serde_json::Value::String(v.clone())).unwrap_or(serde_json::Value::Null)),
            "vendor_customer" => Ok(transaction.vendor_customer.as_ref().map(|v| serde_json::Value::String(v.clone())).unwrap_or(serde_json::Value::Null)),
            _ => {
                // Check additional fields
                transaction.additional_fields.get(field_name)
                    .cloned()
                    .ok_or_else(|| AppError::BadRequest(format!("Field '{}' not found in ERP transaction", field_name)))
            }
        }
    }

    /// Apply transformation rules
    fn apply_transformation_rules(
        &self,
        value: serde_json::Value,
        rules: &HashMap<String, serde_json::Value>,
    ) -> AppResult<serde_json::Value> {
        let mut result = value;

        for (rule_name, rule_config) in rules {
            match rule_name.as_str() {
                "uppercase" => {
                    if let Some(str_value) = result.as_str() {
                        result = serde_json::Value::String(str_value.to_uppercase());
                    }
                },
                "lowercase" => {
                    if let Some(str_value) = result.as_str() {
                        result = serde_json::Value::String(str_value.to_lowercase());
                    }
                },
                "trim" => {
                    if let Some(str_value) = result.as_str() {
                        result = serde_json::Value::String(str_value.trim().to_string());
                    }
                },
                "format_date" => {
                    if let Some(date_str) = result.as_str() {
                        if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
                            if let Some(format) = rule_config.as_str() {
                                result = serde_json::Value::String(date.format(format).to_string());
                            }
                        }
                    }
                },
                "multiply" => {
                    if let Some(factor) = rule_config.as_f64() {
                        if let Some(num_value) = result.as_f64() {
                            result = serde_json::Value::Number(serde_json::Number::from_f64(num_value * factor).unwrap_or_default());
                        }
                    }
                },
                "divide" => {
                    if let Some(divisor) = rule_config.as_f64() {
                        if let Some(num_value) = result.as_f64() {
                            result = serde_json::Value::Number(serde_json::Number::from_f64(num_value / divisor).unwrap_or_default());
                        }
                    }
                },
                _ => {
                    tracing::warn!("Unknown transformation rule: {}", rule_name);
                }
            }
        }

        Ok(result)
    }

    /// Set reconciliation field value
    fn set_reconciliation_field(
        &self,
        record: &mut ReconciliationRecord,
        field_name: &str,
        value: serde_json::Value,
    ) -> AppResult<()> {
        match field_name {
            "external_id" => {
                if let Some(str_value) = value.as_str() {
                    record.external_id = Some(str_value.to_string());
                }
            },
            "amount" => {
                if let Some(num_value) = value.as_f64() {
                    record.amount = Some(num_value);
                }
            },
            "transaction_date" => {
                if let Some(date_str) = value.as_str() {
                    if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
                        record.transaction_date = Some(date);
                    }
                }
            },
            "description" => {
                if let Some(str_value) = value.as_str() {
                    record.description = Some(str_value.to_string());
                }
            },
            _ => {
                // Add to source_data as additional field
                let mut source_data: serde_json::Value = serde_json::from_str(&record.source_data).unwrap_or(serde_json::Value::Object(serde_json::Map::new()));
                if let Some(obj) = source_data.as_object_mut() {
                    obj.insert(field_name.to_string(), value);
                }
                record.source_data = serde_json::to_string(&source_data).unwrap_or_default();
            }
        }
        Ok(())
    }

    /// Validate ERP data quality
    async fn validate_erp_data(&self, records: &[ReconciliationRecord]) -> AppResult<DataQualityReport> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        let mut quality_scores = Vec::new();

        for (index, record) in records.iter().enumerate() {
            let mut record_score = 1.0;

            // Check required fields
            if record.amount.is_none() {
                errors.push(format!("Record {}: Missing amount", index));
                record_score -= 0.3;
            }

            if record.transaction_date.is_none() {
                errors.push(format!("Record {}: Missing transaction date", index));
                record_score -= 0.2;
            }

            if record.description.is_none() || record.description.as_ref().unwrap().is_empty() {
                warnings.push(format!("Record {}: Missing or empty description", index));
                record_score -= 0.1;
            }

            if record.external_id.is_none() {
                warnings.push(format!("Record {}: Missing external ID", index));
                record_score -= 0.1;
            }

            // Check data validity
            if let Some(amount) = record.amount {
                if amount < 0.0 {
                    warnings.push(format!("Record {}: Negative amount detected", index));
                    record_score -= 0.1;
                }
                if amount > 1_000_000.0 {
                    warnings.push(format!("Record {}: Unusually large amount", index));
                    record_score -= 0.05;
                }
            }

            quality_scores.push(record_score.max(0.0));
        }

        let overall_score = if quality_scores.is_empty() {
            1.0
        } else {
            quality_scores.iter().sum::<f64>() / quality_scores.len() as f64
        };

        Ok(DataQualityReport {
            overall_score,
            errors,
            warnings,
            total_records: records.len() as u32,
            valid_records: quality_scores.iter().filter(|&&s| s >= 0.8).count() as u32,
        })
    }

    /// Store reconciliation records
    async fn store_reconciliation_records(
        &self,
        project_id: Uuid,
        records: Vec<ReconciliationRecord>,
    ) -> AppResult<u32> {
        // This would integrate with the database layer
        // For now, we'll just return the count
        tracing::info!("Storing {} reconciliation records for project {}", records.len(), project_id);
        Ok(records.len() as u32)
    }

    /// Refresh access token
    async fn refresh_token(&mut self, erp_config_id: Uuid) -> AppResult<()> {
        tracing::info!("Refreshing access token for ERP configuration {}", erp_config_id);
        // Implementation would depend on the specific ERP system's token refresh mechanism
        Ok(())
    }

    /// Build API URL for ERP system
    fn build_api_url(&self, config: &ERPConfig, endpoint: &str) -> AppResult<String> {
        let base_url = config.base_url.trim_end_matches('/');
        let api_version = &config.api_version;
        Ok(format!("{}/api/{}/{}", base_url, api_version, endpoint))
    }
}

/// ERP sync configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ERPSyncConfig {
    pub from_date: chrono::NaiveDate,
    pub to_date: chrono::NaiveDate,
    pub filters: HashMap<String, String>,
    pub mapping_config_id: Option<Uuid>,
    pub sync_frequency: SyncFrequency,
    pub is_automated: bool,
}

/// Sync frequency options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncFrequency {
    Manual,
    Hourly,
    Daily,
    Weekly,
    Monthly,
}

/// ERP sync result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ERPSyncResult {
    pub erp_config_id: Uuid,
    pub project_id: Uuid,
    pub total_transactions: u32,
    pub processed_records: u32,
    pub quality_score: f64,
    pub processing_time_ms: u64,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub synced_at: DateTime<Utc>,
}

/// Data quality report
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataQualityReport {
    pub overall_score: f64,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub total_records: u32,
    pub valid_records: u32,
}

// Import ReconciliationRecord from models
use crate::models::ReconciliationRecord;
