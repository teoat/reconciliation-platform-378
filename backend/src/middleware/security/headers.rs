//! Security headers middleware

use actix_service::{Service, Transform};
use actix_web::http::header::{HeaderMap, HeaderName, HeaderValue};
use actix_web::{
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage, Result,
};
use futures_util::future::{ok, Ready};
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use uuid::Uuid;

/// Security headers configuration
#[derive(Clone)]
pub struct SecurityHeadersConfig {
    pub enable_csp: bool,
    pub enable_hsts: bool,
    pub enable_x_frame_options: bool,
    pub enable_x_content_type_options: bool,
    pub enable_x_xss_protection: bool,
    pub enable_referrer_policy: bool,
    pub csp_directives: Option<String>,
    pub hsts_max_age: Option<u32>,
    pub frame_options: Option<String>,
    pub referrer_policy: Option<String>,
}

impl Default for SecurityHeadersConfig {
    fn default() -> Self {
        Self {
            enable_csp: true,
            enable_hsts: true,
            enable_x_frame_options: true,
            enable_x_content_type_options: true,
            enable_x_xss_protection: true,
            enable_referrer_policy: true,
            csp_directives: None,
            hsts_max_age: Some(31536000),
            frame_options: Some("DENY".to_string()),
            referrer_policy: Some("strict-origin-when-cross-origin".to_string()),
        }
    }
}

/// Security headers middleware
pub struct SecurityHeadersMiddleware {
    config: SecurityHeadersConfig,
}

impl SecurityHeadersMiddleware {
    pub fn new(config: SecurityHeadersConfig) -> Self {
        Self { config }
    }
}

impl<S, B> Transform<S, ServiceRequest> for SecurityHeadersMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = SecurityHeadersService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(SecurityHeadersService {
            service,
            config: self.config.clone(),
        })
    }
}

pub struct SecurityHeadersService<S> {
    service: S,
    config: SecurityHeadersConfig,
}

impl<S, B> Service<ServiceRequest> for SecurityHeadersService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, mut req: ServiceRequest) -> Self::Future {
        // Generate a per-request CSP nonce and store in extensions if CSP is enabled
        let csp_nonce = if self.config.enable_csp {
            let nonce = Uuid::new_v4().to_string().replace('-', "");
            req.extensions_mut().insert(CspNonce(nonce.clone()));
            Some(nonce)
        } else {
            None
        };

        // Add request-side defaults
        self.add_security_headers(&mut req);

        let fut = self.service.call(req);
        let config = self.config.clone();
        Box::pin(async move {
            let mut res = fut.await?;
            // Apply security headers based on configuration
            add_security_headers_to_response(&mut res, &config, csp_nonce.as_deref());
            Ok(res)
        })
    }
}

impl<S> SecurityHeadersService<S> {
    fn add_security_headers(&self, req: &mut ServiceRequest) {
        let is_https = req.connection_info().scheme() == "https";
        let headers = req.headers_mut();

        // Add security headers based on configuration
        if self.config.enable_x_content_type_options {
            self.add_header_if_missing(headers, "X-Content-Type-Options", "nosniff");
        }

        if self.config.enable_x_frame_options {
            if let Some(ref frame_options) = self.config.frame_options {
                self.add_header_if_missing(headers, "X-Frame-Options", frame_options);
            }
        }

        if self.config.enable_x_xss_protection {
            self.add_header_if_missing(headers, "X-XSS-Protection", "1; mode=block");
        }

        if self.config.enable_referrer_policy {
            if let Some(ref referrer_policy) = self.config.referrer_policy {
                self.add_header_if_missing(headers, "Referrer-Policy", referrer_policy);
            }
        }

        // Content Security Policy
        if self.config.enable_csp {
            if let Some(ref csp_directives) = self.config.csp_directives {
                self.add_header_if_missing(headers, "Content-Security-Policy", csp_directives);
            } else {
                // Default CSP with nonce placeholder
                let csp = "default-src 'self'; script-src 'self' 'nonce-{nonce}'; style-src 'self' 'nonce-{nonce}'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;";
                self.add_header_if_missing(headers, "Content-Security-Policy", csp);
            }
        }

        // Strict Transport Security (only for HTTPS)
        if is_https && self.config.enable_hsts {
            let hsts_value = if let Some(max_age) = self.config.hsts_max_age {
                format!("max-age={}; includeSubDomains", max_age)
            } else {
                "max-age=31536000; includeSubDomains".to_string()
            };
            self.add_header_if_missing(headers, "Strict-Transport-Security", &hsts_value);
        }
    }

