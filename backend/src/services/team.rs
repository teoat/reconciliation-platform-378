//! Team service module

use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{team_members, teams};
use crate::models::{NewTeam, NewTeamMember, Team, TeamMember, UpdateTeam};

/// Team service
pub struct TeamService {
    db: Arc<Database>,
}

impl TeamService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn list_teams(&self, page: i64, per_page: i64) -> AppResult<(Vec<Team>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = teams::table.count().get_result(&mut conn).map_err(AppError::Database)?;

        let items = teams::table
            .order(teams::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<Team>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_team(&self, team_id: Uuid) -> AppResult<Team> {
        let mut conn = self.db.get_connection()?;
        teams::table
            .find(team_id)
            .first::<Team>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Team {} not found", team_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_team(&self, new_team: NewTeam) -> AppResult<Team> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(teams::table)
            .values(&new_team)
            .get_result::<Team>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_team(&self, team_id: Uuid, update: UpdateTeam) -> AppResult<Team> {
        let mut conn = self.db.get_connection()?;
        diesel::update(teams::table.find(team_id))
            .set(&update)
            .get_result::<Team>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_team(&self, team_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(teams::table.find(team_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    pub async fn list_members(&self, team_id: Uuid) -> AppResult<Vec<TeamMember>> {
        let mut conn = self.db.get_connection()?;
        team_members::table
            .filter(team_members::team_id.eq(team_id))
            .filter(team_members::is_active.eq(true))
            .load::<TeamMember>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn add_member(&self, new_member: NewTeamMember) -> AppResult<TeamMember> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(team_members::table)
            .values(&new_member)
            .get_result::<TeamMember>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn remove_member(&self, team_id: Uuid, user_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(
            team_members::table
                .filter(team_members::team_id.eq(team_id))
                .filter(team_members::user_id.eq(user_id)),
        )
        .execute(&mut conn)
        .map_err(AppError::Database)?;
        Ok(())
    }
}

