// @generated automatically by Diesel CLI.

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
    accounts (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        provider -> Varchar,
        #[max_length = 255]
        provider_account_id -> Varchar,
        refresh_token -> Nullable<Text>,
        access_token -> Nullable<Text>,
        expires_at -> Nullable<Timestamp>,
        #[max_length = 50]
        token_type -> Nullable<Varchar>,
        scope -> Nullable<Text>,
        id_token -> Nullable<Text>,
        session_state -> Nullable<Text>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    adjudication_cases (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        case_number -> Varchar,
        #[max_length = 255]
        title -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 50]
        case_type -> Varchar,
        #[max_length = 50]
        status -> Varchar,
        #[max_length = 20]
        priority -> Varchar,
        assigned_to -> Nullable<Uuid>,
        assigned_at -> Nullable<Timestamptz>,
        resolved_by -> Nullable<Uuid>,
        resolved_at -> Nullable<Timestamptz>,
        resolution_notes -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    adjudication_decisions (id) {
        id -> Uuid,
        case_id -> Uuid,
        #[max_length = 50]
        decision_type -> Varchar,
        decision_text -> Text,
        #[max_length = 50]
        status -> Varchar,
        appealed -> Bool,
        appeal_reason -> Nullable<Text>,
        appealed_at -> Nullable<Timestamptz>,
        decided_by -> Uuid,
        decided_at -> Timestamptz,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    adjudication_workflows (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        project_id -> Nullable<Uuid>,
        definition -> Jsonb,
        is_active -> Bool,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

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
    application_errors (id) {
        id -> Uuid,
        #[max_length = 100]
        error_type -> Varchar,
        error_message -> Text,
        stack_trace -> Nullable<Text>,
        user_id -> Nullable<Uuid>,
        #[max_length = 255]
        request_id -> Nullable<Varchar>,
        #[max_length = 255]
        endpoint -> Nullable<Varchar>,
        #[max_length = 10]
        method -> Nullable<Varchar>,
        status_code -> Nullable<Int4>,
        #[max_length = 20]
        severity -> Varchar,
        resolved -> Bool,
        resolved_by -> Nullable<Uuid>,
        resolved_at -> Nullable<Timestamptz>,
        metadata -> Nullable<Jsonb>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    application_secrets (id) {
        #[max_length = 255]
        id -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        encrypted_value -> Text,
        min_length -> Int4,
        rotation_interval_days -> Int4,
        last_rotated_at -> Nullable<Timestamptz>,
        next_rotation_due -> Timestamptz,
        #[max_length = 255]
        created_by -> Varchar,
        is_active -> Bool,
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
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    auth_audit_log (id) {
        id -> Uuid,
        user_id -> Nullable<Uuid>,
        #[max_length = 100]
        event_type -> Varchar,
        #[max_length = 50]
        auth_method -> Nullable<Varchar>,
        success -> Bool,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        error_message -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamp,
    }
}

diesel::table! {
    better_auth_accounts (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        provider -> Varchar,
        provider_account_id -> Text,
        provider_email -> Nullable<Text>,
        provider_name -> Nullable<Text>,
        access_token -> Nullable<Text>,
        refresh_token -> Nullable<Text>,
        expires_at -> Nullable<Timestamp>,
        #[max_length = 50]
        token_type -> Nullable<Varchar>,
        scope -> Nullable<Text>,
        id_token -> Nullable<Text>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    better_auth_sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        token -> Text,
        refresh_token -> Nullable<Text>,
        expires_at -> Timestamp,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        last_activity -> Nullable<Timestamp>,
    }
}

diesel::table! {
    better_auth_verification_tokens (id) {
        id -> Uuid,
        user_id -> Uuid,
        token -> Text,
        #[max_length = 50]
        token_type -> Varchar,
        expires_at -> Timestamp,
        created_at -> Timestamp,
        used_at -> Nullable<Timestamp>,
        ip_address -> Nullable<Inet>,
    }
}

diesel::table! {
    cache_invalidations (id) {
        id -> Uuid,
        #[max_length = 100]
        cache_name -> Varchar,
        #[max_length = 255]
        key_pattern -> Varchar,
        #[max_length = 255]
        invalidation_reason -> Varchar,
        #[max_length = 100]
        triggered_by -> Nullable<Varchar>,
        triggered_by_id -> Nullable<Uuid>,
        affected_keys_count -> Nullable<Int4>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    cache_statistics (id) {
        id -> Uuid,
        #[max_length = 100]
        cache_name -> Varchar,
        #[max_length = 50]
        operation -> Varchar,
        #[max_length = 255]
        key_pattern -> Nullable<Varchar>,
        key_size_bytes -> Nullable<Int4>,
        value_size_bytes -> Nullable<Int4>,
        ttl_seconds -> Nullable<Int4>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    cashflow_categories (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 50]
        category_type -> Varchar,
        parent_id -> Nullable<Uuid>,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    cashflow_discrepancies (id) {
        id -> Uuid,
        project_id -> Uuid,
        transaction_a_id -> Nullable<Uuid>,
        transaction_b_id -> Nullable<Uuid>,
        #[max_length = 50]
        discrepancy_type -> Varchar,
        amount_difference -> Numeric,
        description -> Nullable<Text>,
        #[max_length = 50]
        status -> Varchar,
        resolved_by -> Nullable<Uuid>,
        resolved_at -> Nullable<Timestamptz>,
        resolution_notes -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    cashflow_transactions (id) {
        id -> Uuid,
        project_id -> Uuid,
        category_id -> Nullable<Uuid>,
        amount -> Numeric,
        #[max_length = 3]
        currency -> Varchar,
        transaction_date -> Date,
        description -> Nullable<Text>,
        #[max_length = 255]
        reference_number -> Nullable<Varchar>,
        metadata -> Nullable<Jsonb>,
        created_by -> Nullable<Uuid>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    charts (id) {
        id -> Uuid,
        project_id -> Nullable<Uuid>,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 50]
        chart_type -> Varchar,
        data_source -> Jsonb,
        configuration -> Jsonb,
        is_public -> Bool,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    collaboration_comments (id) {
        id -> Uuid,
        session_id -> Uuid,
        user_id -> Uuid,
        parent_comment_id -> Nullable<Uuid>,
        content -> Text,
        #[max_length = 50]
        target_type -> Nullable<Varchar>,
        target_id -> Nullable<Uuid>,
        position -> Nullable<Jsonb>,
        is_resolved -> Bool,
        resolved_by -> Nullable<Uuid>,
        resolved_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    collaboration_participants (id) {
        id -> Uuid,
        session_id -> Uuid,
        user_id -> Uuid,
        joined_at -> Timestamptz,
        left_at -> Nullable<Timestamptz>,
        #[max_length = 50]
        role -> Varchar,
        permissions -> Nullable<Jsonb>,
        is_active -> Bool,
    }
}

diesel::table! {
    collaboration_sessions (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        session_name -> Nullable<Varchar>,
        description -> Nullable<Text>,
        created_by -> Uuid,
        is_active -> Bool,
        max_participants -> Nullable<Int4>,
        settings -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    dashboards (id) {
        id -> Uuid,
        project_id -> Nullable<Uuid>,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        layout -> Jsonb,
        widgets -> Jsonb,
        is_default -> Bool,
        is_public -> Bool,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    data_sources (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 100]
        source_type -> Varchar,
        connection_config -> Nullable<Jsonb>,
        #[max_length = 500]
        file_path -> Nullable<Varchar>,
        file_size -> Nullable<Int8>,
        #[max_length = 64]
        file_hash -> Nullable<Varchar>,
        record_count -> Nullable<Int4>,
        schema -> Nullable<Jsonb>,
        #[max_length = 50]
        status -> Varchar,
        uploaded_at -> Nullable<Timestamptz>,
        processed_at -> Nullable<Timestamptz>,
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
        #[max_length = 255]
        email -> Varchar,
        expires_at -> Timestamptz,
        verified_at -> Nullable<Timestamptz>,
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
    field_locks (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        field_id -> Varchar,
        user_id -> Uuid,
        locked_at -> Timestamptz,
        expires_at -> Timestamptz,
        is_active -> Bool,
    }
}

diesel::table! {
    file_processing_metrics (id) {
        id -> Uuid,
        file_id -> Uuid,
        #[max_length = 255]
        file_name -> Varchar,
        file_size_bytes -> Int8,
        processing_time_ms -> Int4,
        records_processed -> Nullable<Int4>,
        records_failed -> Nullable<Int4>,
        #[max_length = 100]
        processing_stage -> Varchar,
        error_message -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    ingestion_errors (id) {
        id -> Uuid,
        job_id -> Uuid,
        #[max_length = 50]
        error_type -> Varchar,
        error_message -> Text,
        record_data -> Nullable<Jsonb>,
        record_index -> Nullable<Int4>,
        stack_trace -> Nullable<Text>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    ingestion_jobs (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        filename -> Varchar,
        #[max_length = 50]
        status -> Varchar,
        metadata -> Text,
        quality_metrics -> Text,
        record_count -> Int4,
        error_message -> Nullable<Text>,
        created_by -> Uuid,
        started_at -> Nullable<Timestamptz>,
        completed_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    ingestion_results (id) {
        id -> Uuid,
        job_id -> Uuid,
        record_data -> Jsonb,
        record_index -> Int4,
        #[max_length = 50]
        status -> Varchar,
        validation_errors -> Nullable<Jsonb>,
        transformation_applied -> Nullable<Jsonb>,
        created_at -> Timestamptz,
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
    notification_preferences (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        notification_type -> Varchar,
        enabled -> Bool,
        channels -> Jsonb,
        settings -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

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
    password_audit_log (id) {
        id -> Int4,
        #[max_length = 36]
        password_entry_id -> Varchar,
        #[max_length = 50]
        action -> Varchar,
        #[max_length = 255]
        user_id -> Nullable<Varchar>,
        #[max_length = 45]
        ip_address -> Nullable<Varchar>,
        user_agent -> Nullable<Text>,
        timestamp -> Timestamptz,
        metadata -> Nullable<Jsonb>,
    }
}

diesel::table! {
    password_entries (id) {
        #[max_length = 36]
        id -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        encrypted_password -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        last_rotated_at -> Nullable<Timestamptz>,
        rotation_interval_days -> Int4,
        next_rotation_due -> Timestamptz,
        is_active -> Bool,
        #[max_length = 255]
        created_by -> Nullable<Varchar>,
        metadata -> Nullable<Jsonb>,
    }
}

diesel::table! {
    password_reset_tokens (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        token_hash -> Varchar,
        expires_at -> Timestamptz,
        used_at -> Nullable<Timestamptz>,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    performance_alerts (id) {
        id -> Uuid,
        #[max_length = 100]
        alert_type -> Varchar,
        #[max_length = 255]
        alert_name -> Varchar,
        threshold_value -> Numeric,
        current_value -> Numeric,
        #[max_length = 20]
        severity -> Varchar,
        #[max_length = 20]
        status -> Varchar,
        acknowledged_by -> Nullable<Uuid>,
        acknowledged_at -> Nullable<Timestamptz>,
        resolved_at -> Nullable<Timestamptz>,
        description -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    performance_metrics (id) {
        id -> Uuid,
        #[max_length = 100]
        metric_name -> Varchar,
        #[max_length = 50]
        metric_type -> Varchar,
        metric_value -> Numeric,
        labels -> Jsonb,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    project_members (id) {
        id -> Uuid,
        project_id -> Nullable<Uuid>,
        user_id -> Nullable<Uuid>,
        #[max_length = 50]
        role -> Nullable<Varchar>,
        permissions -> Nullable<Jsonb>,
        joined_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    projects (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 50]
        status -> Nullable<Varchar>,
        #[sql_name = "type"]
        #[max_length = 100]
        type_ -> Nullable<Varchar>,
        owner_id -> Nullable<Uuid>,
        settings -> Nullable<Jsonb>,
        data -> Nullable<Jsonb>,
        analytics -> Nullable<Jsonb>,
        created_at -> Nullable<Timestamp>,
        updated_at -> Nullable<Timestamp>,
        created_by -> Nullable<Uuid>,
    }
}

diesel::table! {
    query_performance (id) {
        id -> Uuid,
        #[max_length = 64]
        query_hash -> Varchar,
        query_text -> Text,
        execution_time_ms -> Int4,
        rows_examined -> Nullable<Int4>,
        rows_returned -> Nullable<Int4>,
        query_plan -> Nullable<Jsonb>,
        is_slow -> Bool,
        slow_query_threshold_ms -> Nullable<Int4>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
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
    reconciliation_jobs (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 50]
        status -> Varchar,
        started_at -> Nullable<Timestamptz>,
        completed_at -> Nullable<Timestamptz>,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        settings -> Nullable<Jsonb>,
        confidence_threshold -> Nullable<Numeric>,
        progress -> Nullable<Int4>,
        total_records -> Nullable<Int4>,
        processed_records -> Nullable<Int4>,
        matched_records -> Nullable<Int4>,
        unmatched_records -> Nullable<Int4>,
    }
}

diesel::table! {
    reconciliation_performance (id) {
        id -> Uuid,
        job_id -> Uuid,
        total_records -> Int4,
        processing_time_ms -> Int4,
        matching_time_ms -> Int4,
        confidence_calculation_time_ms -> Int4,
        memory_usage_mb -> Nullable<Int4>,
        cpu_usage_percent -> Nullable<Numeric>,
        throughput_records_per_second -> Nullable<Numeric>,
        error_count -> Nullable<Int4>,
        retry_count -> Nullable<Int4>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    reconciliation_records (id) {
        id -> Uuid,
        project_id -> Uuid,
        ingestion_job_id -> Uuid,
        #[max_length = 255]
        external_id -> Nullable<Varchar>,
        #[max_length = 50]
        status -> Varchar,
        amount -> Nullable<Float8>,
        transaction_date -> Nullable<Date>,
        description -> Nullable<Text>,
        source_data -> Text,
        matching_results -> Text,
        confidence -> Nullable<Float8>,
        audit_trail -> Text,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    reconciliation_results (id) {
        id -> Uuid,
        job_id -> Uuid,
        record_a_id -> Uuid,
        record_b_id -> Nullable<Uuid>,
        #[max_length = 50]
        match_type -> Varchar,
        confidence_score -> Nullable<Numeric>,
        match_details -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        #[max_length = 50]
        status -> Varchar,
        data -> Nullable<Jsonb>,
    }
}

diesel::table! {
    reports (id) {
        id -> Uuid,
        project_id -> Nullable<Uuid>,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        #[max_length = 50]
        report_type -> Varchar,
        template -> Jsonb,
        schedule -> Nullable<Jsonb>,
        last_generated_at -> Nullable<Timestamptz>,
        #[max_length = 50]
        status -> Varchar,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    request_metrics (id) {
        id -> Uuid,
        #[max_length = 10]
        method -> Varchar,
        #[max_length = 255]
        endpoint -> Varchar,
        status_code -> Int4,
        response_time_ms -> Int4,
        request_size_bytes -> Nullable<Int4>,
        response_size_bytes -> Nullable<Int4>,
        user_id -> Nullable<Uuid>,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        timestamp -> Timestamptz,
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
    schema_migrations (id) {
        id -> Int4,
        #[max_length = 255]
        migration -> Varchar,
        executed_at -> Nullable<Timestamp>,
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

diesel::table! {
    security_policies (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Text,
        #[max_length = 50]
        category -> Varchar,
        is_active -> Bool,
        rules -> Jsonb,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        token -> Text,
        expires_at -> Timestamp,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    subscriptions (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        tier -> Varchar,
        #[max_length = 50]
        status -> Varchar,
        #[max_length = 20]
        billing_cycle -> Varchar,
        starts_at -> Timestamp,
        ends_at -> Nullable<Timestamp>,
        cancel_at_period_end -> Bool,
        #[max_length = 255]
        stripe_subscription_id -> Nullable<Varchar>,
        #[max_length = 255]
        stripe_customer_id -> Nullable<Varchar>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    sync_change_tracking (id) {
        id -> Uuid,
        sync_configuration_id -> Uuid,
        #[max_length = 255]
        table_name -> Varchar,
        record_id -> Text,
        #[max_length = 20]
        change_type -> Varchar,
        change_timestamp -> Timestamptz,
        synced_at -> Nullable<Timestamptz>,
        sync_execution_id -> Nullable<Uuid>,
        metadata -> Nullable<Jsonb>,
    }
}

diesel::table! {
    sync_configurations (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 255]
        source_table -> Varchar,
        #[max_length = 255]
        target_table -> Varchar,
        source_database_url -> Nullable<Text>,
        target_database_url -> Nullable<Text>,
        #[max_length = 50]
        sync_strategy -> Varchar,
        #[max_length = 50]
        conflict_resolution -> Varchar,
        batch_size -> Int4,
        sync_interval_seconds -> Nullable<Int4>,
        enabled -> Bool,
        last_sync_at -> Nullable<Timestamptz>,
        next_sync_at -> Nullable<Timestamptz>,
        #[max_length = 50]
        sync_status -> Varchar,
        error_message -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    sync_conflicts (id) {
        id -> Uuid,
        sync_configuration_id -> Uuid,
        sync_execution_id -> Nullable<Uuid>,
        #[max_length = 255]
        table_name -> Varchar,
        record_id -> Text,
        source_data -> Nullable<Jsonb>,
        target_data -> Nullable<Jsonb>,
        #[max_length = 50]
        conflict_type -> Varchar,
        #[max_length = 50]
        resolution -> Nullable<Varchar>,
        resolved_at -> Nullable<Timestamptz>,
        resolved_by -> Nullable<Uuid>,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    sync_executions (id) {
        id -> Uuid,
        sync_configuration_id -> Uuid,
        started_at -> Timestamptz,
        completed_at -> Nullable<Timestamptz>,
        #[max_length = 50]
        status -> Varchar,
        records_processed -> Int8,
        records_inserted -> Int8,
        records_updated -> Int8,
        records_deleted -> Int8,
        records_failed -> Int8,
        duration_ms -> Nullable<Int8>,
        error_message -> Nullable<Text>,
        metadata -> Nullable<Jsonb>,
    }
}

diesel::table! {
    system_metrics (id) {
        id -> Uuid,
        #[max_length = 100]
        metric_name -> Varchar,
        metric_value -> Numeric,
        tags -> Nullable<Jsonb>,
        timestamp -> Timestamptz,
    }
}

diesel::table! {
    system_resources (id) {
        id -> Uuid,
        #[max_length = 50]
        metric_type -> Varchar,
        #[max_length = 100]
        metric_name -> Varchar,
        metric_value -> Numeric,
        #[max_length = 20]
        unit -> Varchar,
        labels -> Jsonb,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    team_members (id) {
        id -> Uuid,
        team_id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        role -> Varchar,
        permissions -> Nullable<Jsonb>,
        joined_at -> Timestamptz,
        invited_by -> Nullable<Uuid>,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    teams (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        owner_id -> Uuid,
        settings -> Nullable<Jsonb>,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    two_factor_auth (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        method -> Varchar,
        #[max_length = 255]
        secret -> Nullable<Varchar>,
        backup_codes -> Nullable<Jsonb>,
        is_enabled -> Bool,
        last_used_at -> Nullable<Timestamptz>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    uploaded_files (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        filename -> Varchar,
        #[max_length = 255]
        original_filename -> Varchar,
        #[max_length = 500]
        file_path -> Varchar,
        file_size -> Int8,
        #[max_length = 100]
        content_type -> Nullable<Varchar>,
        #[max_length = 64]
        file_hash -> Nullable<Varchar>,
        #[max_length = 50]
        status -> Varchar,
        uploaded_by -> Uuid,
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
        activity_name -> Varchar,
        #[max_length = 100]
        resource_type -> Nullable<Varchar>,
        resource_id -> Nullable<Uuid>,
        details -> Nullable<Jsonb>,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        #[max_length = 255]
        session_id -> Nullable<Varchar>,
        timestamp -> Timestamptz,
        created_at -> Timestamptz,
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
    user_dashboards (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        dashboard_name -> Varchar,
        #[max_length = 50]
        dashboard_type -> Varchar,
        layout_config -> Jsonb,
        widget_configs -> Jsonb,
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
        #[max_length = 50]
        device_type -> Varchar,
        #[max_length = 100]
        browser_name -> Nullable<Varchar>,
        #[max_length = 50]
        browser_version -> Nullable<Varchar>,
        #[max_length = 100]
        operating_system -> Nullable<Varchar>,
        #[max_length = 20]
        screen_resolution -> Nullable<Varchar>,
        #[max_length = 100]
        timezone -> Nullable<Varchar>,
        #[max_length = 10]
        language -> Nullable<Varchar>,
        is_primary -> Bool,
        last_seen -> Timestamptz,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_feature_usage (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        feature_name -> Varchar,
        usage_count -> Int4,
        first_used_at -> Timestamptz,
        last_used_at -> Timestamptz,
        total_time_spent_minutes -> Int4,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_feedback (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 100]
        feedback_type -> Varchar,
        #[max_length = 100]
        resource_type -> Nullable<Varchar>,
        resource_id -> Nullable<Uuid>,
        rating -> Nullable<Int4>,
        #[max_length = 255]
        title -> Nullable<Varchar>,
        description -> Nullable<Text>,
        #[max_length = 50]
        status -> Varchar,
        #[max_length = 20]
        priority -> Varchar,
        assigned_to -> Nullable<Uuid>,
        resolved_at -> Nullable<Timestamptz>,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_learning_progress (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        module_name -> Varchar,
        #[max_length = 100]
        module_type -> Varchar,
        progress_percentage -> Numeric,
        completed_steps -> Int4,
        total_steps -> Int4,
        time_spent_minutes -> Int4,
        last_accessed -> Nullable<Timestamptz>,
        completed_at -> Nullable<Timestamptz>,
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
        #[max_length = 20]
        status -> Varchar,
        #[max_length = 255]
        current_page -> Nullable<Varchar>,
        current_project_id -> Nullable<Uuid>,
        last_seen -> Timestamptz,
        cursor_position -> Nullable<Jsonb>,
        selection_range -> Nullable<Jsonb>,
        is_typing -> Bool,
        #[max_length = 255]
        typing_in_field -> Nullable<Varchar>,
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

diesel::table! {
    user_teams (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        team_name -> Varchar,
        #[max_length = 100]
        team_role -> Varchar,
        joined_at -> Timestamptz,
        left_at -> Nullable<Timestamptz>,
        is_active -> Bool,
        permissions -> Jsonb,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    user_workspaces (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        workspace_name -> Varchar,
        #[max_length = 50]
        workspace_type -> Varchar,
        settings -> Jsonb,
        layout_config -> Jsonb,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    users (id) {
        id -> Uuid,
        #[max_length = 255]
        email -> Varchar,
        #[max_length = 255]
        password_hash -> Varchar,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 50]
        role -> Nullable<Varchar>,
        permissions -> Nullable<Jsonb>,
        preferences -> Nullable<Jsonb>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        password_expires_at -> Nullable<Timestamptz>,
        password_last_changed -> Nullable<Timestamptz>,
        password_history -> Nullable<Jsonb>,
        #[max_length = 50]
        auth_provider -> Nullable<Varchar>,
        #[max_length = 255]
        username -> Varchar,
        #[max_length = 100]
        first_name -> Nullable<Varchar>,
        #[max_length = 100]
        last_name -> Nullable<Varchar>,
        #[max_length = 20]
        status -> Varchar,
        email_verified -> Bool,
        email_verified_at -> Nullable<Timestamptz>,
        last_login_at -> Nullable<Timestamptz>,
        last_active_at -> Nullable<Timestamptz>,
        is_initial_password -> Nullable<Bool>,
        initial_password_set_at -> Nullable<Timestamptz>,
        better_auth_id -> Nullable<Text>,
        #[max_length = 50]
        migration_status -> Nullable<Varchar>,
        #[max_length = 50]
        last_auth_method -> Nullable<Varchar>,
        picture -> Nullable<Text>,
        two_factor_enabled -> Bool,
        #[max_length = 255]
        provider_id -> Nullable<Varchar>,
    }
}

diesel::table! {
    verification_tokens (id) {
        id -> Uuid,
        #[max_length = 255]
        identifier -> Varchar,
        token -> Text,
        expires_at -> Timestamp,
        created_at -> Timestamp,
    }
}

diesel::table! {
    websocket_sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        #[max_length = 255]
        session_id -> Varchar,
        #[max_length = 255]
        connection_id -> Varchar,
        ip_address -> Nullable<Inet>,
        user_agent -> Nullable<Text>,
        connected_at -> Timestamptz,
        last_ping -> Nullable<Timestamptz>,
        is_active -> Bool,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    workflow_instances (id) {
        id -> Uuid,
        workflow_id -> Uuid,
        #[max_length = 50]
        status -> Varchar,
        #[max_length = 255]
        current_step -> Nullable<Varchar>,
        state -> Nullable<Jsonb>,
        started_by -> Nullable<Uuid>,
        started_at -> Nullable<Timestamptz>,
        completed_at -> Nullable<Timestamptz>,
        error_message -> Nullable<Text>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    workflow_rules (id) {
        id -> Uuid,
        workflow_id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        condition -> Jsonb,
        action -> Jsonb,
        priority -> Int4,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    workflows (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        project_id -> Nullable<Uuid>,
        definition -> Jsonb,
        #[max_length = 50]
        status -> Varchar,
        created_by -> Uuid,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::joinable!(accounts -> users (user_id));
diesel::joinable!(adjudication_cases -> projects (project_id));
diesel::joinable!(adjudication_decisions -> adjudication_cases (case_id));
diesel::joinable!(adjudication_decisions -> users (decided_by));
diesel::joinable!(adjudication_workflows -> projects (project_id));
diesel::joinable!(adjudication_workflows -> users (created_by));
diesel::joinable!(api_keys -> users (user_id));
diesel::joinable!(audit_logs -> users (user_id));
diesel::joinable!(auth_audit_log -> users (user_id));
diesel::joinable!(better_auth_accounts -> users (user_id));
diesel::joinable!(better_auth_sessions -> users (user_id));
diesel::joinable!(better_auth_verification_tokens -> users (user_id));
diesel::joinable!(cashflow_categories -> projects (project_id));
diesel::joinable!(cashflow_discrepancies -> projects (project_id));
diesel::joinable!(cashflow_discrepancies -> users (resolved_by));
diesel::joinable!(cashflow_transactions -> cashflow_categories (category_id));
diesel::joinable!(cashflow_transactions -> projects (project_id));
diesel::joinable!(cashflow_transactions -> users (created_by));
diesel::joinable!(charts -> projects (project_id));
diesel::joinable!(charts -> users (created_by));
diesel::joinable!(collaboration_comments -> collaboration_sessions (session_id));
diesel::joinable!(collaboration_participants -> collaboration_sessions (session_id));
diesel::joinable!(collaboration_participants -> users (user_id));
diesel::joinable!(collaboration_sessions -> projects (project_id));
diesel::joinable!(collaboration_sessions -> users (created_by));
diesel::joinable!(dashboards -> projects (project_id));
diesel::joinable!(dashboards -> users (created_by));
diesel::joinable!(data_sources -> projects (project_id));
diesel::joinable!(email_verification_tokens -> users (user_id));
diesel::joinable!(field_locks -> projects (project_id));
diesel::joinable!(field_locks -> users (user_id));
diesel::joinable!(ingestion_errors -> ingestion_jobs (job_id));
diesel::joinable!(ingestion_jobs -> projects (project_id));
diesel::joinable!(ingestion_jobs -> users (created_by));
diesel::joinable!(ingestion_results -> ingestion_jobs (job_id));
diesel::joinable!(ip_access_control -> users (created_by));
diesel::joinable!(notification_preferences -> users (user_id));
diesel::joinable!(notifications -> users (user_id));
diesel::joinable!(password_audit_log -> password_entries (password_entry_id));
diesel::joinable!(password_reset_tokens -> users (user_id));
diesel::joinable!(performance_alerts -> users (acknowledged_by));
diesel::joinable!(project_members -> projects (project_id));
diesel::joinable!(project_members -> users (user_id));
diesel::joinable!(realtime_events -> collaboration_sessions (session_id));
diesel::joinable!(realtime_events -> projects (project_id));
diesel::joinable!(realtime_events -> users (user_id));
diesel::joinable!(reconciliation_jobs -> projects (project_id));
diesel::joinable!(reconciliation_jobs -> users (created_by));
diesel::joinable!(reconciliation_performance -> reconciliation_jobs (job_id));
diesel::joinable!(reconciliation_records -> ingestion_jobs (ingestion_job_id));
diesel::joinable!(reconciliation_records -> projects (project_id));
diesel::joinable!(reconciliation_results -> reconciliation_jobs (job_id));
diesel::joinable!(reports -> projects (project_id));
diesel::joinable!(reports -> users (created_by));
diesel::joinable!(request_metrics -> users (user_id));
diesel::joinable!(security_events -> users (user_id));
diesel::joinable!(sessions -> users (user_id));
diesel::joinable!(sync_change_tracking -> sync_configurations (sync_configuration_id));
diesel::joinable!(sync_change_tracking -> sync_executions (sync_execution_id));
diesel::joinable!(sync_conflicts -> sync_configurations (sync_configuration_id));
diesel::joinable!(sync_conflicts -> sync_executions (sync_execution_id));
diesel::joinable!(sync_conflicts -> users (resolved_by));
diesel::joinable!(sync_executions -> sync_configurations (sync_configuration_id));
diesel::joinable!(team_members -> teams (team_id));
diesel::joinable!(teams -> users (owner_id));
diesel::joinable!(two_factor_auth -> users (user_id));
diesel::joinable!(uploaded_files -> projects (project_id));
diesel::joinable!(uploaded_files -> users (uploaded_by));
diesel::joinable!(user_activities -> users (user_id));
diesel::joinable!(user_analytics_summary -> users (user_id));
diesel::joinable!(user_dashboards -> users (user_id));
diesel::joinable!(user_devices -> users (user_id));
diesel::joinable!(user_feature_usage -> users (user_id));
diesel::joinable!(user_learning_progress -> users (user_id));
diesel::joinable!(user_notification_history -> users (user_id));
diesel::joinable!(user_preferences -> users (user_id));
diesel::joinable!(user_presence -> projects (current_project_id));
diesel::joinable!(user_presence -> users (user_id));
diesel::joinable!(user_roles -> roles (role_id));
diesel::joinable!(user_sessions -> users (user_id));
diesel::joinable!(user_teams -> users (user_id));
diesel::joinable!(user_workspaces -> users (user_id));
diesel::joinable!(websocket_sessions -> users (user_id));
diesel::joinable!(workflow_instances -> users (started_by));
diesel::joinable!(workflow_instances -> workflows (workflow_id));
diesel::joinable!(workflow_rules -> workflows (workflow_id));
diesel::joinable!(workflows -> projects (project_id));
diesel::joinable!(workflows -> users (created_by));

diesel::allow_tables_to_appear_in_same_query!(
    account_lockouts,
    accounts,
    adjudication_cases,
    adjudication_decisions,
    adjudication_workflows,
    api_keys,
    application_errors,
    application_secrets,
    audit_logs,
    auth_audit_log,
    better_auth_accounts,
    better_auth_sessions,
    better_auth_verification_tokens,
    cache_invalidations,
    cache_statistics,
    cashflow_categories,
    cashflow_discrepancies,
    cashflow_transactions,
    charts,
    collaboration_comments,
    collaboration_participants,
    collaboration_sessions,
    dashboards,
    data_sources,
    email_verification_tokens,
    failed_login_attempts,
    field_locks,
    file_processing_metrics,
    ingestion_errors,
    ingestion_jobs,
    ingestion_results,
    ip_access_control,
    notification_preferences,
    notifications,
    password_audit_log,
    password_entries,
    password_reset_tokens,
    performance_alerts,
    performance_metrics,
    project_members,
    projects,
    query_performance,
    rate_limit_entries,
    realtime_events,
    reconciliation_jobs,
    reconciliation_performance,
    reconciliation_records,
    reconciliation_results,
    reports,
    request_metrics,
    roles,
    schema_migrations,
    security_events,
    security_policies,
    sessions,
    subscriptions,
    sync_change_tracking,
    sync_configurations,
    sync_conflicts,
    sync_executions,
    system_metrics,
    system_resources,
    team_members,
    teams,
    two_factor_auth,
    uploaded_files,
    user_activities,
    user_analytics_summary,
    user_dashboards,
    user_devices,
    user_feature_usage,
    user_feedback,
    user_learning_progress,
    user_notification_history,
    user_preferences,
    user_presence,
    user_roles,
    user_sessions,
    user_teams,
    user_workspaces,
    users,
    verification_tokens,
    websocket_sessions,
    workflow_instances,
    workflow_rules,
    workflows,
);
