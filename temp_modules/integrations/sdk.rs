use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::utils::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SDKConfig {
    pub api_base_url: String,
    pub api_key: String,
    pub timeout_seconds: u64,
    pub retry_attempts: u32,
    pub user_agent: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationSDK {
    config: SDKConfig,
}

impl ReconciliationSDK {
    pub fn new(config: SDKConfig) -> Self {
        Self { config }
    }
    
    pub fn with_api_key(api_key: String, base_url: Option<String>) -> Self {
        let config = SDKConfig {
            api_base_url: base_url.unwrap_or_else(|| "http://localhost:8080".to_string()),
            api_key,
            timeout_seconds: 30,
            retry_attempts: 3,
            user_agent: "Reconciliation-SDK/1.0".to_string(),
        };
        
        Self::new(config)
    }
    
    // Project operations
    pub async fn create_project(&self, name: String, description: Option<String>) -> Result<ProjectResponse, AppError> {
        // Mock implementation
        Ok(ProjectResponse {
            id: Uuid::new_v4(),
            name,
            description,
            status: "active".to_string(),
            created_at: chrono::Utc::now(),
        })
    }
    
    pub async fn get_project(&self, project_id: Uuid) -> Result<ProjectResponse, AppError> {
        // Mock implementation
        Ok(ProjectResponse {
            id: project_id,
            name: "Sample Project".to_string(),
            description: Some("A sample project".to_string()),
            status: "active".to_string(),
            created_at: chrono::Utc::now(),
        })
    }
    
    pub async fn list_projects(&self) -> Result<Vec<ProjectResponse>, AppError> {
        // Mock implementation
        Ok(vec![
            ProjectResponse {
                id: Uuid::new_v4(),
                name: "Project 1".to_string(),
                description: Some("First project".to_string()),
                status: "active".to_string(),
                created_at: chrono::Utc::now(),
            },
            ProjectResponse {
                id: Uuid::new_v4(),
                name: "Project 2".to_string(),
                description: Some("Second project".to_string()),
                status: "active".to_string(),
                created_at: chrono::Utc::now(),
            },
        ])
    }
    
    // Reconciliation operations
    pub async fn create_reconciliation_record(&self, project_id: Uuid, data: ReconciliationData) -> Result<ReconciliationRecordResponse, AppError> {
        // Mock implementation
        Ok(ReconciliationRecordResponse {
            id: Uuid::new_v4(),
            project_id,
            external_id: data.external_id,
            status: "pending".to_string(),
            amount: data.amount,
            created_at: chrono::Utc::now(),
        })
    }
    
    pub async fn get_reconciliation_record(&self, record_id: Uuid) -> Result<ReconciliationRecordResponse, AppError> {
        // Mock implementation
        Ok(ReconciliationRecordResponse {
            id: record_id,
            project_id: Uuid::new_v4(),
            external_id: "EXT-123".to_string(),
            status: "matched".to_string(),
            amount: 1000.50,
            created_at: chrono::Utc::now(),
        })
    }
    
    pub async fn list_reconciliation_records(&self, project_id: Uuid) -> Result<Vec<ReconciliationRecordResponse>, AppError> {
        // Mock implementation
        Ok(vec![
            ReconciliationRecordResponse {
                id: Uuid::new_v4(),
                project_id,
                external_id: "EXT-001".to_string(),
                status: "matched".to_string(),
                amount: 500.25,
                created_at: chrono::Utc::now(),
            },
            ReconciliationRecordResponse {
                id: Uuid::new_v4(),
                project_id,
                external_id: "EXT-002".to_string(),
                status: "pending".to_string(),
                amount: 750.75,
                created_at: chrono::Utc::now(),
            },
        ])
    }
    
    // File upload operations
    pub async fn upload_file(&self, project_id: Uuid, file_path: String) -> Result<FileUploadResponse, AppError> {
        // Mock implementation
        Ok(FileUploadResponse {
            id: Uuid::new_v4(),
            project_id,
            filename: file_path,
            status: "uploaded".to_string(),
            created_at: chrono::Utc::now(),
        })
    }
    
    // Analytics operations
    pub async fn get_project_analytics(&self, project_id: Uuid) -> Result<ProjectAnalytics, AppError> {
        // Mock implementation
        Ok(ProjectAnalytics {
            project_id,
            total_records: 150,
            matched_records: 120,
            unmatched_records: 30,
            total_amount: 50000.0,
            matched_amount: 45000.0,
            unmatched_amount: 5000.0,
            match_rate: 80.0,
            last_updated: chrono::Utc::now(),
        })
    }
}

// Response types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationData {
    pub external_id: String,
    pub amount: f64,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationRecordResponse {
    pub id: Uuid,
    pub project_id: Uuid,
    pub external_id: String,
    pub status: String,
    pub amount: f64,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileUploadResponse {
    pub id: Uuid,
    pub project_id: Uuid,
    pub filename: String,
    pub status: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectAnalytics {
    pub project_id: Uuid,
    pub total_records: u32,
    pub matched_records: u32,
    pub unmatched_records: u32,
    pub total_amount: f64,
    pub matched_amount: f64,
    pub unmatched_amount: f64,
    pub match_rate: f64,
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

// Webhook management
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookConfig {
    pub url: String,
    pub events: Vec<String>,
    pub secret: Option<String>,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebhookEvent {
    pub id: Uuid,
    pub event_type: String,
    pub data: serde_json::Value,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub retry_count: u32,
}

pub struct WebhookService {
    webhooks: Vec<WebhookConfig>,
}

impl WebhookService {
    pub fn new() -> Self {
        Self {
            webhooks: Vec::new(),
        }
    }
    
    pub fn register_webhook(&mut self, config: WebhookConfig) -> Result<(), AppError> {
        self.webhooks.push(config);
        Ok(())
    }
    
    pub fn unregister_webhook(&mut self, url: &str) -> Result<(), AppError> {
        self.webhooks.retain(|webhook| webhook.url != url);
        Ok(())
    }
    
    pub async fn send_webhook(&self, event: WebhookEvent) -> Result<(), AppError> {
        for webhook in &self.webhooks {
            if webhook.active && webhook.events.contains(&event.event_type) {
                // In a real implementation, you would send HTTP requests
                println!("Sending webhook to {}: {:?}", webhook.url, event);
            }
        }
        Ok(())
    }
    
    pub fn list_webhooks(&self) -> &Vec<WebhookConfig> {
        &self.webhooks
    }
}

impl Default for WebhookService {
    fn default() -> Self {
        Self::new()
    }
}
