// @generated automatically by Diesel CLI.

diesel::table! {
    password_entries (id) {
        id -> Varchar,
        name -> Varchar,
        encrypted_password -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        last_rotated_at -> Nullable<Timestamptz>,
        rotation_interval_days -> Integer,
        next_rotation_due -> Timestamptz,
        is_active -> Bool,
        created_by -> Nullable<Varchar>,
        metadata -> Nullable<Jsonb>,
    }
}

diesel::table! {
    password_audit_log (id) {
        id -> Int4,
        password_entry_id -> Varchar,
        action -> Varchar,
        user_id -> Nullable<Varchar>,
        ip_address -> Nullable<Varchar>,
        user_agent -> Nullable<Text>,
        timestamp -> Timestamptz,
        metadata -> Nullable<Jsonb>,
    }
}

diesel::joinable!(password_audit_log -> password_entries (password_entry_id));

diesel::allow_tables_to_appear_in_same_query!(
    password_entries,
    password_audit_log,
);

