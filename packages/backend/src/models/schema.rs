//! Database schema definitions for the Reconciliation Backend
//! 
//! This module contains Diesel table definitions and schema imports.

use diesel::prelude::*;
use diesel::sql_types::Jsonb;
use serde::{Deserialize, Serialize};
use diesel::deserialize::FromSql;
use diesel::serialize::ToSql;
use diesel::pg::Pg;
use diesel::expression::AsExpression;
use std::io::Write;

/// Custom JsonValue type for Diesel compatibility
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, AsExpression)]
#[diesel(sql_type = Jsonb)]
pub struct JsonValue(pub serde_json::Value);

impl FromSql<Jsonb, Pg> for JsonValue {
    fn from_sql(bytes: diesel::pg::PgValue) -> diesel::deserialize::Result<Self> {
        let value = serde_json::from_slice(bytes.as_bytes())?;
        Ok(JsonValue(value))
    }
}

impl ToSql<Jsonb, Pg> for JsonValue {
    fn to_sql(&self, out: &mut diesel::serialize::Output<Pg>) -> diesel::serialize::Result {
        let json_bytes = serde_json::to_vec(&self.0)?;
        out.write_all(&json_bytes)?;
        Ok(diesel::serialize::IsNull::No)
    }
}

// Import all table definitions
table! {
    users (id) {
        id -> Uuid,
        email -> Varchar,
        password_hash -> Varchar,
        first_name -> Varchar,
        last_name -> Varchar,
        role -> Varchar,
        is_active -> Bool,
        last_login -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    projects (id) {
        id -> Uuid,
        name -> Varchar,
        description -> Nullable<Text>,
        owner_id -> Uuid,
        settings -> Nullable<Jsonb>,
        status -> Varchar,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    reconciliation_records (id) {
        id -> Uuid,
        project_id -> Uuid,
        source_system -> Varchar,
        external_id -> Varchar,
        amount -> Nullable<Numeric>,
        currency -> Nullable<Varchar>,
        transaction_date -> Nullable<Timestamptz>,
        description -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        status -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    reconciliation_matches (id) {
        id -> Uuid,
        project_id -> Uuid,
        record_a_id -> Uuid,
        record_b_id -> Uuid,
        match_type -> Varchar,
        confidence_score -> Nullable<Numeric>,
        status -> Varchar,
        notes -> Nullable<Text>,
        created_by -> Nullable<Uuid>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    reconciliation_jobs (id) {
        id -> Uuid,
        project_id -> Uuid,
        name -> Varchar,
        description -> Nullable<Text>,
        status -> Varchar,
        source_a_id -> Uuid,
        source_b_id -> Uuid,
        started_at -> Nullable<Timestamptz>,
        completed_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        settings -> Nullable<Jsonb>,
        confidence_threshold -> Nullable<Float8>,
        progress -> Nullable<Integer>,
        total_records -> Nullable<Integer>,
        processed_records -> Nullable<Integer>,
        matched_records -> Nullable<Integer>,
        unmatched_records -> Nullable<Integer>,
        processing_time_ms -> Nullable<Float8>,
    }
}

table! {
    data_sources (id) {
        id -> Uuid,
        project_id -> Uuid,
        name -> Varchar,
        description -> Nullable<Text>,
        source_type -> Varchar,
        connection_config -> Nullable<Jsonb>,
        file_path -> Nullable<Varchar>,
        file_size -> Nullable<BigInt>,
        file_hash -> Nullable<Varchar>,
        record_count -> Nullable<Integer>,
        schema -> Nullable<Jsonb>,
        status -> Varchar,
        uploaded_at -> Nullable<Timestamptz>,
        processed_at -> Nullable<Timestamptz>,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    reconciliation_results (id) {
        id -> Uuid,
        job_id -> Uuid,
        record_a_id -> Uuid,
        record_b_id -> Nullable<Uuid>,
        match_type -> Varchar,
        confidence_score -> Nullable<Float8>,
        status -> Varchar,
        notes -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    audit_logs (id) {
        id -> Uuid,
        user_id -> Nullable<Uuid>,
        action -> Varchar,
        resource_type -> Varchar,
        resource_id -> Nullable<Uuid>,
        old_values -> Nullable<Jsonb>,
        new_values -> Nullable<Jsonb>,
        ip_address -> Nullable<Varchar>,
        user_agent -> Nullable<Text>,
        created_at -> Timestamptz,
    }
}

table! {
    uploaded_files (id) {
        id -> Uuid,
        project_id -> Uuid,
        filename -> Varchar,
        original_filename -> Varchar,
        file_size -> BigInt,
        content_type -> Varchar,
        file_path -> Varchar,
        status -> Varchar,
        uploaded_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

table! {
    user_activity_logs (id) {
        id -> Uuid,
        user_id -> Uuid,
        action -> Varchar,
        resource_type -> Varchar,
        resource_id -> Nullable<Uuid>,
        details -> Nullable<Jsonb>,
        ip_address -> Nullable<Varchar>,
        user_agent -> Nullable<Varchar>,
        created_at -> Timestamptz,
    }
}

// Join tables
joinable!(projects -> users (owner_id));
joinable!(reconciliation_records -> projects (project_id));
joinable!(reconciliation_matches -> projects (project_id));
joinable!(reconciliation_jobs -> projects (project_id));
joinable!(reconciliation_jobs -> users (created_by));
joinable!(data_sources -> projects (project_id));
joinable!(reconciliation_results -> reconciliation_jobs (job_id));
joinable!(audit_logs -> users (user_id));
joinable!(uploaded_files -> projects (project_id));
joinable!(uploaded_files -> users (uploaded_by));
joinable!(user_activity_logs -> users (user_id));

// Allow Diesel to infer the correct types
allow_tables_to_appear_in_same_query!(
    users,
    projects,
    reconciliation_records,
    reconciliation_matches,
    reconciliation_jobs,
    data_sources,
    reconciliation_results,
    audit_logs,
    uploaded_files,
    user_activity_logs,
);
