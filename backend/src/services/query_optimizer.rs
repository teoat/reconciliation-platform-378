//! Query Optimizer Service
//!
//! Detects slow queries, recommends indexes, and optimizes database access patterns.

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

/// Query analysis result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryAnalysis {
    pub query: String,
    pub duration: Duration,
    pub is_slow: bool,
    pub optimization_suggestions: Vec<String>,
    pub index_suggestions: Vec<String>,
    pub estimated_impact: OptimizationImpact,
}

/// Optimization impact assessment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationImpact {
    pub score: u32,
    pub level: OptimizationLevel,
    pub estimated_improvement: f64,
}

/// Optimization level
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OptimizationLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Slow query threshold configuration
#[derive(Debug, Clone)]
pub struct QueryOptimizerConfig {
    /// Duration threshold to consider a query "slow" (default: 100ms)
    pub slow_query_threshold: Duration,

    /// Maximum number of queries to analyze
    pub max_queries: usize,

    /// Enable automatic index recommendations
    pub enable_index_recommendations: bool,

    /// Enable query plan caching
    pub enable_query_plan_cache: bool,
}

impl Default for QueryOptimizerConfig {
    fn default() -> Self {
        Self {
            slow_query_threshold: Duration::from_millis(100),
            max_queries: 1000,
            enable_index_recommendations: true,
            enable_query_plan_cache: true,
        }
    }
}

/// Query statistics
#[derive(Debug, Clone)]
pub struct QueryStats {
    pub total_queries: u64,
    pub slow_queries: u64,
    pub average_duration: Duration,
    pub slowest_query: Option<(String, Duration)>,
}

/// Query optimizer service
pub struct QueryOptimizer {
    config: QueryOptimizerConfig,
    slow_queries: Arc<RwLock<Vec<QueryAnalysis>>>,
    stats: Arc<RwLock<QueryStats>>,
    #[allow(dead_code)]
    query_plan_cache: Arc<RwLock<std::collections::HashMap<String, String>>>,
}

