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