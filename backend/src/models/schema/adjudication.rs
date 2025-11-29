// Adjudication-related Tables

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
        metadata -> Jsonb,
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
        metadata -> Jsonb,
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

diesel::joinable!(adjudication_cases -> projects (project_id));
diesel::joinable!(adjudication_cases -> users (assigned_to));
diesel::joinable!(adjudication_cases -> users (created_by));
diesel::joinable!(adjudication_decisions -> adjudication_cases (case_id));
diesel::joinable!(adjudication_decisions -> users (decided_by));
diesel::joinable!(adjudication_workflows -> projects (project_id));
diesel::joinable!(adjudication_workflows -> users (created_by));

diesel::allow_tables_to_appear_in_same_query!(adjudication_cases, projects);
diesel::allow_tables_to_appear_in_same_query!(adjudication_decisions, adjudication_cases);