impl QueryOptimizer {
    /// Create a new query optimizer
    pub fn new(config: QueryOptimizerConfig) -> Self {
        Self {
            config,
            slow_queries: Arc::new(RwLock::new(Vec::new())),
            stats: Arc::new(RwLock::new(QueryStats {
                total_queries: 0,
                slow_queries: 0,
                average_duration: Duration::ZERO,
                slowest_query: None,
            })),
            query_plan_cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Analyze a query execution
    pub async fn analyze_query(&self, query: &str, duration: Duration) -> QueryAnalysis {
        let is_slow = duration > self.config.slow_query_threshold;

        // Update statistics
        {
            let mut stats = self.stats.write().await;
            stats.total_queries += 1;

            if is_slow {
                stats.slow_queries += 1;

                // Track slowest query
                if let Some((_, prev_duration)) = &stats.slowest_query {
                    if duration > *prev_duration {
                        stats.slowest_query = Some((query.to_string(), duration));
                    }
                } else {
                    stats.slowest_query = Some((query.to_string(), duration));
                }
            }
        }

        // Generate optimization suggestions
        let optimization_suggestions = self.generate_suggestions(query);
        let index_suggestions = if self.config.enable_index_recommendations {
            self.recommend_indexes(query)
        } else {
            Vec::new()
        };

        // Calculate impact
        let estimated_improvement = if is_slow {
            (duration.as_millis() as f64 - self.config.slow_query_threshold.as_millis() as f64)
                / duration.as_millis() as f64
        } else {
            0.0
        };

        let score = if estimated_improvement > 0.5 {
            100
        } else if estimated_improvement > 0.3 {
            75
        } else if estimated_improvement > 0.1 {
            50
        } else {
            25
        };

        let level = if estimated_improvement > 0.5 {
            OptimizationLevel::Critical
        } else if estimated_improvement > 0.3 {
            OptimizationLevel::High
        } else if estimated_improvement > 0.1 {
            OptimizationLevel::Medium
        } else {
            OptimizationLevel::Low
        };

        let analysis = QueryAnalysis {
            query: query.to_string(),
            duration,
            is_slow,
            optimization_suggestions,
            index_suggestions,
            estimated_impact: OptimizationImpact {
                score,
                level,
                estimated_improvement,
            },
        };

        // Store slow queries
        if is_slow {
            let mut slow_queries = self.slow_queries.write().await;
            slow_queries.push(analysis.clone());

            // Trim to max queries
            if slow_queries.len() > self.config.max_queries {
                slow_queries.remove(0);
            }
        }

        analysis
    }

    /// Generate optimization suggestions for a query
    fn generate_suggestions(&self, query: &str) -> Vec<String> {
        let mut suggestions = Vec::new();

        // Check for common anti-patterns
        if query.to_lowercase().contains("select *") {
            suggestions.push("Avoid SELECT * - specify only needed columns".to_string());
        }

        if query.to_lowercase().contains("order by") && !query.to_lowercase().contains("limit") {
            suggestions.push("Consider adding LIMIT to ORDER BY queries".to_string());
        }

        if query.to_lowercase().matches("where").count() > 3 {
            suggestions.push("Complex WHERE clause - consider query restructuring".to_string());
        }

        if query.to_lowercase().contains("like '%") {
            suggestions.push("Avoid leading wildcards in LIKE - prevents index usage".to_string());
        }

        if query.to_lowercase().matches("join").count() > 3 {
            suggestions.push("Multiple JOINs detected - verify join order and indexes".to_string());
        }

        suggestions
    }

    /// Recommend indexes for a query
    fn recommend_indexes(&self, query: &str) -> Vec<String> {
        let mut recommendations = Vec::new();

        // Simple heuristics for index recommendations
        let lower_query = query.to_lowercase();

        // Check for WHERE clauses
        if let Some(start) = lower_query.find("where") {
            let where_clause = &lower_query[start + 5..];

            // Look for column names in WHERE
            for column in self.extract_column_names(where_clause) {
                recommendations.push(format!(
                    "Consider index on column '{}' for WHERE clause optimization",
                    column
                ));
            }
        }

        // Check for JOIN clauses
        if lower_query.contains("join") {
            for column in self.extract_join_keys(query) {
                recommendations.push(format!(
                    "Consider index on '{}' for JOIN optimization",
                    column
                ));
            }
        }

        // Check for ORDER BY
        if let Some(start) = lower_query.find("order by") {
            let order_clause = &lower_query[start + 8..];
            for column in self.extract_column_names(order_clause) {
                recommendations.push(format!(
                    "Consider index on '{}' for ORDER BY optimization",
                    column
                ));
            }
        }

        recommendations
    }

    /// Extract column names from a SQL fragment (simple parser)
    fn extract_column_names(&self, sql: &str) -> Vec<String> {
        let mut columns = Vec::new();

        // Simple extraction - look for patterns like "column = " or "column >"
        for token in sql.split_whitespace() {
            if let Some(column) = token
                .strip_suffix("=")
                .or_else(|| token.strip_suffix(">"))
                .or_else(|| token.strip_suffix("<"))
                .or_else(|| token.strip_suffix("!="))
            {
                columns.push(column.trim_matches('\'').to_string());
            }
        }

        columns
    }

    /// Extract JOIN keys (simple parser)
    fn extract_join_keys(&self, sql: &str) -> Vec<String> {
        let mut keys = Vec::new();

        // Look for "ON table.column = table.column" patterns
        let pattern = match regex::Regex::new(r"(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)") {
            Ok(p) => p,
            Err(e) => {
                log::error!("Failed to compile regex pattern for join detection: {}", e);
                return keys;
            }
        };

        for cap in pattern.captures_iter(sql) {
            if let Some(key) = cap.get(2) {
                keys.push(key.as_str().to_string());
            }
            if let Some(key) = cap.get(4) {
                keys.push(key.as_str().to_string());
            }
        }

        keys
    }

    /// Get slow queries
    pub async fn get_slow_queries(&self) -> Vec<QueryAnalysis> {
        self.slow_queries.read().await.clone()
    }

    /// Get statistics
    pub async fn get_stats(&self) -> QueryStats {
        self.stats.read().await.clone()
    }

    /// Clear slow queries cache
    pub async fn clear_cache(&self) {
        let mut slow_queries = self.slow_queries.write().await;
        slow_queries.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_slow_query_detection() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());

        let slow_duration = Duration::from_millis(150);
        let analysis = optimizer
            .analyze_query("SELECT * FROM users", slow_duration)
            .await;

        assert!(analysis.is_slow);
        assert!(analysis.duration > Duration::from_millis(100));
    }

    #[tokio::test]
    async fn test_optimization_suggestions() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());

        let analysis = optimizer
            .analyze_query(
                "SELECT * FROM users WHERE id = 1",
                Duration::from_millis(50),
            )
            .await;

        // Should suggest avoiding SELECT *
        assert!(analysis
            .optimization_suggestions
            .iter()
            .any(|s| s.contains("SELECT *")));
    }

    #[test]
    fn test_extract_column_names() {
        let optimizer = QueryOptimizer::new(QueryOptimizerConfig::default());
        let columns = optimizer.extract_column_names("id = 1 AND name = 'test'");

        assert!(!columns.is_empty());
    }
}
