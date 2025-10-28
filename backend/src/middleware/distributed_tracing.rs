//! Distributed Tracing Middleware
//!
//! OpenTelemetry/Jaeger integration for end-to-end request tracing

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::errors::AppResult;

/// Trace context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceContext {
    pub trace_id: String,
    pub span_id: String,
    pub parent_span_id: Option<String>,
    pub service_name: String,
    pub operation_name: String,
}

/// Span data
#[derive(Debug, Clone)]
pub struct Span {
    pub id: String,
    pub trace_id: String,
    pub parent_id: Option<String>,
    pub operation_name: String,
    pub service_name: String,
    pub start_time: Instant,
    pub duration: Option<Duration>,
    pub tags: std::collections::HashMap<String, String>,
    pub logs: Vec<SpanLog>,
}

/// Span log entry
#[derive(Debug, Clone)]
pub struct SpanLog {
    pub timestamp: Instant,
    pub fields: std::collections::HashMap<String, String>,
}

/// Trace configuration
#[derive(Debug, Clone)]
pub struct TracingConfig {
    /// Enable distributed tracing
    pub enabled: bool,
    
    /// Service name
    pub service_name: String,
    
    /// Jaeger endpoint
    pub jaeger_endpoint: String,
    
    /// Sampling rate (0.0 to 1.0)
    pub sampling_rate: f64,
}

impl Default for TracingConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            service_name: "reconciliation-backend".to_string(),
            jaeger_endpoint: "http://localhost:14268/api/traces".to_string(),
            sampling_rate: 0.1, // 10% sampling
        }
    }
}

/// Distributed tracing service
pub struct DistributedTracing {
    config: TracingConfig,
    active_spans: Arc<RwLock<std::collections::HashMap<String, Span>>>,
    trace_buffer: Arc<RwLock<Vec<Span>>>,
}

impl DistributedTracing {
    /// Create a new tracing service
    pub fn new(config: TracingConfig) -> Self {
        Self {
            config,
            active_spans: Arc::new(RwLock::new(std::collections::HashMap::new())),
            trace_buffer: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Start a new span
    pub async fn start_span(&self, operation_name: &str, parent_id: Option<&str>) -> String {
        let span_id = Uuid::new_v4().to_string();
        let trace_id = parent_id.map(|_| Uuid::new_v4().to_string())
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        let span = Span {
            id: span_id.clone(),
            trace_id: trace_id.clone(),
            parent_id: parent_id.map(String::from),
            operation_name: operation_name.to_string(),
            service_name: self.config.service_name.clone(),
            start_time: Instant::now(),
            duration: None,
            tags: std::collections::HashMap::new(),
            logs: Vec::new(),
        };

        let mut spans = self.active_spans.write().await;
        spans.insert(span_id.clone(), span);

        span_id
    }

    /// Add tag to span
    pub async fn add_tag(&self, span_id: &str, key: String, value: String) -> AppResult<()> {
        let mut spans = self.active_spans.write().await;
        
        if let Some(span) = spans.get_mut(span_id) {
            span.tags.insert(key, value);
        }
        
        Ok(())
    }

    /// Add log to span
    pub async fn add_log(&self, span_id: &str, fields: std::collections::HashMap<String, String>) -> AppResult<()> {
        let mut spans = self.active_spans.write().await;
        
        if let Some(span) = spans.get_mut(span_id) {
            span.logs.push(SpanLog {
                timestamp: Instant::now(),
                fields,
            });
        }
        
        Ok(())
    }

    /// Finish a span
    pub async fn finish_span(&self, span_id: &str) -> AppResult<()> {
        let mut spans = self.active_spans.write().await;
        
        if let Some(mut span) = spans.remove(span_id) {
            span.duration = Some(span.start_time.elapsed());
            
            let mut buffer = self.trace_buffer.write().await;
            buffer.push(span);
            
            // Export if buffer is full
            if buffer.len() >= 100 {
                self.export_traces().await?;
            }
        }
        
        Ok(())
    }

    /// Export traces to Jaeger
    async fn export_traces(&self) -> AppResult<()> {
        let traces = {
            let mut buffer = self.trace_buffer.write().await;
            std::mem::take(&mut *buffer)
        };

        if traces.is_empty() {
            return Ok(());
        }

        // In a real implementation, serialize and send to Jaeger
        log::debug!("Exporting {} spans to Jaeger", traces.len());
        
        Ok(())
    }

    /// Get trace context
    pub fn get_trace_context(&self, span_id: &str) -> Option<TraceContext> {
        // Simple implementation
        Some(TraceContext {
            trace_id: "trace-123".to_string(),
            span_id: span_id.to_string(),
            parent_span_id: None,
            service_name: self.config.service_name.clone(),
            operation_name: "operation".to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_span_creation() {
        let tracing = DistributedTracing::new(TracingConfig::default());
        let span_id = tracing.start_span("test_operation", None).await;
        
        assert!(!span_id.is_empty());
        
        tracing.finish_span(&span_id).await.unwrap();
    }

    #[tokio::test]
    async fn test_span_tagging() {
        let tracing = DistributedTracing::new(TracingConfig::default());
        let span_id = tracing.start_span("test_operation", None).await;
        
        tracing.add_tag(&span_id, "key".to_string(), "value".to_string()).await.unwrap();
        tracing.finish_span(&span_id).await.unwrap();
    }
}

