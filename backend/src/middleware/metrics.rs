// Metrics Middleware - Prometheus metrics collection
// Tracks request latency, error rates, and throughput

use actix_web::{dev::ServiceRequest, dev::ServiceResponse, Error};
use actix_web::middleware::Middleware;
use prometheus::{Counter, Histogram, Registry};
use std::time::Instant;

pub struct MetricsMiddleware {
    pub registry: Registry,
    pub request_counter: Counter,
    pub request_latency: Histogram,
    pub error_counter: Counter,
}

impl MetricsMiddleware {
    pub fn new(registry: Registry) -> Result<Self, prometheus::Error> {
        let request_counter = Counter::new(
            "http_requests_total",
            "Total number of HTTP requests"
        )?;

        let request_latency = Histogram::with_opts(
            HistogramOpts::new(
                "http_request_duration_seconds",
                "HTTP request latency in seconds"
            )
            .buckets(vec![0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0])
        )?;

        let error_counter = Counter::new(
            "http_errors_total",
            "Total number of HTTP errors"
        )?;

        registry.register(Box::new(request_counter.clone()))?;
        registry.register(Box::new(request_latency.clone()))?;
        registry.register(Box::new(error_counter.clone()))?;
        
        Self {
            registry,
            request_counter,
            request_latency,
            error_counter,
        }
    }
}

impl<S> Middleware<S> for MetricsMiddleware {
    type Service = MetricsService<S>;
    type Error = Error;
    type Future = Ready<Result<Self::Service, Error>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(MetricsService {
            service,
            request_counter: self.request_counter.clone(),
            request_latency: self.request_latency.clone(),
            error_counter: self.error_counter.clone(),
        }))
    }
}

pub struct MetricsService<S> {
    service: S,
    request_counter: Counter,
    request_latency: Histogram,
    error_counter: Counter,
}

impl<S> Service<ServiceRequest> for MetricsService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse, Error = Error>,
{
    type Response = ServiceResponse;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let start = Instant::now();
        
        // Increment request counter
        self.request_counter.inc();
        
        // Call the inner service
        let future = self.service.call(req);
        let latency = self.request_latency.clone();
        let errors = self.error_counter.clone();
        
        Box::pin(async move {
            match future.await {
                Ok(resp) => {
                    // Record latency
                    latency.observe(start.elapsed().as_secs_f64());
                    
                    // Check for error status codes
                    if resp.status().is_server_error() {
                        errors.inc();
                    }
                    
                    Ok(resp)
                }
                Err(e) => {
                    errors.inc();
                    Err(e)
                }
            }
        })
    }
}

// Add Prometheus dependencies to Cargo.toml:
// prometheus = "0.13"

