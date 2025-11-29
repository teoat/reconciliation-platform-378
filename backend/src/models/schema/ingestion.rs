// Ingestion-related Tables

diesel::table! {
    ingestion_jobs (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        job_name -> Varchar,
        #[max_length = 50]
        source_type -> Varchar,
        source_config -> Jsonb,
        #[max_length = 50]
        status -> Varchar,
        progress -> Int4,
        total_records -> Nullable<Int4>,
        processed_records -> Int4,
        error_count -> Int4,
        started_at -> Nullable<Timestamptz>,
        completed_at -> Nullable<Timestamptz>,
        error_message -> Nullable<Text>,
        metadata -> Jsonb,
        created_by -> Uuid,
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

diesel::joinable!(ingestion_jobs -> projects (project_id));
diesel::joinable!(ingestion_jobs -> users (created_by));
diesel::joinable!(ingestion_results -> ingestion_jobs (job_id));
diesel::joinable!(ingestion_errors -> ingestion_jobs (job_id));

diesel::allow_tables_to_appear_in_same_query!(ingestion_jobs, projects);
diesel::allow_tables_to_appear_in_same_query!(ingestion_results, ingestion_jobs);