    fn add_header_if_missing(&self, headers: &mut HeaderMap, name: &str, value: &str) {
        if let Ok(header_name) = HeaderName::from_bytes(name.as_bytes()) {
            if !headers.contains_key(&header_name) {
                if let Ok(header_value) = HeaderValue::from_str(value) {
                    headers.insert(header_name, header_value);
                }
            }
        }
    }
}

#[derive(Clone)]
pub struct CspNonce(pub String);

fn add_security_headers_to_response<B>(
    res: &mut ServiceResponse<B>,
    config: &SecurityHeadersConfig,
    nonce: Option<&str>,
) {
    let is_https = res.request().connection_info().scheme() == "https";
    let headers = res.headers_mut();

    // Core headers based on configuration
    if config.enable_x_content_type_options {
        headers.insert(
            HeaderName::from_static("x-content-type-options"),
            HeaderValue::from_static("nosniff"),
        );
    }

    if config.enable_x_frame_options {
        if let Some(ref frame_options) = config.frame_options {
            if let Ok(val) = HeaderValue::from_str(frame_options) {
                headers.insert(HeaderName::from_static("x-frame-options"), val);
            }
        }
    }

    if config.enable_x_xss_protection {
        headers.insert(
            HeaderName::from_static("x-xss-protection"),
            HeaderValue::from_static("1; mode=block"),
        );
    }

    if config.enable_referrer_policy {
        if let Some(ref referrer_policy) = config.referrer_policy {
            if let Ok(val) = HeaderValue::from_str(referrer_policy) {
                headers.insert(HeaderName::from_static("referrer-policy"), val);
            }
        }
    }

    // HSTS
    if is_https && config.enable_hsts {
        let hsts_value = if let Some(max_age) = config.hsts_max_age {
            format!("max-age={}; includeSubDomains", max_age)
        } else {
            "max-age=31536000; includeSubDomains".to_string()
        };
        if let Ok(val) = HeaderValue::from_str(&hsts_value) {
            headers.insert(HeaderName::from_static("strict-transport-security"), val);
        }
    }

    // CSP with nonce if enabled
    if config.enable_csp {
        let csp = if let Some(ref custom_csp) = config.csp_directives {
            custom_csp.clone()
        } else if let Some(nonce) = nonce {
            // Comprehensive CSP with nonce for both scripts and styles
            // Includes report-uri for CSP violation reporting
            format!(
                "default-src 'self'; \
                script-src 'self' 'nonce-{}' 'strict-dynamic'; \
                style-src 'self' 'nonce-{}' 'unsafe-inline'; \
                img-src 'self' data: https: blob:; \
                font-src 'self' data: https:; \
                connect-src 'self' https: wss: ws:; \
                frame-src 'self' https:; \
                frame-ancestors 'none'; \
                base-uri 'self'; \
                form-action 'self'; \
                upgrade-insecure-requests; \
                block-all-mixed-content; \
                report-uri /api/security/csp-report;",
                nonce, nonce
            )
        } else {
            // Fallback CSP without nonce (should not be used in production)
            "default-src 'self'; \
            script-src 'self'; \
            style-src 'self' 'unsafe-inline'; \
            img-src 'self' data: https: blob:; \
            font-src 'self' data: https:; \
            connect-src 'self' https: wss: ws:; \
            frame-src 'self' https:; \
            frame-ancestors 'none'; \
            base-uri 'self'; \
            form-action 'self'; \
            upgrade-insecure-requests; \
            block-all-mixed-content; \
            report-uri /api/security/csp-report;".to_string()
        };

        if let Ok(val) = HeaderValue::from_str(&csp) {
            headers.insert(HeaderName::from_static("content-security-policy"), val);
        }
    }
}
