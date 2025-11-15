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

/// Banking API types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BankingAPIType {
    OpenBanking,
    Plaid,
    Yodlee,
    Finicity,
    MX,
    SaltEdge,
    TrueLayer,
    Tink,
    Nordigen,
    Custom(String),
}

/// Banking API configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankingAPIConfig {
    pub id: Uuid,
    pub api_type: BankingAPIType,
    pub name: String,
    pub base_url: String,
    pub api_version: String,
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub redirect_url: String,
    pub scopes: Vec<String>,
    pub supported_account_types: Vec<AccountType>,
    pub supported_transaction_types: Vec<TransactionType>,
    pub rate_limits: RateLimits,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Account types supported by banking APIs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountType {
    Checking,
    Savings,
    CreditCard,
    Loan,
    Investment,
    Mortgage,
    Business,
    Other(String),
}

/// Transaction types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionType {
    Debit,
    Credit,
    Transfer,
    Payment,
    Fee,
    Interest,
    Refund,
    Other(String),
}

/// Rate limits for banking APIs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimits {
    pub requests_per_minute: u32,
    pub requests_per_hour: u32,
    pub requests_per_day: u32,
    pub burst_limit: u32,
}

/// Bank account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankAccount {
    pub id: String,
    pub account_number: String,
    pub routing_number: Option<String>,
    pub account_type: AccountType,
    pub account_name: String,
    pub bank_name: String,
    pub currency: String,
    pub balance: Option<f64>,
    pub available_balance: Option<f64>,
    pub is_active: bool,
    pub last_updated: DateTime<Utc>,
}

/// Banking transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankingTransaction {
    pub id: String,
    pub account_id: String,
    pub transaction_type: TransactionType,
    pub amount: f64,
    pub currency: String,
    pub description: String,
    pub merchant_name: Option<String>,
    pub category: Option<String>,
    pub subcategory: Option<String>,
    pub transaction_date: chrono::NaiveDate,
    pub posted_date: Option<chrono::NaiveDate>,
    pub reference_number: Option<String>,
    pub check_number: Option<String>,
    pub location: Option<TransactionLocation>,
    pub additional_data: HashMap<String, serde_json::Value>,
}

/// Transaction location information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionLocation {
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub country: Option<String>,
    pub postal_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

/// Banking API integration manager
pub struct BankingAPIManager {
    configs: HashMap<Uuid, BankingAPIConfig>,
    clients: HashMap<Uuid, BankingAPIClient>,
    http_client: Client,
    rate_limiters: HashMap<Uuid, RateLimiter>,
}

/// Banking API client for specific provider
pub struct BankingAPIClient {
    config: BankingAPIConfig,
    oauth_client: BasicClient,
    access_token: Option<String>,
    refresh_token: Option<String>,
    token_expires_at: Option<DateTime<Utc>>,
}

/// Rate limiter for API calls
pub struct RateLimiter {
    requests_per_minute: u32,
    requests_per_hour: u32,
    requests_per_day: u32,
    burst_limit: u32,
    minute_requests: Vec<DateTime<Utc>>,
    hour_requests: Vec<DateTime<Utc>>,
    day_requests: Vec<DateTime<Utc>>,
}

impl BankingAPIManager {
    pub fn new() -> Self {
        Self {
            configs: HashMap::new(),
            clients: HashMap::new(),
            http_client: Client::new(),
            rate_limiters: HashMap::new(),
        }
    }

    /// Add banking API configuration
    pub async fn add_banking_api_config(&mut self, config: BankingAPIConfig) -> AppResult<()> {
        tracing::info!("Adding banking API configuration for {} ({:?})", config.name, config.api_type);

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

        let banking_client = BankingAPIClient {
            config: config.clone(),
            oauth_client,
            access_token: None,
            refresh_token: None,
            token_expires_at: None,
        };

        let rate_limiter = RateLimiter::new(config.rate_limits.clone());

        self.configs.insert(config.id, config);
        self.clients.insert(config.id, banking_client);
        self.rate_limiters.insert(config.id, rate_limiter);

        tracing::info!("Banking API configuration added successfully");
        Ok(())
    }

