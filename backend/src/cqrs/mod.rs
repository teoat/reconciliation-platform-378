//! CQRS (Command Query Responsibility Segregation) Module
//!
//! Implements command/query separation for read-heavy operations,
//! reducing interdependencies and improving performance.

pub mod command;
pub mod query;
pub mod event_bus;
pub mod handlers;

pub use command::{Command, CommandHandler, CommandResult};
pub use query::{Query, QueryHandler, QueryResult};
pub use event_bus::{EventBus, Event, EventHandler};

