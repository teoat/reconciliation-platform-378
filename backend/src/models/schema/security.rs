diesel::table! {
    account_lockouts (id) {
        id -> Uuid,
        user_id -> Uuid,
        locked_at -> Timestamptz,
        locked_until -> Timestamptz,
        #[max_length = 255]
        reason -> Varchar,
        unlocked_by -> Nullable<Uuid>,
        unlocked_at -> Nullable<Timestamptz>,
        is_active -> Bool,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    failed_login_attempts (id) {
        id -> Uuid,
        #[max_length = 255]
        email -> Varchar,
        ip_address -> Inet,
        user_agent -> Nullable<Text>,
        attempted_at -> Timestamptz,
        success -> Bool,
        #[max_length = 255]
        failure_reason -> Nullable<Varchar>,
    }
}

diesel::table! {
    ip_access_control (id) {
        id -> Uuid,
        ip_address -> Inet,
        ip_range -> Nullable<Cidr>,
        #[max_length = 20]
        action -> Varchar,
        reason -> Nullable<Text>,
        expires_at -> Nullable<Timestamptz>,
        is_active -> Bool,
        created_by -> Nullable<Uuid>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    rate_limit_entries (id) {
        id -> Uuid,
        #[max_length = 255]
        identifier -> Varchar,
        #[max_length = 255]
        endpoint -> Varchar,
        request_count -> Int4,
        window_start -> Timestamptz,
        window_end -> Timestamptz,
        blocked_until -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    security_events (id) {
        id -> Uuid,
        #[max_length = 100]
        event_type -> Varchar,
        #[max_length = 20]
        severity -> Varchar,
        user_id -> Nullable<Uuid>,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        #[max_length = 100]
        resource_type -> Nullable<Varchar>,
        resource_id -> Nullable<Uuid>,
        #[max_length = 100]
        action -> Varchar,
        details -> Nullable<Jsonb>,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
    }
}