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

/// Accounting software types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountingSoftwareType {
    QuickBooks,
    Xero,
    Sage,
    FreshBooks,
    Wave,
    ZohoBooks,
    MYOB,
    Kashoo,
    FreeAgent,
    Custom(String),
}

/// Accounting software configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountingSoftwareConfig {
    pub id: Uuid,
    pub software_type: AccountingSoftwareType,
    pub name: String,
    pub base_url: String,
    pub api_version: String,
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub redirect_url: String,
    pub scopes: Vec<String>,
    pub company_id: Option<String>,
    pub supported_entities: Vec<AccountingEntity>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Accounting entities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountingEntity {
    Transactions,
    Invoices,
    Bills,
    Customers,
    Vendors,
    ChartOfAccounts,
    JournalEntries,
    BankAccounts,
    Reports,
}

/// Accounting transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountingTransaction {
    pub id: String,
    pub transaction_type: AccountingTransactionType,
    pub date: chrono::NaiveDate,
    pub amount: f64,
    pub currency: String,
    pub description: String,
    pub reference: Option<String>,
    pub account_code: String,
    pub account_name: String,
    pub customer_id: Option<String>,
    pub customer_name: Option<String>,
    pub vendor_id: Option<String>,
    pub vendor_name: Option<String>,
    pub invoice_id: Option<String>,
    pub bill_id: Option<String>,
    pub journal_entry_id: Option<String>,
    pub line_items: Vec<TransactionLineItem>,
    pub additional_data: HashMap<String, serde_json::Value>,
}

/// Accounting transaction types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AccountingTransactionType {
    Sale,
    Purchase,
    Payment,
    Receipt,
    JournalEntry,
    Transfer,
    Adjustment,
    Refund,
    Other(String),
}

/// Transaction line item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionLineItem {
    pub id: String,
    pub account_code: String,
    pub account_name: String,
    pub description: String,
    pub amount: f64,
    pub debit_credit: DebitCredit,
    pub tax_code: Option<String>,
    pub tax_amount: Option<f64>,
    pub project_id: Option<String>,
    pub department_id: Option<String>,
}

/// Debit/Credit indicator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DebitCredit {
    Debit,
    Credit,
}

/// Accounting invoice
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountingInvoice {
    pub id: String,
    pub invoice_number: String,
    pub customer_id: String,
    pub customer_name: String,
    pub invoice_date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub total_amount: f64,
    pub currency: String,
    pub status: InvoiceStatus,
    pub line_items: Vec<InvoiceLineItem>,
    pub tax_amount: f64,
    pub discount_amount: Option<f64>,
    pub notes: Option<String>,
    pub additional_data: HashMap<String, serde_json::Value>,
}

/// Invoice status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InvoiceStatus {
    Draft,
    Sent,
    Paid,
    Overdue,
    Cancelled,
    PartiallyPaid,
}

/// Invoice line item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InvoiceLineItem {
    pub id: String,
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total_amount: f64,
    pub account_code: String,
    pub tax_code: Option<String>,
    pub tax_amount: f64,
}

/// Accounting bill
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountingBill {
    pub id: String,
    pub bill_number: String,
    pub vendor_id: String,
    pub vendor_name: String,
    pub bill_date: chrono::NaiveDate,
    pub due_date: Option<chrono::NaiveDate>,
    pub total_amount: f64,
    pub currency: String,
    pub status: BillStatus,
    pub line_items: Vec<BillLineItem>,
    pub tax_amount: f64,
    pub discount_amount: Option<f64>,
    pub notes: Option<String>,
    pub additional_data: HashMap<String, serde_json::Value>,
}

/// Bill status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BillStatus {
    Draft,
    Received,
    Paid,
    Overdue,
    Cancelled,
    PartiallyPaid,
}

/// Bill line item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillLineItem {
    pub id: String,
    pub description: String,
    pub quantity: f64,
    pub unit_price: f64,
    pub total_amount: f64,
    pub account_code: String,
    pub tax_code: Option<String>,
    pub tax_amount: f64,
}

/// Accounting software integration manager
pub struct AccountingSoftwareManager {
    configs: HashMap<Uuid, AccountingSoftwareConfig>,
    clients: HashMap<Uuid, AccountingSoftwareClient>,
    http_client: Client,
}

