// Performance Monitoring and Optimization Service
// This service handles performance monitoring, caching, and optimization

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use prometheus::{Counter, Histogram, Gauge, Registry, TextEncoder, HistogramOpts};
use crate::errors::AppResult;

// Performance metrics
lazy_static::lazy_static! {
    static ref REQUEST_COUNTER: Counter = Counter::new(
        "http_requests_total",
        "Total number of HTTP requests"
    ).unwrap();
    
    static ref REQUEST_DURATION: Histogram = Histogram::with_opts(
        HistogramOpts::new("http_request_duration_seconds", "HTTP request duration in seconds")
            .buckets(vec![0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0])
    ).unwrap();
    
    static ref ACTIVE_CONNECTIONS: Gauge = Gauge::new(
        "active_connections",
        "Number of active connections"
    ).unwrap();
    
    static ref DATABASE_CONNECTIONS: Gauge = Gauge::new(
        "database_connections",
        "Number of database connections"
    ).unwrap();
    
    static ref CACHE_HITS: Counter = Counter::new(
        "cache_hits_total",
        "Total number of cache hits"
    ).unwrap();
    
    static ref CACHE_MISSES: Counter = Counter::new(
        "cache_misses_total",
        "Total number of cache misses"
    ).unwrap();
    
    static ref RECONCILIATION_JOBS: Gauge = Gauge::new(
        "reconciliation_jobs_active",
        "Number of active reconciliation jobs"
    ).unwrap();
    
    static ref FILE_UPLOADS: Gauge = Gauge::new(
        "file_uploads_active",
        "Number of active file uploads"
    ).unwrap();
}

// Performance monitoring data structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub request_count: u64,
    pub average_response_time: f64,
    pub error_rate: f64,
    pub active_connections: u64,
    pub database_connections: u64,
    pub cache_hit_rate: f64,
    pub memory_usage: f64,
    pub cpu_usage: f64,
    pub timestamp: String,
}

#[derive(Debug, Clone)]
pub struct RequestMetrics {
    pub method: String,
    pub path: String,
    pub status_code: u16,
    pub duration: Duration,
    pub timestamp: Instant,
}

// Performance monitoring service
pub struct PerformanceService {
    pub metrics: Arc<RwLock<HashMap<String, Vec<RequestMetrics>>>>,
    pub cache_stats: Arc<RwLock<CacheStats>>,
    pub registry: Registry,
}

#[derive(Debug, Clone)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
    pub size: u64,
}

impl PerformanceService {
    pub fn new() -> Self {
        let registry = Registry::new();
        
        // Register metrics
        registry.register(Box::new(REQUEST_COUNTER.clone())).unwrap();
        registry.register(Box::new(REQUEST_DURATION.clone())).unwrap();
        registry.register(Box::new(ACTIVE_CONNECTIONS.clone())).unwrap();
        registry.register(Box::new(DATABASE_CONNECTIONS.clone())).unwrap();
        registry.register(Box::new(CACHE_HITS.clone())).unwrap();
        registry.register(Box::new(CACHE_MISSES.clone())).unwrap();
        registry.register(Box::new(RECONCILIATION_JOBS.clone())).unwrap();
        registry.register(Box::new(FILE_UPLOADS.clone())).unwrap();
        
        Self {
            metrics: Arc::new(RwLock::new(HashMap::new())),
            cache_stats: Arc::new(RwLock::new(CacheStats {
                hits: 0,
                misses: 0,
                evictions: 0,
                size: 0,
            })),
            registry,
        }
    }
    
    pub async fn record_request(&self, request_metrics: RequestMetrics) {
        // Record in Prometheus
        REQUEST_COUNTER.inc();
        REQUEST_DURATION.observe(request_metrics.duration.as_secs_f64());
        
        // Record in internal metrics
        let key = format!("{}:{}", request_metrics.method, request_metrics.path);
        let mut metrics = self.metrics.write().await;
        metrics.entry(key.clone()).or_insert_with(Vec::new).push(request_metrics);
        
        // Keep only last 1000 requests per endpoint
        if let Some(requests) = metrics.get_mut(&key) {
            if requests.len() > 1000 {
                requests.drain(0..requests.len() - 1000);
            }
        }
    }
    
    pub async fn record_cache_hit(&self) {
        CACHE_HITS.inc();
        let mut stats = self.cache_stats.write().await;
        stats.hits += 1;
    }
    
