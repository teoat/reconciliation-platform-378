// Notification-related Tables
// Extracted from schema.rs for better organization

diesel::table! {
    notifications (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        title -> Varchar,
        message -> Text,
        #[max_length = 50]
        notification_type -> Varchar,
        read -> Bool,
        read_at -> Nullable<Timestamptz>,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    notification_preferences (id) {
        id -> Uuid,
        user_id -> Uuid,
        email -> Bool,
        push -> Bool,
        reconciliation_complete -> Bool,
        job_failed -> Bool,
        project_updated -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

// Joinable relationships
diesel::joinable!(notifications -> users (user_id));
diesel::joinable!(notification_preferences -> users (user_id));

// Allow tables to appear in same query
diesel::allow_tables_to_appear_in_same_query!(notifications, users);
diesel::allow_tables_to_appear_in_same_query!(notification_preferences, users);