/// Accounting software client
pub struct AccountingSoftwareClient {
    config: AccountingSoftwareConfig,
    oauth_client: BasicClient,
    access_token: Option<String>,
    refresh_token: Option<String>,
    token_expires_at: Option<DateTime<Utc>>,
}

impl AccountingSoftwareManager {
    pub fn new() -> Self {
        Self {
            configs: HashMap::new(),
            clients: HashMap::new(),
            http_client: Client::new(),
        }
    }

    /// Add accounting software configuration
    pub async fn add_accounting_config(&mut self, config: AccountingSoftwareConfig) -> AppResult<()> {
        tracing::info!("Adding accounting software configuration for {} ({:?})", config.name, config.software_type);

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

        let accounting_client = AccountingSoftwareClient {
            config: config.clone(),
            oauth_client,
            access_token: None,
            refresh_token: None,
            token_expires_at: None,
        };

        self.configs.insert(config.id, config);
        self.clients.insert(config.id, accounting_client);

        tracing::info!("Accounting software configuration added successfully");
        Ok(())
    }

    /// Authenticate with accounting software
    pub async fn authenticate(&mut self, config_id: Uuid) -> AppResult<String> {
        let client = self.clients.get_mut(&config_id)
            .ok_or_else(|| AppError::NotFound("Accounting software configuration not found".to_string()))?;

        tracing::info!("Authenticating with accounting software: {}", client.config.name);

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
        config_id: Uuid,
        auth_code: String,
        pkce_verifier: String,
    ) -> AppResult<()> {
        let client = self.clients.get_mut(&config_id)
            .ok_or_else(|| AppError::NotFound("Accounting software configuration not found".to_string()))?;

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

    /// Fetch accounting transactions
    pub async fn fetch_transactions(
        &mut self,
        config_id: Uuid,
        from_date: chrono::NaiveDate,
        to_date: chrono::NaiveDate,
        filters: HashMap<String, String>,
    ) -> AppResult<Vec<AccountingTransaction>> {
        let client = self.clients.get_mut(&config_id)
            .ok_or_else(|| AppError::NotFound("Accounting software configuration not found".to_string()))?;

        // Check if token is expired and refresh if needed
        if let Some(expires_at) = client.token_expires_at {
            if Utc::now() >= expires_at {
                self.refresh_token(config_id).await?;
            }
        }

        let access_token = client.access_token.as_ref()
            .ok_or_else(|| AppError::Unauthorized("No access token available".to_string()))?;

        tracing::info!(
            "Fetching accounting transactions from {} from {} to {}",
            client.config.name,
            from_date,
            to_date
        );

        // Build API URL
        let api_url = self.build_api_url(&client.config, "transactions")?;

        // Build query parameters
        let mut query_params = vec![
            ("start_date", from_date.to_string()),
            ("end_date", to_date.to_string()),
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
            .map_err(|e| AppError::InternalServerError(format!("Accounting API request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::InternalServerError(format!(
                "Accounting API returned error: {}",
                response.status()
            )));
        }

        let transactions: Vec<AccountingTransaction> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse accounting API response: {}", e)))?;

        tracing::info!("Fetched {} accounting transactions", transactions.len());
        Ok(transactions)
    }

    /// Fetch accounting invoices
    pub async fn fetch_invoices(
        &mut self,
        config_id: Uuid,
        from_date: chrono::NaiveDate,
        to_date: chrono::NaiveDate,
        status_filter: Option<InvoiceStatus>,
    ) -> AppResult<Vec<AccountingInvoice>> {
        let client = self.clients.get_mut(&config_id)
            .ok_or_else(|| AppError::NotFound("Accounting software configuration not found".to_string()))?;

        // Check if token is expired and refresh if needed
        if let Some(expires_at) = client.token_expires_at {
            if Utc::now() >= expires_at {
                self.refresh_token(config_id).await?;
            }
        }

        let access_token = client.access_token.as_ref()
            .ok_or_else(|| AppError::Unauthorized("No access token available".to_string()))?;

        tracing::info!(
            "Fetching accounting invoices from {} from {} to {}",
            client.config.name,
            from_date,
            to_date
        );

        // Build API URL
        let api_url = self.build_api_url(&client.config, "invoices")?;

        // Build query parameters
        let mut query_params = vec![
            ("start_date", from_date.to_string()),
            ("end_date", to_date.to_string()),
        ];

        if let Some(status) = status_filter {
            query_params.push(("status", format!("{:?}", status)));
        }

        // Make API request
        let response = self.http_client
            .get(&api_url)
            .bearer_auth(access_token)
            .query(&query_params)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Accounting API request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::InternalServerError(format!(
                "Accounting API returned error: {}",
                response.status()
            )));
        }

