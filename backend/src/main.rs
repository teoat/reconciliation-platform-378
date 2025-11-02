// Add query optimization initialization after migrations
use crate::services::performance::QueryOptimizer;

// After migrations complete, initialize query optimizer and apply indexes
let query_optimizer = QueryOptimizer::new();
if let Ok(indexes) = query_optimizer.optimize_reconciliation_queries().await {
    log::info!("Generated {} query optimization indexes", indexes.len());
    // Indexes are applied via migration system
}
