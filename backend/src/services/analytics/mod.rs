//! Analytics service
//!
//! This module provides analytics and reporting functionality including
//! data collection, metrics calculation, and dashboard data generation.

pub mod types;
pub mod collector;
pub mod processor;
pub mod service;

pub use types::*;
pub use collector::AnalyticsCollector;
pub use processor::AnalyticsProcessor;
pub use service::AnalyticsService;