    /// Authenticate with banking API
    pub async fn authenticate(&mut self, api_config_id: Uuid) -> AppResult<String> {
        let client = self.clients.get_mut(&api_config_id)
            .ok_or_else(|| AppError::NotFound("Banking API configuration not found".to_string()))?;

        tracing::info!("Authenticating with banking API: {}", client.config.name);

        // Generate PKCE challenge
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        
        // Generate authorization URL
        let mut auth_url_builder = client.oauth_client
            .authorize_url(CsrfToken::new_random)
            .set_pkce_challenge(pkce_challenge);

        // Add scopes
        for scope in &client.config.scopes {
            auth_url_builder = auth_url_builder.add_scope(Scope::new(scope.clone()));
        }

        let (auth_url, csrf_token) = auth_url_builder.url();

        tracing::info!("Generated authorization URL: {}", auth_url);
        Ok(auth_url.to_string())
    }

    /// Exchange authorization code for access token
    pub async fn exchange_code_for_token(
        &mut self,
        api_config_id: Uuid,
        auth_code: String,
        pkce_verifier: String,
    ) -> AppResult<()> {
        let client = self.clients.get_mut(&api_config_id)
            .ok_or_else(|| AppError::NotFound("Banking API configuration not found".to_string()))?;

        tracing::info!("Exchanging authorization code for access token");

        let token_result = client.oauth_client
            .exchange_code(AuthorizationCode::new(auth_code))
            .set_pkce_verifier(PkceCodeVerifier::new(pkce_verifier))
            .request_async(async_http_client)
            .await
            .map_err(|e| AppError::InternalServerError(format!("Token exchange failed: {}", e)))?;

        client.access_token = Some(token_result.access_token().secret().clone());
        
        // Store refresh token if available
        if let Some(refresh_token) = token_result.refresh_token() {
            client.refresh_token = Some(refresh_token.secret().clone());
        }
        
        // Calculate token expiration
        if let Some(expires_in) = token_result.expires_in() {
            client.token_expires_at = Some(Utc::now() + chrono::Duration::seconds(expires_in.as_secs() as i64));
        }

        tracing::info!("Access token obtained successfully");
        Ok(())
    }

