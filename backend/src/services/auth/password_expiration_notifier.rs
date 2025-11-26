//! Password expiration notification service
//!
//! Sends email notifications to users whose passwords are expiring soon.

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::users;
use crate::services::email::EmailService;
use diesel::prelude::*;
use std::sync::Arc;

/// Password expiration notifier
pub struct PasswordExpirationNotifier {
    db: Arc<Database>,
    email_service: Arc<EmailService>,
}

impl PasswordExpirationNotifier {
    /// Create a new notifier
    pub fn new(db: Arc<Database>, email_service: Arc<EmailService>) -> Self {
        Self { db, email_service }
    }
    
    /// Notify users with passwords expiring within the warning period
    /// Returns the number of notifications sent
    pub async fn notify_expiring_passwords(&self) -> AppResult<usize> {
        use crate::config::PasswordConfig;
        let config = PasswordConfig::from_env();
        let warning_days = config.warning_days_before_expiry;
        
        let now = chrono::Utc::now();
        let warning_threshold = now + chrono::Duration::days(warning_days as i64);
        
        // Get users with passwords expiring within warning period
        let mut conn = self.db.get_connection()?;
        
        let expiring_users: Vec<(uuid::Uuid, String, Option<String>, chrono::DateTime<chrono::Utc>)> = users::table
            .filter(users::password_expires_at.is_not_null())
            .filter(users::password_expires_at.le(warning_threshold))
            .filter(users::password_expires_at.gt(now))
            .filter(users::status.eq("active"))
            .filter(users::email_verified.eq(true))
            .select((
                users::id,
                users::email,
                users::first_name,
                users::password_expires_at,
            ))
            .load::<(uuid::Uuid, String, Option<String>, Option<chrono::DateTime<chrono::Utc>>)>(&mut conn)
            .map_err(AppError::Database)?
            .into_iter()
            .filter_map(|(id, email, first_name, expires_at)| {
                expires_at.map(|exp| (id, email, first_name, exp))
            })
            .collect();
        
        let mut notifications_sent = 0;
        
        for (user_id, email, first_name, expires_at) in expiring_users {
            let days_until_expiry = (expires_at - now).num_days();
            
            // Send notification email
            if let Err(e) = self.send_expiration_notification(
                &email,
                &first_name,
                days_until_expiry as u32,
            ).await {
                log::error!(
                    "Failed to send password expiration notification to user {} ({}): {}",
                    user_id,
                    email,
                    e
                );
                // Continue with other users even if one fails
            } else {
                notifications_sent += 1;
                log::info!(
                    "Sent password expiration notification to user {} ({}), expires in {} days",
                    user_id,
                    email,
                    days_until_expiry
                );
            }
        }
        
        Ok(notifications_sent)
    }
    
    /// Send expiration notification email
    async fn send_expiration_notification(
        &self,
        email: &str,
        first_name: &Option<String>,
        days_until_expiry: u32,
    ) -> AppResult<()> {
        let display_name = first_name
            .as_ref()
            .map(|n| n.as_str())
            .unwrap_or("User");
        
        let subject = if days_until_expiry == 1 {
            "Your password expires tomorrow - Action Required"
        } else {
            format!("Your password expires in {} days - Action Required", days_until_expiry)
        };
        
        let body = format!(
            r#"
Hello {},

This is a reminder that your password will expire in {} day(s).

To avoid being locked out of your account, please change your password as soon as possible.

You can change your password by:
1. Logging into your account
2. Going to Settings > Security
3. Clicking "Change Password"

If you have any questions or need assistance, please contact support.

Best regards,
The Security Team
"#,
            display_name,
            days_until_expiry
        );
        
        self.email_service
            .send_email(email, &subject, &body)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to send email: {}", e)))?;
        
        Ok(())
    }
    
    /// Notify users with expired passwords
    /// Returns the number of notifications sent
    pub async fn notify_expired_passwords(&self) -> AppResult<usize> {
        let now = chrono::Utc::now();
        
        // Get users with expired passwords
        let mut conn = self.db.get_connection()?;
        
        let expired_users: Vec<(uuid::Uuid, String, Option<String>)> = users::table
            .filter(users::password_expires_at.is_not_null())
            .filter(users::password_expires_at.lt(now))
            .filter(users::status.eq("active"))
            .filter(users::email_verified.eq(true))
            .select((
                users::id,
                users::email,
                users::first_name,
            ))
            .load::<(uuid::Uuid, String, Option<String>)>(&mut conn)
            .map_err(AppError::Database)?;
        
        let mut notifications_sent = 0;
        
        for (user_id, email, first_name) in expired_users {
            // Send notification email
            if let Err(e) = self.send_expired_notification(&email, &first_name).await {
                log::error!(
                    "Failed to send expired password notification to user {} ({}): {}",
                    user_id,
                    email,
                    e
                );
            } else {
                notifications_sent += 1;
                log::info!(
                    "Sent expired password notification to user {} ({})",
                    user_id,
                    email
                );
            }
        }
        
        Ok(notifications_sent)
    }
    
    /// Send expired password notification email
    async fn send_expired_notification(
        &self,
        email: &str,
        first_name: &Option<String>,
    ) -> AppResult<()> {
        let display_name = first_name
            .as_ref()
            .map(|n| n.as_str())
            .unwrap_or("User");
        
        let subject = "Your password has expired - Immediate Action Required";
        
        let body = format!(
            r#"
Hello {},

Your password has expired. You will not be able to log in until you reset your password.

To reset your password:
1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Follow the instructions in the email you receive

If you have any questions or need assistance, please contact support immediately.

Best regards,
The Security Team
"#,
            display_name
        );
        
        self.email_service
            .send_email(email, &subject, &body)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to send email: {}", e)))?;
        
        Ok(())
    }
}

