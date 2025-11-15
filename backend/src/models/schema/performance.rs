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