    pub async fn record_cache_miss(&self) {
        CACHE_MISSES.inc();
        let mut stats = self.cache_stats.write().await;
        stats.misses += 1;
    }
    
    pub async fn record_cache_eviction(&self) {
        let mut stats = self.cache_stats.write().await;
        stats.evictions += 1;
    }
    
    pub async fn update_active_connections(&self, count: u64) {
        ACTIVE_CONNECTIONS.set(count as f64);
    }
    
    pub async fn update_database_connections(&self, count: u64) {
        DATABASE_CONNECTIONS.set(count as f64);
    }
    
    pub async fn update_reconciliation_jobs(&self, count: u64) {
        RECONCILIATION_JOBS.set(count as f64);
    }
    
    pub async fn update_file_uploads(&self, count: u64) {
        FILE_UPLOADS.set(count as f64);
    }
    
    pub async fn get_metrics(&self) -> PerformanceMetrics {
        let metrics = self.metrics.read().await;
        let cache_stats = self.cache_stats.read().await;
        
        let mut total_requests = 0;
        let mut total_duration = Duration::ZERO;
        let mut error_count = 0;
        
        for requests in metrics.values() {
            total_requests += requests.len() as u64;
            for request in requests {
                total_duration += request.duration;
                if request.status_code >= 400 {
                    error_count += 1;
                }
            }
        }
        
        let average_response_time = if total_requests > 0 {
            total_duration.as_secs_f64() / total_requests as f64
        } else {
            0.0
        };
        
        let error_rate = if total_requests > 0 {
            error_count as f64 / total_requests as f64
        } else {
            0.0
        };
        
        let cache_hit_rate = if cache_stats.hits + cache_stats.misses > 0 {
            cache_stats.hits as f64 / (cache_stats.hits + cache_stats.misses) as f64
        } else {
            0.0
        };
        
        PerformanceMetrics {
            request_count: total_requests,
            average_response_time,
            error_rate,
            active_connections: ACTIVE_CONNECTIONS.get() as u64,
            database_connections: DATABASE_CONNECTIONS.get() as u64,
            cache_hit_rate,
            memory_usage: self.get_memory_usage(),
            cpu_usage: self.get_cpu_usage(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }
    
    pub async fn get_prometheus_metrics(&self) -> String {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        encoder.encode_to_string(&metric_families)
            .unwrap_or_else(|e| {
                log::error!("Failed to encode Prometheus metrics: {}", e);
                "# Error encoding metrics\n".to_string()
            })
    }
    
    fn get_memory_usage(&self) -> f64 {
        // Linux implementation using /proc/meminfo; returns fraction used (0.0 - 1.0)
        #[cfg(target_os = "linux")]
        {
            if let Ok(content) = std::fs::read_to_string("/proc/meminfo") {
                let mut mem_total_kb: u64 = 0;
                let mut mem_available_kb: u64 = 0;
                for line in content.lines() {
                    if line.starts_with("MemTotal:") {
                        if let Some(v) = line.split_whitespace().nth(1) { mem_total_kb = v.parse().unwrap_or(0); }
                    } else if line.starts_with("MemAvailable:") {
                        if let Some(v) = line.split_whitespace().nth(1) { mem_available_kb = v.parse().unwrap_or(0); }
                    }
                }
                if mem_total_kb > 0 {
                    let used = mem_total_kb.saturating_sub(mem_available_kb) as f64;
                    return (used / mem_total_kb as f64).clamp(0.0, 1.0);
                }
            }
        }
        0.0
    }
    
    fn get_cpu_usage(&self) -> f64 {
        // Approximate CPU utilization using deltas from /proc/stat first line.
        // Stores last sample in a static mutex to compute deltas across calls.
        lazy_static::lazy_static! {
            static ref CPU_LAST_SAMPLE: std::sync::Mutex<Option<(u64, u64)>> = std::sync::Mutex::new(None);
        }
        #[cfg(target_os = "linux")]
        {
            if let Ok(content) = std::fs::read_to_string("/proc/stat") {
                if let Some(first_line) = content.lines().next() {
                    if first_line.starts_with("cpu ") {
                        let mut parts = first_line.split_whitespace();
                        let _cpu = parts.next(); // "cpu"
                        // user nice system idle iowait irq softirq steal guest guest_nice
                        let vals: Vec<u64> = parts.take(10).filter_map(|s| s.parse::<u64>().ok()).collect();
                        if vals.len() >= 4 {
                            let idle = vals[3] + vals.get(4).copied().unwrap_or(0); // idle + iowait
                            let total: u64 = vals.iter().sum();
                            let mut last = CPU_LAST_SAMPLE.lock().unwrap_or_else(|e| {
                                log::error!("CPU_LAST_SAMPLE mutex poisoned: {}", e);
                                e.into_inner()
                            });
                            let usage = if let Some((last_total, last_idle)) = *last {
                                let dt = total.saturating_sub(last_total);
                                let di = idle.saturating_sub(last_idle);
                                if dt > 0 { (1.0 - (di as f64 / dt as f64)).clamp(0.0, 1.0) } else { 0.0 }
                            } else {
                                0.0
                            };
                            *last = Some((total, idle));
                            return usage;
                        }
                    }
                }
            }
        }
        0.0
    }
    
    /// Get comprehensive performance metrics
    pub async fn get_comprehensive_metrics(&self) -> AppResult<serde_json::Value> {
        let metrics = self.metrics.read().await;
        let cache_stats = self.cache_stats.read().await;
        
        // Calculate average response time
        let mut total_duration = Duration::new(0, 0);
        let mut request_count = 0u64;
        
        for requests in metrics.values() {
            for request in requests {
                total_duration += request.duration;
                request_count += 1;
            }
        }
        
        let average_response_time = if request_count > 0 {
            total_duration.as_secs_f64() / request_count as f64
        } else {
            0.0
        };
        
        // Calculate error rate (simplified - would need to track error responses)
        let error_rate = 0.0; // Placeholder - would need to track error responses
        
        // Calculate cache hit rate
        let total_cache_requests = cache_stats.hits + cache_stats.misses;
        let cache_hit_rate = if total_cache_requests > 0 {
            cache_stats.hits as f64 / total_cache_requests as f64
        } else {
            0.0
        };
        
        // Get system metrics
        let memory_usage = self.get_memory_usage();
        let cpu_usage = self.get_cpu_usage();
        
        // Get Prometheus metrics
        let prometheus_metrics = self.get_prometheus_metrics().await;
        
        let comprehensive_metrics = serde_json::json!({
            "performance": {
                "request_count": request_count,
                "average_response_time": average_response_time,
                "error_rate": error_rate,
                "active_connections": ACTIVE_CONNECTIONS.get() as u64,
                "database_connections": DATABASE_CONNECTIONS.get() as u64,
                "cache_hit_rate": cache_hit_rate,
                "memory_usage": memory_usage,
                "cpu_usage": cpu_usage,
                "timestamp": chrono::Utc::now().to_rfc3339()
            },
            "cache": {
                "hits": cache_stats.hits,
                "misses": cache_stats.misses,
                "evictions": cache_stats.evictions,
                "size": cache_stats.size,
                "hit_rate": cache_hit_rate
            },
            "prometheus": prometheus_metrics,
            "timestamp": chrono::Utc::now().to_rfc3339()
        });
        
        Ok(comprehensive_metrics)
    }
}

// Database connection pool optimization
pub struct DatabasePool {
    pub max_connections: u32,
    pub min_connections: u32,
    pub connection_timeout: Duration,
    pub idle_timeout: Duration,
    pub acquire_timeout: Duration,
    pub max_lifetime: Duration,
}

impl DatabasePool {
    pub fn new() -> Self {
        Self {
            max_connections: 20,
            min_connections: 5,
            connection_timeout: Duration::from_secs(30),
            idle_timeout: Duration::from_secs(600),
            acquire_timeout: Duration::from_secs(10),
            max_lifetime: Duration::from_secs(1800), // 30 minutes
        }
    }
    
    pub fn optimized_for_reconciliation() -> Self {
        Self {
            max_connections: 50,        // Increased for high concurrency
            min_connections: 10,        // Higher minimum for faster response
            connection_timeout: Duration::from_secs(10),  // Faster timeout
            idle_timeout: Duration::from_secs(300),      // Shorter idle time
            acquire_timeout: Duration::from_secs(5),     // Faster acquire
            max_lifetime: Duration::from_secs(1800),     // 30 minutes
        }
    }
    
    pub fn with_max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }
    
    pub fn with_min_connections(mut self, min: u32) -> Self {
        self.min_connections = min;
        self
    }
    
    pub fn with_timeouts(mut self, connection: Duration, idle: Duration) -> Self {
        self.connection_timeout = connection;
        self.idle_timeout = idle;
        self
    }
    
    pub fn with_advanced_timeouts(
        mut self, 
        connection: Duration, 
        idle: Duration, 
        acquire: Duration,
        lifetime: Duration
    ) -> Self {
        self.connection_timeout = connection;
        self.idle_timeout = idle;
        self.acquire_timeout = acquire;
        self.max_lifetime = lifetime;
        self
    }
}

// Redis connection optimization
pub struct RedisPool {
    pub max_connections: u32,
    pub connection_timeout: Duration,
    pub command_timeout: Duration,
    pub retry_attempts: u32,
}

impl RedisPool {
    pub fn new() -> Self {
        Self {
            max_connections: 10,
            connection_timeout: Duration::from_secs(5),
            command_timeout: Duration::from_secs(3),
            retry_attempts: 3,
        }
    }
    
