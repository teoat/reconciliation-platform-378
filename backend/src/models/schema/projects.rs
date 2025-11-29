// Project and Collaboration Tables
// Extracted from schema.rs for better organization

diesel::table! {
    projects (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        #[max_length = 1000]
        description -> Nullable<Text>,
        owner_id -> Uuid,
        #[max_length = 50]
        status -> Varchar,
        settings -> Jsonb,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    project_members (id) {
        id -> Uuid,
        project_id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        role -> Varchar,
        permissions -> Jsonb,
        joined_at -> Timestamptz,
        invited_by -> Uuid,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    collaboration_comments (id) {
        id -> Uuid,
        project_id -> Uuid,
        user_id -> Uuid,
        #[max_length = 1000]
        content -> Text,
        parent_comment_id -> Nullable<Uuid>,
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
        project_id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        role -> Varchar,
        permissions -> Jsonb,
        joined_at -> Timestamptz,
        last_activity_at -> Timestamptz,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    collaboration_sessions (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        session_name -> Varchar,
        created_by -> Uuid,
        participants -> Jsonb,
        is_active -> Bool,
        started_at -> Timestamptz,
        ended_at -> Nullable<Timestamptz>,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    field_locks (id) {
        id -> Uuid,
        project_id -> Uuid,
        #[max_length = 255]
        field_path -> Varchar,
        locked_by -> Uuid,
        locked_at -> Timestamptz,
        expires_at -> Nullable<Timestamptz>,
        lock_reason -> Nullable<Text>,
        is_active -> Bool,
        created_at -> Timestamptz,
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
        processing_time_ms -> Nullable<Int4>,
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
        source_data -> Jsonb,
        matching_results -> Jsonb,
        confidence -> Nullable<Float8>,
        audit_trail -> Jsonb,
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
        #[max_length = 50]
        status -> Nullable<Varchar>,
        updated_at -> Nullable<Timestamptz>,
        notes -> Nullable<Text>,
        reviewed_by -> Nullable<Uuid>,
        created_at -> Timestamptz,
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

// Joinable relationships for projects schema
diesel::joinable!(projects -> users (owner_id));
diesel::joinable!(project_members -> projects (project_id));
diesel::joinable!(project_members -> users (user_id));
diesel::joinable!(reconciliation_jobs -> projects (project_id));
diesel::joinable!(reconciliation_jobs -> users (created_by));
diesel::joinable!(reconciliation_records -> projects (project_id));
diesel::joinable!(reconciliation_records -> reconciliation_jobs (ingestion_job_id));
diesel::joinable!(reconciliation_results -> reconciliation_jobs (job_id));
diesel::joinable!(uploaded_files -> projects (project_id));
diesel::joinable!(uploaded_files -> users (uploaded_by));

// Allow tables to appear in same query
diesel::allow_tables_to_appear_in_same_query!(projects, users);
diesel::allow_tables_to_appear_in_same_query!(projects, project_members);
diesel::allow_tables_to_appear_in_same_query!(projects, reconciliation_jobs);
diesel::allow_tables_to_appear_in_same_query!(projects, reconciliation_records);
diesel::allow_tables_to_appear_in_same_query!(projects, reconciliation_results);
diesel::allow_tables_to_appear_in_same_query!(projects, uploaded_files);
diesel::allow_tables_to_appear_in_same_query!(users, project_members);
diesel::allow_tables_to_appear_in_same_query!(users, reconciliation_jobs);
diesel::allow_tables_to_appear_in_same_query!(users, uploaded_files);
diesel::allow_tables_to_appear_in_same_query!(reconciliation_results, reconciliation_jobs);
diesel::allow_tables_to_appear_in_same_query!(audit_logs, users);
diesel::allow_tables_to_appear_in_same_query!(data_sources, projects);