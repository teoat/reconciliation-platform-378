// Authentication and Security Tables
// Extracted from schema.rs for better organization

// Removed account_lockouts (moved to security.rs)

diesel::table! {
    api_keys (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        key_hash -> Varchar,
        #[max_length = 20]
        key_prefix -> Varchar,
        permissions -> Jsonb,
        last_used_at -> Nullable<Timestamptz>,
        expires_at -> Nullable<Timestamptz>,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    email_verification_tokens (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        token_hash -> Varchar,
        expires_at -> Timestamptz,
        used_at -> Nullable<Timestamptz>,
        is_active -> Bool,
        created_at -> Timestamptz,
    }
}

// Removed failed_login_attempts (moved to security.rs)

// Removed ip_access_control (moved to security.rs)

diesel::table! {
    password_reset_tokens (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        token_hash -> Varchar,
        expires_at -> Timestamptz,
        used_at -> Nullable<Timestamptz>,
        is_active -> Bool,
        created_at -> Timestamptz,
    }
}

// Removed security_events (moved to security.rs)

diesel::table! {
    two_factor_auth (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 20]
        method -> Varchar,
        secret -> Nullable<Text>,
        backup_codes -> Nullable<Jsonb>,
        is_enabled -> Bool,
        last_used_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    audit_logs (id) {
        id -> Uuid,
        user_id -> Nullable<Uuid>,
        #[max_length = 100]
        action -> Varchar,
        #[max_length = 100]
        resource_type -> Varchar,
        resource_id -> Nullable<Uuid>,
        details -> Nullable<Jsonb>,
        old_values -> Nullable<Jsonb>,
        new_values -> Nullable<Jsonb>,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    roles (id) {
        id -> Uuid,
        #[max_length = 100]
        name -> Varchar,
        description -> Nullable<Text>,
        is_system_role -> Bool,
        permissions -> Jsonb,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_roles (id) {
        id -> Uuid,
        user_id -> Uuid,
        role_id -> Uuid,
        assigned_by -> Uuid,
        assigned_at -> Timestamptz,
        expires_at -> Nullable<Timestamptz>,
        is_active -> Bool,
    }
}

diesel::table! {
    user_sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        session_token -> Varchar,
        #[max_length = 255]
        refresh_token -> Nullable<Varchar>,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        device_info -> Nullable<Jsonb>,
        is_active -> Bool,
        expires_at -> Timestamptz,
        last_activity -> Timestamptz,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

// Joinable relationships for auth schema
diesel::joinable!(audit_logs -> users (user_id));
diesel::joinable!(account_lockouts -> users (user_id));
diesel::joinable!(api_keys -> users (user_id));
diesel::joinable!(email_verification_tokens -> users (user_id));
diesel::joinable!(password_reset_tokens -> users (user_id));
diesel::joinable!(two_factor_auth -> users (user_id));
diesel::joinable!(user_roles -> users (user_id));
diesel::joinable!(user_roles -> roles (role_id));
diesel::joinable!(user_sessions -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(user_roles, roles);
