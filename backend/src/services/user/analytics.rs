//! User analytics service
//!
//! Handles user statistics and analytics operations.

use diesel::prelude::*;
use diesel::{QueryDsl, ExpressionMethods, RunQueryDsl};
use std::sync::Arc;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::users;
use chrono::{Utc, Duration};
use super::traits::UserStatistics;

/// User analytics service for statistics and analytics
pub struct UserAnalyticsService {
    db: Arc<Database>,
}

impl UserAnalyticsService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Get active users count
    pub async fn get_active_users_count(&self) -> AppResult<i64> {
        let mut conn = self.db.get_connection()?;

        let count = users::table
            .filter(users::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        Ok(count)
    }

    /// Get user statistics
    pub async fn get_user_statistics(&self) -> AppResult<UserStatistics> {
        let mut conn = self.db.get_connection()?;

        // Get total users
        let total_users = users::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get active users
        let active_users = users::table
            .filter(users::is_active.eq(true))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get users by role
        let users_by_role = users::table
            .group_by(users::role)
            .select((users::role, diesel::dsl::count(users::id)))
            .load::<(String, i64)>(&mut conn)
            .map_err(AppError::Database)?;

        // Get users created in last 30 days
        let thirty_days_ago = Utc::now() - Duration::days(30);
        let recent_users = users::table
            .filter(users::created_at.ge(thirty_days_ago))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        Ok(UserStatistics {
            total_users,
            active_users,
            inactive_users: total_users - active_users,
            recent_users,
            users_by_role: users_by_role.into_iter().collect(),
        })
    }
}

