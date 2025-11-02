//! Distributed Tracing Middleware
//!
//! OpenTelemetry/Jaeger integration for end-to-end request tracing

use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::errors::AppResult;
use actix_web::{dev::ServiceRequest, Error, HttpMessage, Result as ActixResult};
use actix_web::dev::{Service, ServiceResponse, Transform};
use futures::future::{ok, Ready};
use futures::Future;
use std::rc::Rc;
use std::pin::Pin;

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
        
        if let Err(e) = tracing.finish_span(&span_id).await {
            log::warn!("Failed to finish span in test: {}", e);
        }
    }

    #[tokio::test]
    async fn test_span_tagging() {
        let tracing = DistributedTracing::new(TracingConfig::default());
        let span_id = tracing.start_span("test_operation", None).await;

        if let Err(e) = tracing.add_tag(&span_id, "key".to_string(), "value".to_string()).await {
            log::warn!("Failed to add tag in test: {}", e);
        }
        if let Err(e) = tracing.finish_span(&span_id).await {
            log::warn!("Failed to finish span in test: {}", e);
        }
    }
}

/// Distributed tracing middleware
pub struct DistributedTracingMiddleware {
    config: TracingConfig,
}

impl DistributedTracingMiddleware {
    pub fn new(config: TracingConfig) -> Self {
        Self { config }
    }
}

impl<S, B> Transform<S, ServiceRequest> for DistributedTracingMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = DistributedTracingMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        let tracing = Arc::new(DistributedTracing::new(self.config.clone()));

        ok(DistributedTracingMiddlewareService {
            service: Rc::new(service),
            tracing,
        })
    }
}

/// Distributed tracing middleware service
pub struct DistributedTracingMiddlewareService<S> {
    service: Rc<S>,
    tracing: Arc<DistributedTracing>,
}

impl<S, B> Service<ServiceRequest> for DistributedTracingMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let tracing = self.tracing.clone();

        Box::pin(async move {
            let method = req.method().to_string();
            let path = req.path().to_string();

            // Start span for this request
            let span_id = tracing.start_span(&format!("{} {}", method, path), None).await;

            // Add tags
            tracing.add_tag(&span_id, "http.method".to_string(), method.clone()).await?;
            tracing.add_tag(&span_id, "http.path".to_string(), path.clone()).await?;
            tracing.add_tag(&span_id, "service.name".to_string(), tracing.config.service_name.clone()).await?;

            // Call the next service
            let result = service.call(req).await;

            match result {
                Ok(res) => {
                    let status_code = res.status().as_u16();
                    tracing.add_tag(&span_id, "http.status_code".to_string(), status_code.to_string()).await?;
                    tracing.finish_span(&span_id).await?;
                    Ok(res)
                }
                Err(error) => {
                    tracing.add_tag(&span_id, "error".to_string(), "true".to_string()).await?;
                    tracing.add_tag(&span_id, "error.message".to_string(), error.to_string()).await?;
                    tracing.finish_span(&span_id).await?;
                    Err(error)
                }
            }
        })
    }
}