    /// Fetch bank accounts
    pub async fn fetch_accounts(&mut self, api_config_id: Uuid) -> AppResult<Vec<BankAccount>> {
        let client = self.clients.get_mut(&api_config_id)
            .ok_or_else(|| AppError::NotFound("Banking API configuration not found".to_string()))?;

        // Check rate limits
        self.check_rate_limits(api_config_id).await?;

        // Check if token is expired and refresh if needed
        if let Some(expires_at) = client.token_expires_at {
            if Utc::now() >= expires_at {
                self.refresh_token(api_config_id).await?;
            }
        }

        let access_token = client.access_token.as_ref()
            .ok_or_else(|| AppError::Unauthorized("No access token available".to_string()))?;

        tracing::info!("Fetching bank accounts from {}", client.config.name);

        // Build API URL
        let api_url = self.build_api_url(&client.config, "accounts")?;

        // Make API request
        let response = self.http_client
            .get(&api_url)
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Banking API request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::InternalServerError(format!(
                "Banking API returned error: {}",
                response.status()
            )));
        }

        let accounts: Vec<BankAccount> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse banking API response: {}", e)))?;

        // Update rate limiter
        self.update_rate_limiter(api_config_id).await?;

        tracing::info!("Fetched {} bank accounts", accounts.len());
        Ok(accounts)
    }

    /// Fetch transactions for an account
    pub async fn fetch_transactions(
        &mut self,
        api_config_id: Uuid,
        account_id: String,
        from_date: chrono::NaiveDate,
        to_date: chrono::NaiveDate,
        limit: Option<u32>,
    ) -> AppResult<Vec<BankingTransaction>> {
        let client = self.clients.get_mut(&api_config_id)
            .ok_or_else(|| AppError::NotFound("Banking API configuration not found".to_string()))?;

        // Check rate limits
        self.check_rate_limits(api_config_id).await?;

        // Check if token is expired and refresh if needed
        if let Some(expires_at) = client.token_expires_at {
            if Utc::now() >= expires_at {
                self.refresh_token(api_config_id).await?;
            }
        }

        let access_token = client.access_token.as_ref()
            .ok_or_else(|| AppError::Unauthorized("No access token available".to_string()))?;

        tracing::info!(
            "Fetching transactions for account {} from {} to {}",
            account_id,
            from_date,
            to_date
        );

        // Build API URL
        let api_url = self.build_api_url(&client.config, &format!("accounts/{}/transactions", account_id))?;

        // Build query parameters
        let mut query_params = vec![
            ("start_date", from_date.to_string()),
            ("end_date", to_date.to_string()),
        ];

        if let Some(limit_value) = limit {
            query_params.push(("limit", limit_value.to_string()));
        }

        // Make API request
        let response = self.http_client
            .get(&api_url)
            .bearer_auth(access_token)
            .query(&query_params)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Banking API request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::InternalServerError(format!(
                "Banking API returned error: {}",
                response.status()
            )));
        }

        let transactions: Vec<BankingTransaction> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse banking API response: {}", e)))?;

        // Update rate limiter
        self.update_rate_limiter(api_config_id).await?;

        tracing::info!("Fetched {} transactions", transactions.len());
        Ok(transactions)
    }

    /// Sync banking data to reconciliation system
    pub async fn sync_banking_data(
        &mut self,
        api_config_id: Uuid,
        project_id: Uuid,
        sync_config: BankingSyncConfig,
    ) -> AppResult<BankingSyncResult> {
        let start_time = std::time::Instant::now();

        tracing::info!("Starting banking data sync for project {}", project_id);

        // Fetch accounts
        let accounts = self.fetch_accounts(api_config_id).await?;

        // Filter accounts based on sync config
        let filtered_accounts = self.filter_accounts(accounts, &sync_config.account_filters)?;

        let mut all_transactions = Vec::new();
        let mut sync_errors = Vec::new();

        // Fetch transactions for each account
        for account in &filtered_accounts {
            match self.fetch_transactions(
                api_config_id,
                account.id.clone(),
                sync_config.from_date,
                sync_config.to_date,
                sync_config.transaction_limit,
            ).await {
                Ok(transactions) => {
                    all_transactions.extend(transactions);
                },
                Err(e) => {
                    sync_errors.push(format!("Failed to fetch transactions for account {}: {}", account.id, e));
                }
            }
        }

        // Transform banking data to reconciliation format
        let reconciliation_records = self.transform_banking_data(
            api_config_id,
            all_transactions,
            sync_config.mapping_config_id,
        ).await?;

        // Apply data quality checks
        let quality_report = self.validate_banking_data(&reconciliation_records).await?;

        // Store in reconciliation system
        let stored_count = self.store_reconciliation_records(
            project_id,
            reconciliation_records,
        ).await?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        let result = BankingSyncResult {
            api_config_id,
            project_id,
            total_accounts: filtered_accounts.len() as u32,
            total_transactions: all_transactions.len() as u32,
            processed_records: stored_count,
            quality_score: quality_report.overall_score,
            processing_time_ms: processing_time,
            errors: sync_errors,
            warnings: quality_report.warnings,
            synced_at: Utc::now(),
        };

        tracing::info!(
            "Banking sync completed: {} transactions processed in {}ms",
            stored_count,
            processing_time
        );

        Ok(result)
    }

    /// Filter accounts based on sync configuration
    fn filter_accounts(
        &self,
        accounts: Vec<BankAccount>,
        filters: &AccountFilters,
    ) -> AppResult<Vec<BankAccount>> {
        let mut filtered = accounts;

        // Filter by account types
        if !filters.account_types.is_empty() {
            filtered.retain(|account| filters.account_types.contains(&account.account_type));
        }

        // Filter by bank names
        if !filters.bank_names.is_empty() {
            filtered.retain(|account| filters.bank_names.contains(&account.bank_name));
        }

        // Filter by active status
        if let Some(active_only) = filters.active_only {
            filtered.retain(|account| account.is_active == active_only);
        }

        // Filter by balance range
        if let Some(min_balance) = filters.min_balance {
            filtered.retain(|account| {
                account.balance.map_or(false, |balance| balance >= min_balance)
            });
        }

        if let Some(max_balance) = filters.max_balance {
            filtered.retain(|account| {
                account.balance.map_or(false, |balance| balance <= max_balance)
            });
        }

        Ok(filtered)
    }

    /// Transform banking data to reconciliation format
    async fn transform_banking_data(
        &self,
        api_config_id: Uuid,
        transactions: Vec<BankingTransaction>,
        mapping_config_id: Option<Uuid>,
    ) -> AppResult<Vec<ReconciliationRecord>> {
        let mut reconciliation_records = Vec::new();

        for transaction in transactions {
            let mut record = ReconciliationRecord {
                id: Uuid::new_v4(),
                project_id: Uuid::new_v4(), // Will be set by caller
                ingestion_job_id: Uuid::new_v4(), // Will be set by caller
                external_id: Some(transaction.id.clone()),
                status: "pending".to_string(),
                amount: Some(transaction.amount),
                transaction_date: Some(transaction.transaction_date),
                description: Some(transaction.description),
                source_data: serde_json::to_string(&transaction).unwrap_or_default(),
                matching_results: "{}".to_string(),
                confidence: None,
                audit_trail: "{}".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            // Apply standard banking data transformations
            self.apply_banking_transformations(&mut record, &transaction)?;

            reconciliation_records.push(record);
        }

        Ok(reconciliation_records)
    }

    /// Apply banking-specific transformations
    fn apply_banking_transformations(
        &self,
        record: &mut ReconciliationRecord,
        transaction: &BankingTransaction,
    ) -> AppResult<()> {
        // Add banking-specific metadata to source_data
        let mut source_data: serde_json::Value = serde_json::from_str(&record.source_data).unwrap_or(serde_json::Value::Object(serde_json::Map::new()));
        
        if let Some(obj) = source_data.as_object_mut() {
            obj.insert("account_id".to_string(), serde_json::Value::String(transaction.account_id.clone()));
            obj.insert("transaction_type".to_string(), serde_json::to_value(&transaction.transaction_type).unwrap_or(serde_json::Value::Null));
            obj.insert("currency".to_string(), serde_json::Value::String(transaction.currency.clone()));
            
            if let Some(merchant) = &transaction.merchant_name {
                obj.insert("merchant_name".to_string(), serde_json::Value::String(merchant.clone()));
            }
            
            if let Some(category) = &transaction.category {
                obj.insert("category".to_string(), serde_json::Value::String(category.clone()));
            }
            
            if let Some(reference) = &transaction.reference_number {
                obj.insert("reference_number".to_string(), serde_json::Value::String(reference.clone()));
            }
        }

        record.source_data = serde_json::to_string(&source_data).unwrap_or_default();
        Ok(())
    }

    /// Validate banking data quality
    async fn validate_banking_data(&self, records: &[ReconciliationRecord]) -> AppResult<DataQualityReport> {
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

            // Check banking-specific validations
            if let Some(amount) = record.amount {
                if amount == 0.0 {
                    warnings.push(format!("Record {}: Zero amount transaction", index));
                    record_score -= 0.05;
                }
            }

            // Check for duplicate transactions
            if let Some(external_id) = &record.external_id {
                if external_id.is_empty() {
                    warnings.push(format!("Record {}: Empty external ID", index));
                    record_score -= 0.1;
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
    async fn refresh_token(&mut self, api_config_id: Uuid) -> AppResult<()> {
        tracing::info!("Refreshing access token for banking API configuration {}", api_config_id);
        // Implementation would depend on the specific banking API's token refresh mechanism
        Ok(())
    }

    /// Check rate limits
    async fn check_rate_limits(&self, api_config_id: Uuid) -> AppResult<()> {
        if let Some(rate_limiter) = self.rate_limiters.get(&api_config_id) {
            if !rate_limiter.can_make_request() {
                return Err(AppError::TooManyRequests("Rate limit exceeded".to_string()));
            }
        }
        Ok(())
    }

    /// Update rate limiter
    async fn update_rate_limiter(&mut self, api_config_id: Uuid) -> AppResult<()> {
        if let Some(rate_limiter) = self.rate_limiters.get_mut(&api_config_id) {
            rate_limiter.record_request();
        }
        Ok(())
    }

    /// Build API URL for banking API
    fn build_api_url(&self, config: &BankingAPIConfig, endpoint: &str) -> AppResult<String> {
        let base_url = config.base_url.trim_end_matches('/');
        let api_version = &config.api_version;
        Ok(format!("{}/api/{}/{}", base_url, api_version, endpoint))
    }
}

impl RateLimiter {
    pub fn new(limits: RateLimits) -> Self {
        Self {
            requests_per_minute: limits.requests_per_minute,
            requests_per_hour: limits.requests_per_hour,
            requests_per_day: limits.requests_per_day,
            burst_limit: limits.burst_limit,
            minute_requests: Vec::new(),
            hour_requests: Vec::new(),
            day_requests: Vec::new(),
        }
    }

    pub fn can_make_request(&self) -> bool {
        let now = Utc::now();
        
        // Check minute limit
        let minute_count = self.minute_requests.iter()
            .filter(|&&time| now - time < chrono::Duration::minutes(1))
            .count();
        
        if minute_count >= self.requests_per_minute as usize {
            return false;
        }

        // Check hour limit
        let hour_count = self.hour_requests.iter()
            .filter(|&&time| now - time < chrono::Duration::hours(1))
            .count();
        
        if hour_count >= self.requests_per_hour as usize {
            return false;
        }

        // Check day limit
        let day_count = self.day_requests.iter()
            .filter(|&&time| now - time < chrono::Duration::days(1))
            .count();
        
        if day_count >= self.requests_per_day as usize {
            return false;
        }

        true
    }

    pub fn record_request(&mut self) {
        let now = Utc::now();
        
        self.minute_requests.push(now);
        self.hour_requests.push(now);
        self.day_requests.push(now);

        // Clean up old requests
        self.minute_requests.retain(|&time| now - time < chrono::Duration::minutes(1));
        self.hour_requests.retain(|&time| now - time < chrono::Duration::hours(1));
        self.day_requests.retain(|&time| now - time < chrono::Duration::days(1));
    }
}

/// Banking sync configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankingSyncConfig {
    pub from_date: chrono::NaiveDate,
    pub to_date: chrono::NaiveDate,
    pub account_filters: AccountFilters,
    pub transaction_limit: Option<u32>,
    pub mapping_config_id: Option<Uuid>,
    pub sync_frequency: SyncFrequency,
    pub is_automated: bool,
}

/// Account filters for sync
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountFilters {
    pub account_types: Vec<AccountType>,
    pub bank_names: Vec<String>,
    pub active_only: Option<bool>,
    pub min_balance: Option<f64>,
    pub max_balance: Option<f64>,
}

/// Banking sync result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankingSyncResult {
    pub api_config_id: Uuid,
    pub project_id: Uuid,
    pub total_accounts: u32,
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

/// Sync frequency options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncFrequency {
    Manual,
    Hourly,
    Daily,
    Weekly,
    Monthly,
}

// Import ReconciliationRecord from models
use crate::models::ReconciliationRecord;
