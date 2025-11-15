//! Monitoring and metrics service
//!
//! This module provides comprehensive monitoring, metrics collection,
//! health checks, and alerting functionality.

pub mod types;
pub mod metrics;
pub mod service;
pub mod health;
pub mod alerts;

pub use types::*;
pub use metrics::*;
pub use service::MonitoringService;
pub use health::{DatabaseHealthChecker, RedisHealthChecker, SystemHealthChecker};
pub use alerts::AlertManager;

