# CQRS and Event-Driven Architecture

**Last Updated**: November 26, 2025  
**Status**: ✅ Implemented

## Overview

The Reconciliation Platform now implements CQRS (Command Query Responsibility Segregation) and Event-Driven Architecture patterns to reduce interdependencies and improve performance.

## Architecture

### CQRS Pattern

**Location**: `backend/src/cqrs/`

- **Commands**: Write operations that modify state (`backend/src/cqrs/command.rs`)
- **Queries**: Read operations that don't modify state (`backend/src/cqrs/query.rs`)
- **Handlers**: Command and query handlers (`backend/src/cqrs/handlers.rs`)

### Event-Driven Architecture

**Location**: `backend/src/cqrs/event_bus.rs`

- **Event Bus**: Publish-subscribe event system
- **Events**: Domain events (ProjectCreated, ProjectUpdated, etc.)
- **Event Handlers**: Async handlers for events

### Service Registry

**Location**: `backend/src/services/registry.rs`

- **Dependency Injection**: Centralized service registry
- **Reduced Coupling**: Services access dependencies through registry
- **Global Registry**: Thread-safe global service registry

## Usage

### Commands

```rust
use crate::cqrs::command::{CreateProjectCommand, CommandHandler};
use crate::cqrs::handlers::ProjectCommandHandler;

let handler = ProjectCommandHandler::new();
let command = CreateProjectCommand {
    name: "My Project".to_string(),
    description: None,
    owner_id: user_id,
};

handler.handle(command).await?;
```

### Queries

```rust
use crate::cqrs::query::{GetProjectQuery, QueryHandler};
use crate::cqrs::handlers::ProjectQueryHandler;

let handler = ProjectQueryHandler::new();
let query = GetProjectQuery {
    project_id: project_id,
};

let project = handler.handle(query).await?;
```

### Events

```rust
use crate::cqrs::event_bus::{EventBus, ProjectCreatedEvent, Event};

let event_bus = EventBus::new();
let event = ProjectCreatedEvent {
    project_id,
    name: "My Project".to_string(),
    owner_id,
    created_at: Utc::now(),
};

event_bus.publish(event).await?;
```

### Service Registry

```rust
use crate::services::registry::{ServiceRegistry, GlobalServiceRegistry};

let registry = ServiceRegistry::new(database, cache, resilience);
let global_registry = GlobalServiceRegistry::new();
global_registry.initialize(registry).await;

// Later, access services
let db = global_registry.database().await;
```

## Benefits

1. **Reduced Interdependencies**: Services access dependencies through registry
2. **Better Performance**: Read operations optimized separately from writes
3. **Event-Driven**: Decoupled services through events
4. **Scalability**: Commands and queries can scale independently

## Migration Path

1. Identify read-heavy operations → Convert to queries
2. Identify write operations → Convert to commands
3. Identify cross-service communication → Use events
4. Refactor services → Use service registry

## Related Documentation

- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

