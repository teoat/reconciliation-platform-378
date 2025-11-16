diesel::table! {
    realtime_events (id) {
        id -> Uuid,
        #[max_length = 100]
        event_type -> Varchar,
        #[max_length = 100]
        event_name -> Varchar,
        user_id -> Nullable<Uuid>,
        project_id -> Nullable<Uuid>,
        session_id -> Nullable<Uuid>,
        data -> Jsonb,
        metadata -> Nullable<Jsonb>,
        timestamp -> Timestamptz,
        processed -> Bool,
        processed_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    user_analytics_summary (id) {
        id -> Uuid,
        user_id -> Uuid,
        date -> Date,
        total_actions -> Int4,
        unique_sessions -> Int4,
        time_spent_minutes -> Int4,
        projects_accessed -> Int4,
        files_uploaded -> Int4,
        reconciliations_started -> Int4,
        reconciliations_completed -> Int4,
        errors_encountered -> Int4,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_notification_history (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        notification_type -> Varchar,
        #[max_length = 255]
        title -> Varchar,
        message -> Text,
        #[max_length = 50]
        channel -> Varchar,
        #[max_length = 50]
        status -> Varchar,
        sent_at -> Timestamptz,
        delivered_at -> Nullable<Timestamptz>,
        read_at -> Nullable<Timestamptz>,
         metadata -> Nullable<Jsonb>,
         created_at -> Timestamptz,
     }
 }

// Joinable relationships for analytics schema
diesel::joinable!(realtime_events -> users (user_id));
diesel::joinable!(realtime_events -> projects (project_id));
diesel::joinable!(user_analytics_summary -> users (user_id));
diesel::joinable!(user_notification_history -> users (user_id));