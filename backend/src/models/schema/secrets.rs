// Application Secrets Table
// For automatic secret management and rotation

diesel::table! {
    application_secrets (id) {
        id -> Varchar,
        name -> Varchar,
        encrypted_value -> Text,
        min_length -> Integer,
        rotation_interval_days -> Integer,
        last_rotated_at -> Nullable<Timestamptz>,
        next_rotation_due -> Timestamptz,
        created_by -> Varchar,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

