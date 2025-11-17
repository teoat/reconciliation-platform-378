//! Password Rotation Scheduler
//!
//! Handles automatic rotation of passwords based on rotation intervals.

use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::time::{interval, Duration};

use crate::errors::AppResult;
use crate::services::PasswordManager;

/// Password rotation scheduler
pub struct PasswordRotationScheduler {
    password_manager: Arc<PasswordManager>,
    interval_seconds: u64,
}

impl PasswordRotationScheduler {
    /// Create a new rotation scheduler
    pub fn new(password_manager: Arc<PasswordManager>, interval_seconds: u64) -> Self {
        Self {
            password_manager,
            interval_seconds,
        }
    }

    /// Start the rotation scheduler
    /// 
    /// This will periodically check for passwords due for rotation and rotate them.
    pub async fn start(&self) {
        let mut interval_timer = interval(Duration::from_secs(self.interval_seconds));
        
        loop {
            interval_timer.tick().await;
            
            if let Err(e) = self.password_manager.rotate_due_passwords().await {
                log::error!("Error rotating passwords: {:?}", e);
            }
        }
    }

    /// Rotate passwords due for rotation
    /// 
    /// Returns list of password names that were rotated.
    pub async fn rotate_due_passwords(&self) -> AppResult<Vec<String>> {
        self.password_manager.rotate_due_passwords().await
    }
}

