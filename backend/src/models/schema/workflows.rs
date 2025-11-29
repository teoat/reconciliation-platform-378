// Workflow-related Tables

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

diesel::table! {
    workflow_instances (id) {
        id -> Uuid,
        workflow_id -> Uuid,
        #[max_length = 50]
        status -> Varchar,
        #[max_length = 255]
        current_step -> Nullable<Varchar>,
        state -> Jsonb,
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

diesel::joinable!(workflows -> projects (project_id));
diesel::joinable!(workflows -> users (created_by));
diesel::joinable!(workflow_instances -> workflows (workflow_id));
diesel::joinable!(workflow_instances -> users (started_by));
diesel::joinable!(workflow_rules -> workflows (workflow_id));

diesel::allow_tables_to_appear_in_same_query!(workflows, projects);
diesel::allow_tables_to_appear_in_same_query!(workflow_instances, workflows);

