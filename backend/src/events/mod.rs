//! Event Sourcing Module
//! Event store, projection, and replay functionality

use std::collections::HashMap;

/// Event types
#[derive(Debug, Clone)]
pub enum EventType {
    UserCreated,
    UserUpdated,
    ProjectCreated,
    Custom(String),
}

/// Event structure
#[derive(Debug, Clone)]
pub struct Event {
    pub id: String,
    pub event_type: EventType,
    pub aggregate_id: String,
    pub data: HashMap<String, String>,
    pub timestamp: String,
}

/// Event store
pub struct EventStore {
    events: Vec<Event>,
}

impl EventStore {
    pub fn new() -> Self {
        Self { events: Vec::new() }
    }

    pub async fn append(&mut self, event: Event) {
        self.events.push(event);
    }

    pub async fn replay(&self, aggregate_id: &str) -> Vec<Event> {
        self.events
            .iter()
            .filter(|e| e.aggregate_id == aggregate_id)
            .cloned()
            .collect()
    }

    pub async fn project(&self) {
        // Projection logic
    }
}

