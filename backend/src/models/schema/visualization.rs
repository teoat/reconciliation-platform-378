// Visualization-related Tables

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

diesel::joinable!(charts -> projects (project_id));
diesel::joinable!(charts -> users (created_by));
diesel::joinable!(dashboards -> projects (project_id));
diesel::joinable!(dashboards -> users (created_by));
diesel::joinable!(reports -> projects (project_id));
diesel::joinable!(reports -> users (created_by));

diesel::allow_tables_to_appear_in_same_query!(charts, projects);
diesel::allow_tables_to_appear_in_same_query!(dashboards, projects);
diesel::allow_tables_to_appear_in_same_query!(reports, projects);

