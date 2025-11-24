//! User query service
//!
//! Handles user search, filtering, and listing operations.

use diesel::prelude::*;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl};
use std::sync::Arc;
use uuid::Uuid;

use super::traits::{UserInfo, UserListResponse};
use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::projects;
use crate::models::schema::users;
use crate::services::auth::ValidationUtils;

/// Type alias for user query result tuple to reduce complexity
type UserQueryResult = (
    Uuid,
    String,
    Option<String>,
    Option<String>,
    String,
    bool,
    chrono::DateTime<chrono::Utc>,
    chrono::DateTime<chrono::Utc>,
    Option<chrono::DateTime<chrono::Utc>>,
);

/// Type alias for database connection to reduce complexity
type DbConnection = diesel::r2d2::PooledConnection<
    diesel::r2d2::ConnectionManager<diesel::PgConnection>,
>;

/// User query service for search and filtering
pub struct UserQueryService {
    db: Arc<Database>,
}

impl UserQueryService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// List users with pagination
    pub async fn list_users(
        &self,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;

        let mut conn = self.db.get_connection()?;

        // Get total count
        let total = users::table
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get users
        let users = users::table
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::status,
                users::email_verified,
                users::created_at,
                users::updated_at,
                users::last_login_at,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(
                Uuid,
                String,
                Option<String>,
                Option<String>,
                String,
                bool,
                chrono::DateTime<chrono::Utc>,
                chrono::DateTime<chrono::Utc>,
                Option<chrono::DateTime<chrono::Utc>>,
            )>(&mut conn)
            .map_err(AppError::Database)?;

        // Get project counts for all users in one query
        let user_infos = self.build_user_infos_with_project_counts(users, &mut conn)?;

        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }

    /// Search users
    pub async fn search_users(
        &self,
        query: &str,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;

        let mut conn = self.db.get_connection()?;

        let search_pattern = format!("%{}%", query);

        // Get total count
        let total = users::table
            .filter(
                users::email
                    .ilike(&search_pattern)
                    .or(users::first_name.ilike(&search_pattern))
                    .or(users::last_name.ilike(&search_pattern)),
            )
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get users
        let users = users::table
            .filter(
                users::email
                    .ilike(&search_pattern)
                    .or(users::first_name.ilike(&search_pattern))
                    .or(users::last_name.ilike(&search_pattern)),
            )
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::status,
                users::email_verified,
                users::created_at,
                users::updated_at,
                users::last_login_at,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(
                Uuid,
                String,
                Option<String>,
                Option<String>,
                String,
                bool,
                chrono::DateTime<chrono::Utc>,
                chrono::DateTime<chrono::Utc>,
                Option<chrono::DateTime<chrono::Utc>>,
            )>(&mut conn)
            .map_err(AppError::Database)?;

        // Get project counts for all users in one query
        let user_infos = self.build_user_infos_with_project_counts(users, &mut conn)?;

        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }

    /// Get users by role
    pub async fn get_users_by_role(
        &self,
        role: &str,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;

        let mut conn = self.db.get_connection()?;

        // Validate role format
        if role != "user" && role != "admin" && role != "manager" && role != "viewer" {
            return Err(AppError::Validation("Invalid role".to_string()));
        }

        // Get total count
        let total = users::table
            .filter(users::status.eq(role))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get users
        let users = users::table
            .filter(users::status.eq(role))
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::status,
                users::email_verified,
                users::created_at,
                users::updated_at,
                users::last_login_at,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(
                Uuid,
                String,
                Option<String>,
                Option<String>,
                String,
                bool,
                chrono::DateTime<chrono::Utc>,
                chrono::DateTime<chrono::Utc>,
                Option<chrono::DateTime<chrono::Utc>>,
            )>(&mut conn)
            .map_err(AppError::Database)?;

        // Get project counts for all users in one query
        let user_infos = self.build_user_infos_with_project_counts(users, &mut conn)?;

        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }

    /// Get users created in date range
    pub async fn get_users_by_date_range(
        &self,
        start_date: chrono::DateTime<chrono::Utc>,
        end_date: chrono::DateTime<chrono::Utc>,
        page: Option<i64>,
        per_page: Option<i64>,
    ) -> AppResult<UserListResponse> {
        let (page, per_page) = ValidationUtils::validate_pagination(page, per_page)?;
        let offset = (page - 1) * per_page;

        let mut conn = self.db.get_connection()?;

        // Get total count
        let total = users::table
            .filter(users::created_at.ge(start_date))
            .filter(users::created_at.le(end_date))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        // Get users
        let users = users::table
            .filter(users::created_at.ge(start_date))
            .filter(users::created_at.le(end_date))
            .select((
                users::id,
                users::email,
                users::first_name,
                users::last_name,
                users::status,
                users::email_verified,
                users::created_at,
                users::updated_at,
                users::last_login_at,
            ))
            .order(users::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<(
                Uuid,
                String,
                Option<String>,
                Option<String>,
                String,
                bool,
                chrono::DateTime<chrono::Utc>,
                chrono::DateTime<chrono::Utc>,
                Option<chrono::DateTime<chrono::Utc>>,
            )>(&mut conn)
            .map_err(AppError::Database)?;

        // Get project counts for all users in one query
        let user_infos = self.build_user_infos_with_project_counts(users, &mut conn)?;

        Ok(UserListResponse {
            users: user_infos,
            total,
            page,
            per_page,
        })
    }

    /// Helper: Build user infos with project counts
    fn build_user_infos_with_project_counts(
        &self,
        users: Vec<UserQueryResult>,
        conn: &mut DbConnection,
    ) -> AppResult<Vec<UserInfo>> {
        use diesel::dsl::count_star;

        // Get all user IDs
        let user_ids: Vec<uuid::Uuid> = users.iter().map(|u| u.0).collect();

        // Get project counts for all users in one query
        let project_counts: Vec<(uuid::Uuid, i64)> = projects::table
            .filter(projects::owner_id.eq_any(&user_ids))
            .group_by(projects::owner_id)
            .select((projects::owner_id, count_star()))
            .load::<(uuid::Uuid, i64)>(conn)
            .map_err(|e| {
                log::warn!("Failed to load project counts for users: {}", e);
                AppError::Database(e)
            })?;

        // Create lookup map
        let project_count_map: std::collections::HashMap<uuid::Uuid, i64> =
            project_counts.into_iter().collect();

        // Build user infos with counts from map
        let mut user_infos = Vec::new();
        for (
            id,
            email,
            first_name,
            last_name,
            status,
            email_verified,
            created_at,
            updated_at,
            last_login_at,
        ) in users
        {
            let project_count = project_count_map.get(&id).copied().unwrap_or(0);

            user_infos.push(UserInfo {
                id,
                email: email.clone(),
                name: Some(format!(
                    "{} {}",
                    first_name.clone().unwrap_or_default(),
                    last_name.clone().unwrap_or_default()
                )),
                first_name: first_name.unwrap_or_default(),
                last_name: last_name.unwrap_or_default(),
                role: status,
                is_active: email_verified,
                created_at,
                updated_at,
                last_login: last_login_at,
                project_count,
            });
        }

        Ok(user_infos)
    }
}
