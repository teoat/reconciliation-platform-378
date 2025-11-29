// Team-related Tables

diesel::table! {
    teams (id) {
        id -> Uuid,
        #[max_length = 255]
        name -> Varchar,
        description -> Nullable<Text>,
        owner_id -> Uuid,
        settings -> Jsonb,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    team_members (id) {
        id -> Uuid,
        team_id -> Uuid,
        user_id -> Uuid,
        #[max_length = 50]
        role -> Varchar,
        permissions -> Jsonb,
        joined_at -> Timestamptz,
        invited_by -> Nullable<Uuid>,
        is_active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::joinable!(teams -> users (owner_id));
diesel::joinable!(team_members -> teams (team_id));
diesel::joinable!(team_members -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(teams, users);
diesel::allow_tables_to_appear_in_same_query!(team_members, teams);
diesel::allow_tables_to_appear_in_same_query!(team_members, users);

