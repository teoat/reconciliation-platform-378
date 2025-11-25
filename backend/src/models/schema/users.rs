// User-related Tables
// Extracted from schema.rs for better organization

diesel::table! {
    users (id) {
        id -> Uuid,
        #[max_length = 255]
        email -> Varchar,
        #[max_length = 255]
        username -> Nullable<Varchar>,
        #[max_length = 100]
        first_name -> Nullable<Varchar>,
        #[max_length = 100]
        last_name -> Nullable<Varchar>,
        #[max_length = 255]
        password_hash -> Varchar,
        #[max_length = 20]
        status -> Varchar,
        email_verified -> Bool,
        email_verified_at -> Nullable<Timestamptz>,
        last_login_at -> Nullable<Timestamptz>,
        last_active_at -> Nullable<Timestamptz>,
        password_expires_at -> Nullable<Timestamptz>,
        password_last_changed -> Nullable<Timestamptz>,
        password_history -> Nullable<Jsonb>,
        #[max_length = 50]
        auth_provider -> Nullable<Varchar>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_activities (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        activity_type -> Varchar,
        #[max_length = 255]
        description -> Nullable<Varchar>,
        metadata -> Nullable<Jsonb>,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}


diesel::table! {
    user_dashboards (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        layout -> Jsonb,
        widgets -> Jsonb,
        is_default -> Bool,
        is_public -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_devices (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        device_id -> Varchar,
        #[max_length = 100]
        device_type -> Varchar,
        #[max_length = 255]
        device_name -> Nullable<Varchar>,
        #[max_length = 50]
        os -> Nullable<Varchar>,
        #[max_length = 50]
        browser -> Nullable<Varchar>,
        last_seen_at -> Timestamptz,
        is_active -> Bool,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    user_feature_usage (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        feature_name -> Varchar,
        usage_count -> Int4,
        last_used_at -> Timestamptz,
        total_time_spent -> Int4,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_feedback (id) {
        id -> Uuid,
        user_id -> Nullable<Uuid>,
        #[max_length = 50]
        feedback_type -> Varchar,
        #[max_length = 255]
        subject -> Varchar,
        content -> Text,
        rating -> Nullable<Int2>,
        metadata -> Nullable<Jsonb>,
        is_resolved -> Bool,
        resolved_by -> Nullable<Uuid>,
        resolved_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_learning_progress (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        module_name -> Varchar,
        progress_percentage -> Int2,
        completed_lessons -> Jsonb,
        time_spent -> Int4,
        last_accessed_at -> Timestamptz,
        completed_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}


diesel::table! {
    user_preferences (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        preference_key -> Varchar,
        preference_value -> Jsonb,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_presence (id) {
        id -> Uuid,
        user_id -> Uuid,
        current_project_id -> Nullable<Uuid>,
        #[max_length = 20]
        status -> Varchar,
        last_seen_at -> Timestamptz,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}



diesel::table! {
    user_teams (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        team_name -> Varchar,
        #[max_length = 50]
        role_in_team -> Varchar,
        joined_at -> Timestamptz,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_workspaces (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        workspace_name -> Varchar,
        #[max_length = 50]
        role_in_workspace -> Varchar,
        joined_at -> Timestamptz,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}