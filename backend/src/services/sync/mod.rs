//! SQL Data Synchronization Service
//!
//! Provides systematic integration and optimized synchronization of SQL data and tables.
//! Supports full sync, incremental sync, conflict resolution, and multi-table orchestration.

pub mod core;
pub mod orchestration;
pub mod conflict_resolution;
pub mod change_tracking;
pub mod models;

pub use core::SyncService;
pub use orchestration::SyncOrchestrator;
pub use conflict_resolution::ConflictResolver;
pub use change_tracking::ChangeTracker;

// Models are available via crate::services::sync::models
// (no additional public re-exports to avoid visibility issues)

