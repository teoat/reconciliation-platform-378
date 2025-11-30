use chrono::{DateTime, Utc};
use diesel::deserialize::{self, FromSql};
use diesel::serialize::{self, Output, ToSql};
use diesel::sql_types::Text;
use diesel::{AsChangeset, Insertable, Queryable};
use serde::{Deserialize, Serialize};
use std::io::Write;
use uuid::Uuid;
use validator::Validate;

// This will represent the user data as stored in the database.
// It includes fields that are internal (like password_hash) and external.
// Assuming a `users` table in a `schema` module, which we will create or link later.
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Insertable, AsChangeset)]
#[diesel(table_name = crate::models::schema::users)]
pub struct User {
    pub id: Uuid,
    pub username: Option<String>,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub status: UserStatus,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email_verified: bool,
}

// Enum for user status
#[derive(
    Debug, Clone, Serialize, Deserialize, PartialEq, Eq, diesel::FromSqlRow, diesel::AsExpression,
)]
#[diesel(sql_type = Text)]
pub enum UserStatus {
    #[serde(rename = "active")]
    Active,
    #[serde(rename = "pending_verification")]
    PendingVerification,
    #[serde(rename = "suspended")]
    Suspended,
    #[serde(rename = "deactivated")]
    Deactivated,
}

// Implement FromSql and ToSql for UserStatus enum to allow Diesel to store it as TEXT
impl ToSql<Text, diesel::pg::Pg> for UserStatus {
    fn to_sql<'b>(&'b self, out: &mut Output<'b, '_, diesel::pg::Pg>) -> serialize::Result {
        match *self {
            UserStatus::Active => out.write_all(b"active")?,
            UserStatus::PendingVerification => out.write_all(b"pending_verification")?,
            UserStatus::Suspended => out.write_all(b"suspended")?,
            UserStatus::Deactivated => out.write_all(b"deactivated")?,
        }
        Ok(serialize::IsNull::No)
    }
}

impl FromSql<Text, diesel::pg::Pg> for UserStatus {
    fn from_sql(
        bytes: <diesel::pg::Pg as diesel::backend::Backend>::RawValue<'_>,
    ) -> deserialize::Result<Self> {
        match std::str::from_utf8(bytes.as_bytes())? {
            "active" => Ok(UserStatus::Active),
            "pending_verification" => Ok(UserStatus::PendingVerification),
            "suspended" => Ok(UserStatus::Suspended),
            "deactivated" => Ok(UserStatus::Deactivated),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 1, max = 255))]
    pub username: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8, max = 128))] // Example: min 8 chars for password
    pub password: String,
    pub roles: Option<Vec<Uuid>>, // Optional initial roles by ID
}

// DTO for updating an existing user
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>, // Only if password update is part of general update
    pub status: Option<UserStatus>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

// DTO for user response (what's sent back to the client)
// Excludes sensitive fields like password_hash
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: Option<String>,
    pub email: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub status: UserStatus,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email_verified: bool,
    pub roles: Option<Vec<UserRoleResponse>>, // Include roles for response
}

// DTO for user role response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserRoleResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub joined_at: chrono::DateTime<chrono::Utc>,
}
