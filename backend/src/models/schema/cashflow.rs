// Cashflow-related Tables

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
        metadata -> Jsonb,
        created_by -> Nullable<Uuid>,
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

diesel::joinable!(cashflow_categories -> projects (project_id));
diesel::joinable!(cashflow_transactions -> projects (project_id));
diesel::joinable!(cashflow_transactions -> cashflow_categories (category_id));
diesel::joinable!(cashflow_discrepancies -> projects (project_id));

diesel::allow_tables_to_appear_in_same_query!(cashflow_categories, projects);
diesel::allow_tables_to_appear_in_same_query!(cashflow_transactions, projects);

