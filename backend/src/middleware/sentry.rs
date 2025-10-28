// Sentry Integration - Error tracking and alerting
// Captures exceptions, performance data, and user feedback

use sentry::{ClientInitGuard, Options, types::Dsn};

pub struct SentryConfig {
    pub dsn: String,
    pub environment: String,
    pub release: String,
    pub sample_rate: f32,
}

impl SentryConfig {
    pub fn from_env() -> Self {
        Self {
            dsn: std::env::var("SENTRY_DSN")
                .unwrap_or_else(|_| "".to_string()),
            environment: std::env::var("ENVIRONMENT")
                .unwrap_or_else(|_| "development".to_string()),
            release: std::env::var("APP_VERSION")
                .unwrap_or_else(|_| "1.0.0".to_string()),
            sample_rate: std::env::var("SENTRY_SAMPLE_RATE")
                .unwrap_or_else(|_| "1.0".to_string())
                .parse()
                .unwrap_or(1.0),
        }
    }

    pub fn init(&self) -> Option<ClientInitGuard> {
        if self.dsn.is_empty() {
            println!("⚠️  Sentry DSN not configured - error tracking disabled");
            return None;
        }

        let dsn: Dsn = self.dsn.parse().ok()?;
        
        let guard = sentry::init((
            dsn,
            sentry::ClientOptions {
                release: Some(self.release.clone().into()),
                environment: Some(self.environment.clone().into()),
                sample_rate: self.sample_rate,
                traces_sample_rate: 0.1, // 10% performance monitoring
                ..Default::default()
            },
        ));

        println!("✅ Sentry initialized for environment: {}", self.environment);
        Some(guard)
    }
}

// Alert helper functions
pub fn capture_error(error: &dyn std::error::Error) {
    sentry::capture_error(error);
}

pub fn capture_message(message: &str, level: sentry::Level) {
    sentry::capture_message(message, level);
}

// Add Sentry dependencies to Cargo.toml:
// sentry = "0.32"
// sentry-actix = "0.32"

