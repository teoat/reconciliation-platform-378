//! Service layer tests for Health Checkers
//!
//! Tests DatabaseHealthChecker, RedisHealthChecker, and SystemHealthChecker.

use reconciliation_backend::services::monitoring::health::{
    DatabaseHealthChecker, RedisHealthChecker, SystemHealthChecker,
};
use reconciliation_backend::services::monitoring::types::HealthChecker;

/// Test Health Checker implementations
#[cfg(test)]
mod monitoring_health_tests {
    use super::*;

    #[test]
    fn test_database_health_checker_creation() {
        let checker = DatabaseHealthChecker::new();
        
        let name = checker.name();
        assert_eq!(name, "database");
    }

    #[test]
    fn test_database_health_checker_check() {
        let checker = DatabaseHealthChecker::new();
        
        let health_check = checker.check();
        assert_eq!(health_check.name, "database");
        assert!(health_check.message.is_some());
    }

    #[test]
    fn test_database_health_checker_default() {
        let checker = DatabaseHealthChecker::default();
        
        let name = checker.name();
        assert_eq!(name, "database");
    }

    #[test]
    fn test_redis_health_checker_creation() {
        let checker = RedisHealthChecker::new();
        
        let name = checker.name();
        assert_eq!(name, "redis");
    }

    #[test]
    fn test_redis_health_checker_check() {
        let checker = RedisHealthChecker::new();
        
        let health_check = checker.check();
        assert_eq!(health_check.name, "redis");
        assert!(health_check.message.is_some());
    }

    #[test]
    fn test_redis_health_checker_default() {
        let checker = RedisHealthChecker::default();
        
        let name = checker.name();
        assert_eq!(name, "redis");
    }

    #[test]
    fn test_system_health_checker_creation() {
        let checker = SystemHealthChecker::new();
        
        let name = checker.name();
        assert_eq!(name, "system");
    }

    #[test]
    fn test_system_health_checker_check() {
        let checker = SystemHealthChecker::new();
        
        let health_check = checker.check();
        assert_eq!(health_check.name, "system");
        assert!(health_check.message.is_some());
        assert!(health_check.details.is_some());
    }

    #[test]
    fn test_system_health_checker_default() {
        let checker = SystemHealthChecker::default();
        
        let name = checker.name();
        assert_eq!(name, "system");
    }

    #[test]
    fn test_all_health_checkers() {
        let db_checker = DatabaseHealthChecker::new();
        let redis_checker = RedisHealthChecker::new();
        let system_checker = SystemHealthChecker::new();

        let db_check = db_checker.check();
        let redis_check = redis_checker.check();
        let system_check = system_checker.check();

        assert_eq!(db_check.name, "database");
        assert_eq!(redis_check.name, "redis");
        assert_eq!(system_check.name, "system");
    }
}

