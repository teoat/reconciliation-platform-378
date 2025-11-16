//! Monitoring and metrics service
//!
//! This module provides comprehensive monitoring, metrics collection,
//! health checks, and alerting functionality.

pub mod alerts;
pub mod health;
pub mod metrics;
pub mod service;
pub mod types;

pub use alerts::AlertManager;
pub use health::{DatabaseHealthChecker, RedisHealthChecker, SystemHealthChecker};
pub use metrics::*;
pub use service::MonitoringService;
pub use types::*;