    pub fn with_max_connections(mut self, max: u32) -> Self {
        self.max_connections = max;
        self
    }
    
    pub fn with_timeouts(mut self, connection: Duration, command: Duration) -> Self {
        self.connection_timeout = connection;
        self.command_timeout = command;
        self
    }
}

// Query optimization service
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
            slow_query_threshold: Duration::from_millis(100),
            query_cache_size: 1000,
            enable_query_analysis: true,
            enable_index_suggestions: true,
        }
    }
    
    pub async fn optimize_reconciliation_queries(&self) -> AppResult<Vec<String>> {
        let optimizations = vec![
            // Add indexes for reconciliation_records table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_records_project_id 
             ON reconciliation_records(project_id)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_records_amount 
             ON reconciliation_records(amount)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_records_date 
             ON reconciliation_records(transaction_date)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_records_status 
             ON reconciliation_records(status)",
            
            // Add composite indexes for common query patterns
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_records_project_amount 
             ON reconciliation_records(project_id, amount)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_records_project_date 
             ON reconciliation_records(project_id, transaction_date)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_records_project_status 
             ON reconciliation_records(project_id, status)",
            
            // Add indexes for reconciliation_jobs table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_jobs_project_id 
             ON reconciliation_jobs(project_id)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_jobs_status 
             ON reconciliation_jobs(status)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_jobs_created_at 
             ON reconciliation_jobs(created_at)",
            
            // Add indexes for reconciliation_matches table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_matches_job_id 
             ON reconciliation_matches(job_id)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reconciliation_matches_confidence 
             ON reconciliation_matches(confidence_score)",
            
            // Add indexes for users table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
             ON users(email)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
             ON users(is_active)",
            
            // Add indexes for projects table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_owner_id 
             ON projects(owner_id)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_active 
             ON projects(is_active)",
            
            // Add indexes for files table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_project_id 
             ON files(project_id)",
            
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_status 
             ON files(status)",
        ];
        
        Ok(optimizations.into_iter().map(|s| s.to_string()).collect())
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
        
        if duration > Duration::from_millis(1000) {
            impact_score += 3;
        } else if duration > Duration::from_millis(500) {
            impact_score += 2;
        } else if duration > Duration::from_millis(100) {
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
            0..=1 => impact_level = OptimizationLevel::Low,
            2..=3 => impact_level = OptimizationLevel::Medium,
            4..=5 => impact_level = OptimizationLevel::High,
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
            0..=1 => 10.0,  // Low impact: 10% improvement
            2..=3 => 30.0,  // Medium impact: 30% improvement
            4..=5 => 60.0,  // High impact: 60% improvement
            _ => 80.0,      // Critical impact: 80% improvement
        }
    }
    
    fn get_optimization_suggestions(&self, query: &str, duration: Duration) -> Vec<String> {
        let mut suggestions = Vec::new();
        
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

// File processing optimization
pub struct FileProcessor {
    pub chunk_size: usize,
    pub max_concurrent_files: usize,
    pub buffer_size: usize,
}

impl FileProcessor {
    pub fn new() -> Self {
        Self {
            chunk_size: 8192, // 8KB chunks
            max_concurrent_files: 5,
            buffer_size: 65536, // 64KB buffer
        }
    }
    
    pub fn with_chunk_size(mut self, size: usize) -> Self {
        self.chunk_size = size;
        self
    }
    
    pub fn with_max_concurrent(mut self, max: usize) -> Self {
        self.max_concurrent_files = max;
        self
    }
    
    pub fn with_buffer_size(mut self, size: usize) -> Self {
        self.buffer_size = size;
        self
    }
}

impl Default for PerformanceService {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for DatabasePool {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for RedisPool {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for QueryOptimizer {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for FileProcessor {
    fn default() -> Self {
        Self::new()
    }
}