        let invoices: Vec<AccountingInvoice> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse accounting API response: {}", e)))?;

        tracing::info!("Fetched {} accounting invoices", invoices.len());
        Ok(invoices)
    }

    /// Fetch accounting bills
    pub async fn fetch_bills(
        &mut self,
        config_id: Uuid,
        from_date: chrono::NaiveDate,
        to_date: chrono::NaiveDate,
        status_filter: Option<BillStatus>,
    ) -> AppResult<Vec<AccountingBill>> {
        let client = self.clients.get_mut(&config_id)
            .ok_or_else(|| AppError::NotFound("Accounting software configuration not found".to_string()))?;

        // Check if token is expired and refresh if needed
        if let Some(expires_at) = client.token_expires_at {
            if Utc::now() >= expires_at {
                self.refresh_token(config_id).await?;
            }
        }

        let access_token = client.access_token.as_ref()
            .ok_or_else(|| AppError::Unauthorized("No access token available".to_string()))?;

        tracing::info!(
            "Fetching accounting bills from {} from {} to {}",
            client.config.name,
            from_date,
            to_date
        );

        // Build API URL
        let api_url = self.build_api_url(&client.config, "bills")?;

        // Build query parameters
        let mut query_params = vec![
            ("start_date", from_date.to_string()),
            ("end_date", to_date.to_string()),
        ];

        if let Some(status) = status_filter {
            query_params.push(("status", format!("{:?}", status)));
        }

        // Make API request
        let response = self.http_client
            .get(&api_url)
            .bearer_auth(access_token)
            .query(&query_params)
            .send()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Accounting API request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::InternalServerError(format!(
                "Accounting API returned error: {}",
                response.status()
            )));
        }

        let bills: Vec<AccountingBill> = response
            .json()
            .await
            .map_err(|e| AppError::InternalServerError(format!("Failed to parse accounting API response: {}", e)))?;

        tracing::info!("Fetched {} accounting bills", bills.len());
        Ok(bills)
    }

    /// Sync accounting data to reconciliation system
    pub async fn sync_accounting_data(
        &mut self,
        config_id: Uuid,
        project_id: Uuid,
        sync_config: AccountingSyncConfig,
    ) -> AppResult<AccountingSyncResult> {
        let start_time = std::time::Instant::now();

        tracing::info!("Starting accounting data sync for project {}", project_id);

        let mut all_transactions = Vec::new();
        let mut sync_errors = Vec::new();

        // Fetch transactions
        if sync_config.sync_transactions {
            match self.fetch_transactions(
                config_id,
                sync_config.from_date,
                sync_config.to_date,
                sync_config.transaction_filters.clone(),
            ).await {
                Ok(transactions) => {
                    all_transactions.extend(transactions);
                },
                Err(e) => {
                    sync_errors.push(format!("Failed to fetch transactions: {}", e));
                }
            }
        }

        // Fetch invoices
        if sync_config.sync_invoices {
            match self.fetch_invoices(
                config_id,
                sync_config.from_date,
                sync_config.to_date,
                sync_config.invoice_status_filter,
            ).await {
                Ok(invoices) => {
                    // Convert invoices to transactions
                    let invoice_transactions = self.convert_invoices_to_transactions(invoices);
                    all_transactions.extend(invoice_transactions);
                },
                Err(e) => {
                    sync_errors.push(format!("Failed to fetch invoices: {}", e));
                }
            }
        }

        // Fetch bills
        if sync_config.sync_bills {
            match self.fetch_bills(
                config_id,
                sync_config.from_date,
                sync_config.to_date,
                sync_config.bill_status_filter,
            ).await {
                Ok(bills) => {
                    // Convert bills to transactions
                    let bill_transactions = self.convert_bills_to_transactions(bills);
                    all_transactions.extend(bill_transactions);
                },
                Err(e) => {
                    sync_errors.push(format!("Failed to fetch bills: {}", e));
                }
            }
        }

        // Transform accounting data to reconciliation format
        let reconciliation_records = self.transform_accounting_data(
            config_id,
            all_transactions,
            sync_config.mapping_config_id,
        ).await?;

        // Apply data quality checks
        let quality_report = self.validate_accounting_data(&reconciliation_records).await?;

        // Store in reconciliation system
        let stored_count = self.store_reconciliation_records(
            project_id,
            reconciliation_records,
        ).await?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        let result = AccountingSyncResult {
            config_id,
            project_id,
            total_transactions: all_transactions.len() as u32,
            processed_records: stored_count,
            quality_score: quality_report.overall_score,
            processing_time_ms: processing_time,
            errors: sync_errors,
            warnings: quality_report.warnings,
            synced_at: Utc::now(),
        };

        tracing::info!(
            "Accounting sync completed: {} transactions processed in {}ms",
            stored_count,
            processing_time
        );

        Ok(result)
    }

    /// Convert invoices to transactions
    fn convert_invoices_to_transactions(&self, invoices: Vec<AccountingInvoice>) -> Vec<AccountingTransaction> {
        let mut transactions = Vec::new();

        for invoice in invoices {
            let transaction = AccountingTransaction {
                id: format!("invoice_{}", invoice.id),
                transaction_type: AccountingTransactionType::Sale,
                date: invoice.invoice_date,
                amount: invoice.total_amount,
                currency: invoice.currency,
                description: format!("Invoice {} - {}", invoice.invoice_number, invoice.customer_name),
                reference: Some(invoice.invoice_number),
                account_code: "ACCOUNTS_RECEIVABLE".to_string(),
                account_name: "Accounts Receivable".to_string(),
                customer_id: Some(invoice.customer_id),
                customer_name: Some(invoice.customer_name),
                vendor_id: None,
                vendor_name: None,
                invoice_id: Some(invoice.id),
                bill_id: None,
                journal_entry_id: None,
                line_items: invoice.line_items.into_iter().map(|item| TransactionLineItem {
                    id: item.id,
                    account_code: item.account_code,
                    account_name: "Sales".to_string(),
                    description: item.description,
                    amount: item.total_amount,
                    debit_credit: DebitCredit::Credit,
                    tax_code: item.tax_code,
                    tax_amount: Some(item.tax_amount),
                    project_id: None,
                    department_id: None,
                }).collect(),
                additional_data: invoice.additional_data,
            };
            transactions.push(transaction);
        }

        transactions
    }

    /// Convert bills to transactions
    fn convert_bills_to_transactions(&self, bills: Vec<AccountingBill>) -> Vec<AccountingTransaction> {
        let mut transactions = Vec::new();

        for bill in bills {
            let transaction = AccountingTransaction {
                id: format!("bill_{}", bill.id),
                transaction_type: AccountingTransactionType::Purchase,
                date: bill.bill_date,
                amount: bill.total_amount,
                currency: bill.currency,
                description: format!("Bill {} - {}", bill.bill_number, bill.vendor_name),
                reference: Some(bill.bill_number),
                account_code: "ACCOUNTS_PAYABLE".to_string(),
                account_name: "Accounts Payable".to_string(),
                customer_id: None,
                customer_name: None,
                vendor_id: Some(bill.vendor_id),
                vendor_name: Some(bill.vendor_name),
                invoice_id: None,
                bill_id: Some(bill.id),
                journal_entry_id: None,
                line_items: bill.line_items.into_iter().map(|item| TransactionLineItem {
                    id: item.id,
                    account_code: item.account_code,
                    account_name: "Expenses".to_string(),
                    description: item.description,
                    amount: item.total_amount,
                    debit_credit: DebitCredit::Debit,
                    tax_code: item.tax_code,
                    tax_amount: Some(item.tax_amount),
                    project_id: None,
                    department_id: None,
                }).collect(),
                additional_data: bill.additional_data,
            };
            transactions.push(transaction);
        }

        transactions
    }

    /// Transform accounting data to reconciliation format
    async fn transform_accounting_data(
        &self,
        config_id: Uuid,
        transactions: Vec<AccountingTransaction>,
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
                transaction_date: Some(transaction.date),
                description: Some(transaction.description),
                source_data: serde_json::to_string(&transaction).unwrap_or_default(),
                matching_results: "{}".to_string(),
                confidence: None,
                audit_trail: "{}".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            // Apply accounting-specific transformations
            self.apply_accounting_transformations(&mut record, &transaction)?;

            reconciliation_records.push(record);
        }

        Ok(reconciliation_records)
    }

    /// Apply accounting-specific transformations
    fn apply_accounting_transformations(
        &self,
        record: &mut ReconciliationRecord,
        transaction: &AccountingTransaction,
    ) -> AppResult<()> {
        // Add accounting-specific metadata to source_data
        let mut source_data: serde_json::Value = serde_json::from_str(&record.source_data).unwrap_or(serde_json::Value::Object(serde_json::Map::new()));
        
        if let Some(obj) = source_data.as_object_mut() {
            obj.insert("transaction_type".to_string(), serde_json::to_value(&transaction.transaction_type).unwrap_or(serde_json::Value::Null));
            obj.insert("currency".to_string(), serde_json::Value::String(transaction.currency.clone()));
            obj.insert("account_code".to_string(), serde_json::Value::String(transaction.account_code.clone()));
            obj.insert("account_name".to_string(), serde_json::Value::String(transaction.account_name.clone()));
            
            if let Some(reference) = &transaction.reference {
                obj.insert("reference".to_string(), serde_json::Value::String(reference.clone()));
            }
            
            if let Some(customer_id) = &transaction.customer_id {
                obj.insert("customer_id".to_string(), serde_json::Value::String(customer_id.clone()));
            }
            
            if let Some(vendor_id) = &transaction.vendor_id {
                obj.insert("vendor_id".to_string(), serde_json::Value::String(vendor_id.clone()));
            }
            
            if let Some(invoice_id) = &transaction.invoice_id {
                obj.insert("invoice_id".to_string(), serde_json::Value::String(invoice_id.clone()));
            }
            
            if let Some(bill_id) = &transaction.bill_id {
                obj.insert("bill_id".to_string(), serde_json::Value::String(bill_id.clone()));
            }
        }

        record.source_data = serde_json::to_string(&source_data).unwrap_or_default();
        Ok(())
    }

    /// Validate accounting data quality
    async fn validate_accounting_data(&self, records: &[ReconciliationRecord]) -> AppResult<DataQualityReport> {
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

            // Check accounting-specific validations
            if let Some(amount) = record.amount {
                if amount == 0.0 {
                    warnings.push(format!("Record {}: Zero amount transaction", index));
                    record_score -= 0.05;
                }
            }

            // Check for proper account codes
            if let Ok(source_data) = serde_json::from_str::<serde_json::Value>(&record.source_data) {
                if let Some(account_code) = source_data.get("account_code") {
                    if let Some(code_str) = account_code.as_str() {
                        if code_str.is_empty() {
                            warnings.push(format!("Record {}: Empty account code", index));
                            record_score -= 0.1;
                        }
                    }
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
    async fn refresh_token(&mut self, config_id: Uuid) -> AppResult<()> {
        tracing::info!("Refreshing access token for accounting software configuration {}", config_id);
        // Implementation would depend on the specific accounting software's token refresh mechanism
        Ok(())
    }

    /// Build API URL for accounting software
    fn build_api_url(&self, config: &AccountingSoftwareConfig, endpoint: &str) -> AppResult<String> {
        let base_url = config.base_url.trim_end_matches('/');
        let api_version = &config.api_version;
        Ok(format!("{}/api/{}/{}", base_url, api_version, endpoint))
    }
}

/// Accounting sync configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountingSyncConfig {
    pub from_date: chrono::NaiveDate,
    pub to_date: chrono::NaiveDate,
    pub sync_transactions: bool,
    pub sync_invoices: bool,
    pub sync_bills: bool,
    pub transaction_filters: HashMap<String, String>,
    pub invoice_status_filter: Option<InvoiceStatus>,
    pub bill_status_filter: Option<BillStatus>,
    pub mapping_config_id: Option<Uuid>,
    pub sync_frequency: SyncFrequency,
    pub is_automated: bool,
}

/// Accounting sync result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountingSyncResult {
    pub config_id: Uuid,
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
