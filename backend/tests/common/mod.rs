//! Common test utilities and helpers

use reconciliation_backend::database::Database;
use reconciliation_backend::services::cache::MultiLevelCache;
use std::sync::Arc;

/// Create a test database instance
pub fn create_test_database() -> Database {
    // In a real implementation, this would create a test database
    // For now, this is a placeholder
    Database::new("postgresql://test:test@localhost/test_db")
        .expect("Failed to create test database")
}

/// Create a test cache instance
pub fn create_test_cache() -> Arc<MultiLevelCache> {
    Arc::new(MultiLevelCache::new())
}

/// Setup test environment
pub fn setup_test() {
    // Initialize test environment
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("test"))
        .init();
}

/// Teardown test environment
pub fn teardown_test() {
    // Cleanup test environment
}

