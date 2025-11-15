// Webhook Management System Prototype
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize)]
pub struct Webhook {
    pub id: Uuid,
    pub url: String,
    pub events: Vec<String>,
    pub secret: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookEvent {
    pub id: Uuid,
    pub event_type: String,
    pub data: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub webhook_id: Uuid,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookDelivery {
    pub id: Uuid,
    pub webhook_id: Uuid,
    pub event_id: Uuid,
    pub status: DeliveryStatus,
    pub response_code: Option<u16>,
    pub response_body: Option<String>,
    pub attempts: u32,
    pub created_at: DateTime<Utc>,
    pub delivered_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum DeliveryStatus {
    Pending,
    Delivered,
    Failed,
    Retrying,
}

pub struct WebhookManager {
    webhooks: HashMap<Uuid, Webhook>,
    events: Vec<WebhookEvent>,
    deliveries: Vec<WebhookDelivery>,
}

impl WebhookManager {
    pub fn new() -> Self {
        Self {
            webhooks: HashMap::new(),
            events: Vec::new(),
            deliveries: Vec::new(),
        }
    }
    
    pub async fn create_webhook(&mut self, url: String, events: Vec<String>) -> Uuid {
        let webhook = Webhook {
            id: Uuid::new_v4(),
            url,
            events,
            secret: self.generate_secret(),
            active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        
        let id = webhook.id;
        self.webhooks.insert(id, webhook);
        id
    }
    
    pub async fn trigger_event(&mut self, event_type: String, data: serde_json::Value) {
        let event = WebhookEvent {
            id: Uuid::new_v4(),
            event_type: event_type.clone(),
            data,
            timestamp: Utc::now(),
            webhook_id: Uuid::nil(), // Will be set per webhook
        };
        
        self.events.push(event.clone());
        
        // Find webhooks subscribed to this event
        for (webhook_id, webhook) in &self.webhooks {
            if webhook.active && webhook.events.contains(&event_type) {
                self.deliver_webhook(*webhook_id, event.id).await;
            }
        }
    }
    
    async fn deliver_webhook(&mut self, webhook_id: Uuid, event_id: Uuid) {
        let delivery = WebhookDelivery {
            id: Uuid::new_v4(),
            webhook_id,
            event_id,
            status: DeliveryStatus::Pending,
            response_code: None,
            response_body: None,
            attempts: 0,
            created_at: Utc::now(),
            delivered_at: None,
        };
        
        self.deliveries.push(delivery);
        
        // In production, this would make actual HTTP requests
        // For now, just simulate delivery
        self.simulate_delivery(webhook_id, event_id).await;
    }
    
    async fn simulate_delivery(&mut self, webhook_id: Uuid, event_id: Uuid) {
        // Simulate webhook delivery
        if let Some(delivery) = self.deliveries.iter_mut().find(|d| d.webhook_id == webhook_id && d.event_id == event_id) {
            delivery.attempts += 1;
            delivery.status = DeliveryStatus::Delivered;
            delivery.response_code = Some(200);
            delivery.response_body = Some("OK".to_string());
            delivery.delivered_at = Some(Utc::now());
        }
    }
    
    fn generate_secret(&self) -> String {
        // In production, use proper secret generation
        Uuid::new_v4().to_string()
    }
    
    pub fn get_webhook_stats(&self) -> WebhookStats {
        let total_webhooks = self.webhooks.len();
        let active_webhooks = self.webhooks.values().filter(|w| w.active).count();
        let total_events = self.events.len();
        let successful_deliveries = self.deliveries.iter().filter(|d| matches!(d.status, DeliveryStatus::Delivered)).count();
        let failed_deliveries = self.deliveries.iter().filter(|d| matches!(d.status, DeliveryStatus::Failed)).count();
        
        WebhookStats {
            total_webhooks,
            active_webhooks,
            total_events,
            successful_deliveries,
            failed_deliveries,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookStats {
    pub total_webhooks: usize,
    pub active_webhooks: usize,
    pub total_events: usize,
    pub successful_deliveries: usize,
    pub failed_deliveries: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_webhook_creation() {
        let mut manager = WebhookManager::new();
        
        let webhook_id = manager.create_webhook(
            "https://example.com/webhook".to_string(),
            vec!["reconciliation.completed".to_string()]
        ).await;
        
        assert!(!webhook_id.is_nil());
    }
    
    #[tokio::test]
    async fn test_webhook_delivery() {
        let mut manager = WebhookManager::new();
        
        let webhook_id = manager.create_webhook(
            "https://example.com/webhook".to_string(),
            vec!["reconciliation.completed".to_string()]
        ).await;
        
        manager.trigger_event(
            "reconciliation.completed".to_string(),
            serde_json::json!({"project_id": "123"})
        ).await;
        
        let stats = manager.get_webhook_stats();
        assert_eq!(stats.total_events, 1);
    }
}
