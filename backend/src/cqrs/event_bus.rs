//! Event Bus for Event-Driven Architecture
//!
//! Provides a publish-subscribe event system for decoupling services.

use crate::errors::AppResult;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::Debug;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Event trait - all events must implement this
pub trait Event: Send + Sync + Debug + Clone + 'static {
    /// Event name for logging and debugging
    fn name(&self) -> &'static str;
}

/// Event handler trait
pub trait EventHandler<E: Event>: Send + Sync {
    /// Handle an event
    async fn handle(&self, event: E) -> AppResult<()>;
}

/// Type-erased event handler trait
trait ErasedEventHandler: Send + Sync {
    fn handle_boxed(&self, event_name: &str) -> AppResult<()>;
}

/// Handler wrapper for type erasure
struct HandlerWrapper<E: Event, H: EventHandler<E>> {
    handler: Arc<H>,
    _phantom: std::marker::PhantomData<E>,
}

impl<E: Event, H: EventHandler<E>> ErasedEventHandler for HandlerWrapper<E, H> {
    fn handle_boxed(&self, event_name: &str) -> AppResult<()> {
        log::info!("Handler called for event: {}", event_name);
        // Note: In a real implementation, you'd need to properly deserialize the event
        // For now, this is a placeholder that logs the event
        Ok(())
    }
}

/// Event bus implementation using type-erased handlers
pub struct EventBus {
    // Store handlers by event type name (simplified approach)
    // In production, consider using a more type-safe approach
    handlers: Arc<RwLock<HashMap<String, Vec<Arc<dyn ErasedEventHandler>>>>>,
}

impl EventBus {
    /// Create a new event bus
    pub fn new() -> Self {
        Self {
            handlers: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Subscribe to an event type
    pub async fn subscribe<E: Event + Default, H: EventHandler<E> + 'static>(&self, handler: Arc<H>) {
        let event_name = E::name(&E::default()); // Get event name from type
        
        let handler_wrapper = Arc::new(HandlerWrapper {
            handler,
            _phantom: std::marker::PhantomData,
        });

        let mut handlers = self.handlers.write().await;
        handlers
            .entry(event_name.to_string())
            .or_insert_with(Vec::new)
            .push(handler_wrapper);
    }

    /// Publish an event
    pub async fn publish<E: Event>(&self, event: E) -> AppResult<()> {
        let event_name = event.name();
        let handlers = self.handlers.read().await;

        if let Some(event_handlers) = handlers.get(event_name) {
            log::info!("Publishing event: {} to {} handlers", event_name, event_handlers.len());
            for handler in event_handlers {
                if let Err(e) = handler.handle_boxed(event_name) {
                    log::error!("Error handling event {}: {}", event_name, e);
                }
            }
        } else {
            log::debug!("No handlers registered for event: {}", event_name);
        }

        Ok(())
    }
}

impl Default for EventBus {
    fn default() -> Self {
        Self::new()
    }
}

/// Example event implementations

/// Project created event
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProjectCreatedEvent {
    pub project_id: uuid::Uuid,
    pub name: String,
    pub owner_id: uuid::Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl Event for ProjectCreatedEvent {
    fn name(&self) -> &'static str {
        "ProjectCreated"
    }
}

/// Project updated event
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProjectUpdatedEvent {
    pub project_id: uuid::Uuid,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl Event for ProjectUpdatedEvent {
    fn name(&self) -> &'static str {
        "ProjectUpdated"
    }
}

/// Project deleted event
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProjectDeletedEvent {
    pub project_id: uuid::Uuid,
    pub deleted_at: chrono::DateTime<chrono::Utc>,
}

impl Event for ProjectDeletedEvent {
    fn name(&self) -> &'static str {
        "ProjectDeleted"
    }
}

