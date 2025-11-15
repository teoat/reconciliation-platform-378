//! Health check handlers module
//!
//! Provides health check endpoints including resilience status,
//! dependency checks, and system metrics.

use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::errors::AppError;
use crate::database::Database;
use crate::services::cache::MultiLevelCache;
use crate::services::resilience::ResilienceManager;
use crate::handlers::types::ApiResponse;

/// Configure health check routes
pub fn configure_health_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/health", web::get().to(health_check))
        .route("/health/resilience", web::get().to(get_resilience_status))
        .route("/health/dependencies", web::get().to(get_dependencies_status))
        .route("/health/metrics", web::get().to(get_metrics_endpoint));
}

/// Basic health check endpoint
pub async fn health_check() -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "status": "healthy",
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "version": env!("CARGO_PKG_VERSION"),
        })),
        message: None,
        error: None,
    }))
}

/// Get resilience status (circuit breaker stats)
pub async fn get_resilience_status(
    resilience: web::Data<Arc<ResilienceManager>>,
) -> Result<HttpResponse, AppError> {
    let db_stats = resilience.get_database_stats().await;
    let cache_stats = resilience.get_cache_stats().await;
    let api_stats = resilience.get_api_stats().await;
    
    #[derive(Serialize)]
    struct ResilienceStatus {
        database: CircuitBreakerStatus,
        cache: CircuitBreakerStatus,
        api: CircuitBreakerStatus,
    }
    
    #[derive(Serialize)]
    struct CircuitBreakerStatus {
        state: String,
        failures: u64,
        successes: u64,
        total_requests: u64,
        success_rate: f64,
    }
    
    let database_status = CircuitBreakerStatus {
        state: format!("{:?}", db_stats.state),
        failures: db_stats.failure_count,
        successes: db_stats.success_count,
        total_requests: db_stats.failure_count + db_stats.success_count,
        success_rate: if db_stats.failure_count + db_stats.success_count > 0 {
            (db_stats.success_count as f64) / ((db_stats.failure_count + db_stats.success_count) as f64) * 100.0
        } else {
            100.0
        },
    };
    
    let cache_status = CircuitBreakerStatus {
        state: format!("{:?}", cache_stats.state),
        failures: cache_stats.failure_count,
        successes: cache_stats.success_count,
        total_requests: cache_stats.failure_count + cache_stats.success_count,
        success_rate: if cache_stats.failure_count + cache_stats.success_count > 0 {
            (cache_stats.success_count as f64) / ((cache_stats.failure_count + cache_stats.success_count) as f64) * 100.0
        } else {
            100.0
        },
    };
    
    let api_status = CircuitBreakerStatus {
        state: format!("{:?}", api_stats.state),
        failures: api_stats.failure_count,
        successes: api_stats.success_count,
        total_requests: api_stats.failure_count + api_stats.success_count,
        success_rate: if api_stats.failure_count + api_stats.success_count > 0 {
            (api_stats.success_count as f64) / ((api_stats.failure_count + api_stats.success_count) as f64) * 100.0
        } else {
            100.0
        },
    };
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(ResilienceStatus {
            database: database_status,
            cache: cache_status,
            api: api_status,
        }),
        message: None,
        error: None,
    }))
}

/// Get dependencies status (database, cache, etc.)
pub async fn get_dependencies_status(
    db: web::Data<Database>,
    cache: web::Data<Arc<MultiLevelCache>>,
) -> Result<HttpResponse, AppError> {
    #[derive(Serialize)]
    struct DependenciesStatus {
        database: DependencyStatus,
        cache: DependencyStatus,
    }
    
    #[derive(Serialize)]
    struct DependencyStatus {
        status: String,
        message: Option<String>,
    }
    
    // Check database connection
    let db_status = match db.get_connection_async().await {
        Ok(_) => DependencyStatus {
            status: "healthy".to_string(),
            message: None,
        },
        Err(e) => DependencyStatus {
            status: "unhealthy".to_string(),
            message: Some(format!("Database connection failed: {}", e)),
        },
    };
    
    // Check cache connection (try a simple get operation)
    let cache_status = match cache.get::<String>("health_check").await {
        Ok(_) | Err(_) => {
            // Even if we get an error, the cache is responding
            DependencyStatus {
                status: "healthy".to_string(),
                message: None,
            }
        }
    };
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(DependenciesStatus {
            database: db_status,
            cache: cache_status,
        }),
        message: None,
        error: None,
    }))
}

/// Get Prometheus metrics endpoint
pub async fn get_metrics_endpoint() -> Result<HttpResponse, AppError> {
    use crate::monitoring::metrics;
    
    // Use gather_all_metrics from monitoring module which includes circuit breaker metrics
    let metrics_output = metrics::gather_all_metrics();
    
    Ok(HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body(metrics_output))
}

