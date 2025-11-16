//! Query optimization module
//! 
//! This module provides database query optimization including index recommendations,
//! query analysis, and performance monitoring.

use std::time::Duration;
use crate::errors::AppResult;

/// Query optimization service
pub struct QueryOptimizer {
    pub slow_query_threshold: Duration,
    pub query_cache_size: usize,
    pub enable_query_analysis: bool,
    pub enable_index_suggestions: bool,
}

#[derive(Debug, Clone)]
pub struct QueryAnalysis {
    pub query: String,
    pub duration: Duration,
    pub is_slow: bool,
    pub optimization_suggestions: Vec<String>,
    pub index_suggestions: Vec<String>,
    pub estimated_impact: OptimizationImpact,
}

#[derive(Debug, Clone)]
pub struct OptimizationImpact {
    pub score: u32,
    pub level: OptimizationLevel,
    pub estimated_improvement: f64,
}

#[derive(Debug, Clone)]
pub enum OptimizationLevel {
    Low,
    Medium,
    High,
    Critical,
}

impl QueryOptimizer {
    pub fn new() -> Self {
        Self {
            slow_query_threshold: Duration::from_millis(50), // Target: <50ms for P95
            query_cache_size: 1000,
            enable_query_analysis: true,
            enable_index_suggestions: true,
        }
    }
    
    pub async fn optimize_reconciliation_queries(&self) -> AppResult<Vec<String>> {
        // Index creation is now handled by database migrations.
        // This function is kept for now to avoid breaking changes, but it will be deprecated.
        Ok(Vec::new())
    }
    
    pub async fn analyze_query_performance(&self, query: &str, duration: Duration) -> QueryAnalysis {
        QueryAnalysis {
            query: query.to_string(),
            duration,
            is_slow: duration > self.slow_query_threshold,
            optimization_suggestions: self.get_optimization_suggestions(query, duration),
            index_suggestions: self.get_index_suggestions(query),
            estimated_impact: self.estimate_optimization_impact(query, duration),
        }
    }
    
    fn get_index_suggestions(&self, query: &str) -> Vec<String> {
        let mut suggestions = Vec::new();
        let query_lower = query.to_lowercase();
        
        // Suggest indexes for common patterns
        if query_lower.contains("where project_id") && !query_lower.contains("index") {
            suggestions.push("Consider adding index on project_id column".to_string());
        }
        
        if query_lower.contains("where amount") && !query_lower.contains("index") {
            suggestions.push("Consider adding index on amount column".to_string());
        }
        
        if query_lower.contains("where transaction_date") && !query_lower.contains("index") {
            suggestions.push("Consider adding index on transaction_date column".to_string());
        }
        
        if query_lower.contains("order by") && !query_lower.contains("index") {
            suggestions.push("Consider adding index on ORDER BY columns".to_string());
        }
        
        if query_lower.contains("group by") && !query_lower.contains("index") {
            suggestions.push("Consider adding index on GROUP BY columns".to_string());
        }
        
        suggestions
    }
    
    fn estimate_optimization_impact(&self, query: &str, duration: Duration) -> OptimizationImpact {
        let mut impact_score = 0;
        let mut impact_level = OptimizationLevel::Low;
        
        // More aggressive scoring for queries >50ms (P95 target)
        if duration > Duration::from_millis(1000) {
            impact_score += 4;
        } else if duration > Duration::from_millis(500) {
            impact_score += 3;
        } else if duration > Duration::from_millis(100) {
            impact_score += 2;
        } else if duration > Duration::from_millis(50) {
            impact_score += 1;
        }
        
        let query_lower = query.to_lowercase();
        if query_lower.contains("select *") {
            impact_score += 1;
        }
        
        if query_lower.contains("like '%") {
            impact_score += 2;
        }
        
        if query_lower.contains("order by") && !query_lower.contains("limit") {
            impact_score += 1;
        }
        
        match impact_score {
            0 => impact_level = OptimizationLevel::Low,
            1..=2 => impact_level = OptimizationLevel::Medium,
            3..=4 => impact_level = OptimizationLevel::High,
            _ => impact_level = OptimizationLevel::Critical,
        }
        
        OptimizationImpact {
            score: impact_score,
            level: impact_level,
            estimated_improvement: self.calculate_improvement_percentage(duration, impact_score),
        }
    }
    
    fn calculate_improvement_percentage(&self, duration: Duration, score: u32) -> f64 {
        match score {
            0 => 0.0,
            1..=2 => 20.0,  // Medium impact: 20% improvement
            3..=4 => 50.0,  // High impact: 50% improvement
            _ => 80.0,      // Critical impact: 80% improvement
        }
    }
    
    fn get_optimization_suggestions(&self, query: &str, duration: Duration) -> Vec<String> {
        let mut suggestions = Vec::new();
        
        // More aggressive suggestions for queries >50ms
        if duration > self.slow_query_threshold {
            suggestions.push("Consider adding indexes for frequently queried columns".to_string());
            
            if query.to_lowercase().contains("select *") {
                suggestions.push("Avoid SELECT * - specify only needed columns".to_string());
            }
            
            if query.to_lowercase().contains("like '%") {
                suggestions.push("Avoid leading wildcards in LIKE queries".to_string());
            }
            
            if query.to_lowercase().contains("order by") && !query.to_lowercase().contains("limit") {
                suggestions.push("Consider adding LIMIT clause for large result sets".to_string());
            }
            
            if query.to_lowercase().contains("group by") && !query.to_lowercase().contains("having") {
                suggestions.push("Consider using HAVING clause for filtering grouped results".to_string());
            }
            
            if query.to_lowercase().contains("join") && !query.to_lowercase().contains("on") {
                suggestions.push("Ensure JOIN conditions are properly specified".to_string());
            }
        }
        
        suggestions
    }
}



