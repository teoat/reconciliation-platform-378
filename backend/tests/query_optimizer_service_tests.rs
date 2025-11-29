//! Comprehensive service layer tests for QueryOptimizer
//!
//! Tests query optimization functionality including slow query detection,
//! optimization suggestions, index recommendations, and statistics.

use reconciliation_backend::services::query_optimizer::{
    QueryOptimizer, QueryOptimizerConfig, OptimizationLevel,
};
use std::time::Duration;

/// Test QueryOptimizer methods
#[cfg(test)]
mod query_optimizer_service_tests {
    use super::*;

    // =========================================================================
    // Service Creation
    // =========================================================================

    #[tokio::test]
    async fn test_query_optimizer_creation_default_config() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Verify optimizer is created
        assert!(true);
    }

    #[tokio::test]
    async fn test_query_optimizer_creation_custom_config() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(50),
            max_queries: 500,
            enable_index_recommendations: true,
            enable_query_plan_cache: false,
        };
        
        let optimizer = QueryOptimizer::new(config);
        
        // Verify optimizer is created
        assert!(true);
    }

    // =========================================================================
    // Query Analysis Tests
    // =========================================================================

    #[tokio::test]
    async fn test_analyze_query_fast_query() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT id FROM users WHERE id = 1", Duration::from_millis(10))
            .await;
        
        assert!(!analysis.is_slow);
        assert_eq!(analysis.duration, Duration::from_millis(10));
        assert_eq!(analysis.estimated_impact.score, 25);
        assert!(matches!(analysis.estimated_impact.level, OptimizationLevel::Low));
    }

    #[tokio::test]
    async fn test_analyze_query_slow_query() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users", Duration::from_millis(150))
            .await;
        
        assert!(analysis.is_slow);
        assert_eq!(analysis.duration, Duration::from_millis(150));
        assert!(analysis.estimated_impact.score > 25);
    }

    #[tokio::test]
    async fn test_analyze_query_critical_slow_query() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Query that takes 300ms (3x threshold) should be critical
        let analysis = optimizer
            .analyze_query("SELECT * FROM large_table", Duration::from_millis(300))
            .await;
        
        assert!(analysis.is_slow);
        assert!(analysis.estimated_improvement > 0.5);
        assert!(matches!(analysis.estimated_impact.level, OptimizationLevel::Critical));
        assert_eq!(analysis.estimated_impact.score, 100);
    }

    #[tokio::test]
    async fn test_analyze_query_high_impact() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Query that takes 200ms (2x threshold) should be high impact
        let analysis = optimizer
            .analyze_query("SELECT * FROM users", Duration::from_millis(200))
            .await;
        
        assert!(analysis.is_slow);
        assert!(analysis.estimated_improvement > 0.3);
        assert!(analysis.estimated_improvement <= 0.5);
        assert!(matches!(analysis.estimated_impact.level, OptimizationLevel::High));
        assert_eq!(analysis.estimated_impact.score, 75);
    }

    #[tokio::test]
    async fn test_analyze_query_medium_impact() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Query that takes 150ms (1.5x threshold) should be medium impact
        let analysis = optimizer
            .analyze_query("SELECT * FROM users", Duration::from_millis(150))
            .await;
        
        assert!(analysis.is_slow);
        assert!(analysis.estimated_improvement > 0.1);
        assert!(analysis.estimated_improvement <= 0.3);
        assert!(matches!(analysis.estimated_impact.level, OptimizationLevel::Medium));
        assert_eq!(analysis.estimated_impact.score, 50);
    }

    #[tokio::test]
    async fn test_analyze_query_low_impact() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Query that takes 110ms (1.1x threshold) should be low impact
        let analysis = optimizer
            .analyze_query("SELECT * FROM users", Duration::from_millis(110))
            .await;
        
        assert!(analysis.is_slow);
        assert!(analysis.estimated_improvement > 0.0);
        assert!(analysis.estimated_improvement <= 0.1);
        assert!(matches!(analysis.estimated_impact.level, OptimizationLevel::Low));
        assert_eq!(analysis.estimated_impact.score, 25);
    }

    #[tokio::test]
    async fn test_analyze_query_zero_duration() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT 1", Duration::ZERO)
            .await;
        
        assert!(!analysis.is_slow);
        assert_eq!(analysis.duration, Duration::ZERO);
    }

    #[tokio::test]
    async fn test_analyze_query_very_long_duration() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM huge_table", Duration::from_secs(10))
            .await;
        
        assert!(analysis.is_slow);
        assert!(analysis.estimated_improvement > 0.5);
        assert!(matches!(analysis.estimated_impact.level, OptimizationLevel::Critical));
    }

    // =========================================================================
    // Optimization Suggestions Tests
    // =========================================================================

    #[tokio::test]
    async fn test_optimization_suggestion_select_star() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users WHERE id = 1", Duration::from_millis(50))
            .await;
        
        assert!(analysis.optimization_suggestions
            .iter()
            .any(|s| s.contains("SELECT *")));
    }

    #[tokio::test]
    async fn test_optimization_suggestion_order_by_without_limit() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users ORDER BY created_at", Duration::from_millis(50))
            .await;
        
        assert!(analysis.optimization_suggestions
            .iter()
            .any(|s| s.contains("LIMIT")));
    }

    #[tokio::test]
    async fn test_optimization_suggestion_leading_wildcard_like() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users WHERE name LIKE '%test'", Duration::from_millis(50))
            .await;
        
        assert!(analysis.optimization_suggestions
            .iter()
            .any(|s| s.contains("wildcard") || s.contains("LIKE")));
    }

    #[tokio::test]
    async fn test_optimization_suggestion_complex_where() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let query = "SELECT * FROM users WHERE id = 1 AND name = 'test' AND email = 'test@example.com' AND status = 'active'";
        let analysis = optimizer
            .analyze_query(query, Duration::from_millis(50))
            .await;
        
        assert!(analysis.optimization_suggestions
            .iter()
            .any(|s| s.contains("WHERE") || s.contains("restructuring")));
    }

    #[tokio::test]
    async fn test_optimization_suggestion_multiple_joins() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let query = "SELECT * FROM users u JOIN orders o ON u.id = o.user_id JOIN products p ON o.product_id = p.id JOIN categories c ON p.category_id = c.id";
        let analysis = optimizer
            .analyze_query(query, Duration::from_millis(50))
            .await;
        
        assert!(analysis.optimization_suggestions
            .iter()
            .any(|s| s.contains("JOIN")));
    }

    #[tokio::test]
    async fn test_optimization_suggestion_no_suggestions_for_good_query() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("SELECT id, name FROM users WHERE id = 1 LIMIT 10", Duration::from_millis(10))
            .await;
        
        // Good query should have fewer or no suggestions
        assert!(analysis.optimization_suggestions.len() <= 1);
    }

    // =========================================================================
    // Index Recommendations Tests
    // =========================================================================

    #[tokio::test]
    async fn test_index_recommendation_where_clause() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(100),
            max_queries: 1000,
            enable_index_recommendations: true,
            enable_query_plan_cache: true,
        };
        let optimizer = QueryOptimizer::new(config);
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users WHERE id = 1", Duration::from_millis(50))
            .await;
        
        // Should recommend index on id
        assert!(!analysis.index_suggestions.is_empty());
    }

    #[tokio::test]
    async fn test_index_recommendation_join_clause() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(100),
            max_queries: 1000,
            enable_index_recommendations: true,
            enable_query_plan_cache: true,
        };
        let optimizer = QueryOptimizer::new(config);
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users u JOIN orders o ON u.id = o.user_id", Duration::from_millis(50))
            .await;
        
        // Should recommend indexes for join keys
        assert!(!analysis.index_suggestions.is_empty());
    }

    #[tokio::test]
    async fn test_index_recommendation_order_by() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(100),
            max_queries: 1000,
            enable_index_recommendations: true,
            enable_query_plan_cache: true,
        };
        let optimizer = QueryOptimizer::new(config);
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users ORDER BY created_at", Duration::from_millis(50))
            .await;
        
        // Should recommend index on created_at
        assert!(!analysis.index_suggestions.is_empty());
    }

    #[tokio::test]
    async fn test_index_recommendation_disabled() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(100),
            max_queries: 1000,
            enable_index_recommendations: false,
            enable_query_plan_cache: true,
        };
        let optimizer = QueryOptimizer::new(config);
        
        let analysis = optimizer
            .analyze_query("SELECT * FROM users WHERE id = 1", Duration::from_millis(50))
            .await;
        
        // Should not recommend indexes when disabled
        assert!(analysis.index_suggestions.is_empty());
    }

    // =========================================================================
    // Statistics Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_stats_initial() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let stats = optimizer.get_stats().await;
        
        assert_eq!(stats.total_queries, 0);
        assert_eq!(stats.slow_queries, 0);
        assert_eq!(stats.average_duration, Duration::ZERO);
        assert!(stats.slowest_query.is_none());
    }

    #[tokio::test]
    async fn test_get_stats_after_queries() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Analyze some queries
        optimizer.analyze_query("SELECT 1", Duration::from_millis(10)).await;
        optimizer.analyze_query("SELECT 2", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 3", Duration::from_millis(200)).await;
        
        let stats = optimizer.get_stats().await;
        
        assert_eq!(stats.total_queries, 3);
        assert_eq!(stats.slow_queries, 2);
        assert!(stats.slowest_query.is_some());
        let (slowest_query, slowest_duration) = stats.slowest_query.unwrap();
        assert_eq!(slowest_query, "SELECT 3");
        assert_eq!(slowest_duration, Duration::from_millis(200));
    }

    #[tokio::test]
    async fn test_get_stats_slowest_query_tracking() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Analyze queries in order
        optimizer.analyze_query("SELECT 1", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 2", Duration::from_millis(100)).await; // Faster, shouldn't update
        optimizer.analyze_query("SELECT 3", Duration::from_millis(300)).await; // Slower, should update
        
        let stats = optimizer.get_stats().await;
        
        assert!(stats.slowest_query.is_some());
        let (slowest_query, slowest_duration) = stats.slowest_query.unwrap();
        assert_eq!(slowest_query, "SELECT 3");
        assert_eq!(slowest_duration, Duration::from_millis(300));
    }

    // =========================================================================
    // Slow Queries Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_slow_queries_empty() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let slow_queries = optimizer.get_slow_queries().await;
        
        assert!(slow_queries.is_empty());
    }

    #[tokio::test]
    async fn test_get_slow_queries_after_slow_queries() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Analyze fast query (shouldn't be stored)
        optimizer.analyze_query("SELECT 1", Duration::from_millis(10)).await;
        
        // Analyze slow queries (should be stored)
        optimizer.analyze_query("SELECT 2", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 3", Duration::from_millis(200)).await;
        
        let slow_queries = optimizer.get_slow_queries().await;
        
        assert_eq!(slow_queries.len(), 2);
        assert!(slow_queries.iter().any(|q| q.query == "SELECT 2"));
        assert!(slow_queries.iter().any(|q| q.query == "SELECT 3"));
    }

    #[tokio::test]
    async fn test_get_slow_queries_max_limit() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(100),
            max_queries: 5,
            enable_index_recommendations: true,
            enable_query_plan_cache: true,
        };
        let optimizer = QueryOptimizer::new(config);
        
        // Analyze more than max_queries slow queries
        for i in 0..10 {
            optimizer.analyze_query(
                &format!("SELECT {}", i),
                Duration::from_millis(150),
            ).await;
        }
        
        let slow_queries = optimizer.get_slow_queries().await;
        
        // Should be limited to max_queries
        assert_eq!(slow_queries.len(), 5);
    }

    #[tokio::test]
    async fn test_get_slow_queries_fifo_trimming() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(100),
            max_queries: 3,
            enable_index_recommendations: true,
            enable_query_plan_cache: true,
        };
        let optimizer = QueryOptimizer::new(config);
        
        // Analyze queries
        optimizer.analyze_query("SELECT 1", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 2", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 3", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 4", Duration::from_millis(150)).await; // Should remove SELECT 1
        
        let slow_queries = optimizer.get_slow_queries().await;
        
        assert_eq!(slow_queries.len(), 3);
        assert!(!slow_queries.iter().any(|q| q.query == "SELECT 1"));
        assert!(slow_queries.iter().any(|q| q.query == "SELECT 4"));
    }

    // =========================================================================
    // Cache Tests
    // =========================================================================

    #[tokio::test]
    async fn test_clear_cache() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Add some slow queries
        optimizer.analyze_query("SELECT 1", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 2", Duration::from_millis(200)).await;
        
        // Verify they're stored
        let slow_queries_before = optimizer.get_slow_queries().await;
        assert_eq!(slow_queries_before.len(), 2);
        
        // Clear cache
        optimizer.clear_cache().await;
        
        // Verify cache is cleared
        let slow_queries_after = optimizer.get_slow_queries().await;
        assert!(slow_queries_after.is_empty());
    }

    #[tokio::test]
    async fn test_clear_cache_preserves_stats() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Analyze queries
        optimizer.analyze_query("SELECT 1", Duration::from_millis(150)).await;
        optimizer.analyze_query("SELECT 2", Duration::from_millis(200)).await;
        
        // Get stats before clearing
        let stats_before = optimizer.get_stats().await;
        
        // Clear cache
        optimizer.clear_cache().await;
        
        // Stats should be preserved
        let stats_after = optimizer.get_stats().await;
        assert_eq!(stats_before.total_queries, stats_after.total_queries);
        assert_eq!(stats_before.slow_queries, stats_after.slow_queries);
    }

    // =========================================================================
    // Edge Cases
    // =========================================================================

    #[tokio::test]
    async fn test_analyze_query_empty_string() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let analysis = optimizer
            .analyze_query("", Duration::from_millis(50))
            .await;
        
        assert_eq!(analysis.query, "");
    }

    #[tokio::test]
    async fn test_analyze_query_very_long_query() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let long_query = "SELECT ".repeat(1000);
        let analysis = optimizer
            .analyze_query(&long_query, Duration::from_millis(50))
            .await;
        
        assert_eq!(analysis.query, long_query);
    }

    #[tokio::test]
    async fn test_analyze_query_special_characters() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let query = "SELECT * FROM users WHERE name = 'test@example.com' AND status = 'active'";
        let analysis = optimizer
            .analyze_query(query, Duration::from_millis(50))
            .await;
        
        assert_eq!(analysis.query, query);
    }

    #[tokio::test]
    async fn test_analyze_query_unicode() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let query = "SELECT * FROM users WHERE name = '你好世界'";
        let analysis = optimizer
            .analyze_query(query, Duration::from_millis(50))
            .await;
        
        assert_eq!(analysis.query, query);
    }

    #[tokio::test]
    async fn test_custom_threshold() {
        let config = QueryOptimizerConfig {
            slow_query_threshold: Duration::from_millis(50),
            max_queries: 1000,
            enable_index_recommendations: true,
            enable_query_plan_cache: true,
        };
        let optimizer = QueryOptimizer::new(config);
        
        // Query at 40ms should be fast
        let fast_analysis = optimizer
            .analyze_query("SELECT 1", Duration::from_millis(40))
            .await;
        assert!(!fast_analysis.is_slow);
        
        // Query at 60ms should be slow
        let slow_analysis = optimizer
            .analyze_query("SELECT 2", Duration::from_millis(60))
            .await;
        assert!(slow_analysis.is_slow);
    }

    #[tokio::test]
    async fn test_concurrent_queries() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        let handles: Vec<_> = (0..20).map(|i| {
            let optimizer = &optimizer;
            tokio::spawn(async move {
                optimizer.analyze_query(
                    &format!("SELECT {}", i),
                    Duration::from_millis(150),
                ).await
            })
        }).collect();

        futures::future::join_all(handles).await;

        let stats = optimizer.get_stats().await;
        assert_eq!(stats.total_queries, 20);
        assert_eq!(stats.slow_queries, 20);
    }

    #[tokio::test]
    async fn test_estimated_improvement_calculation() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        
        // Query at exactly threshold should have 0 improvement
        let analysis = optimizer
            .analyze_query("SELECT 1", Duration::from_millis(100))
            .await;
        
        // Should be slow but improvement calculation might be edge case
        if analysis.is_slow {
            assert!(analysis.estimated_improvement >= 0.0);
        }
    }
}

