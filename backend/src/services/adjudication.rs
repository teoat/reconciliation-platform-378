//! Adjudication service module

use chrono::Utc;
use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{adjudication_cases, adjudication_decisions, adjudication_workflows};
use crate::models::{
    AdjudicationCase, AdjudicationDecision, AdjudicationWorkflow, NewAdjudicationCase,
    NewAdjudicationDecision, NewAdjudicationWorkflow, UpdateAdjudicationCase,
    UpdateAdjudicationDecision, UpdateAdjudicationWorkflow,
};

/// Adjudication service
pub struct AdjudicationService {
    db: Arc<Database>,
}

impl AdjudicationService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    // Cases
    pub async fn list_cases(&self, project_id: Option<Uuid>, page: i64, per_page: i64) -> AppResult<(Vec<AdjudicationCase>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let mut items_query = adjudication_cases::table.into_boxed();
        let mut count_query = adjudication_cases::table.into_boxed();
        if let Some(pid) = project_id {
            items_query = items_query.filter(adjudication_cases::project_id.eq(pid));
            count_query = count_query.filter(adjudication_cases::project_id.eq(pid));
        }

        let total: i64 = count_query
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = items_query
            .order(adjudication_cases::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<AdjudicationCase>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_case(&self, case_id: Uuid) -> AppResult<AdjudicationCase> {
        let mut conn = self.db.get_connection()?;
        adjudication_cases::table
            .find(case_id)
            .first::<AdjudicationCase>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Case {} not found", case_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_case(&self, new_case: NewAdjudicationCase) -> AppResult<AdjudicationCase> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(adjudication_cases::table)
            .values(&new_case)
            .get_result::<AdjudicationCase>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_case(&self, case_id: Uuid, update: UpdateAdjudicationCase) -> AppResult<AdjudicationCase> {
        let mut conn = self.db.get_connection()?;
        diesel::update(adjudication_cases::table.find(case_id))
            .set(&update)
            .get_result::<AdjudicationCase>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_case(&self, case_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(adjudication_cases::table.find(case_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    pub async fn assign_case(&self, case_id: Uuid, assigned_to: Uuid) -> AppResult<AdjudicationCase> {
        let mut conn = self.db.get_connection()?;
        diesel::update(adjudication_cases::table.find(case_id))
            .set((
                adjudication_cases::assigned_to.eq(Some(assigned_to)),
                adjudication_cases::assigned_at.eq(Some(Utc::now())),
            ))
            .get_result::<AdjudicationCase>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn resolve_case(&self, case_id: Uuid, resolved_by: Uuid, notes: Option<String>) -> AppResult<AdjudicationCase> {
        let mut conn = self.db.get_connection()?;
        diesel::update(adjudication_cases::table.find(case_id))
            .set((
                adjudication_cases::status.eq("resolved"),
                adjudication_cases::resolved_by.eq(Some(resolved_by)),
                adjudication_cases::resolved_at.eq(Some(Utc::now())),
                adjudication_cases::resolution_notes.eq(notes),
            ))
            .get_result::<AdjudicationCase>(&mut conn)
            .map_err(AppError::Database)
    }

    // Decisions
    pub async fn list_decisions(&self, case_id: Option<Uuid>, page: i64, per_page: i64) -> AppResult<(Vec<AdjudicationDecision>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let mut items_query = adjudication_decisions::table.into_boxed();
        let mut count_query = adjudication_decisions::table.into_boxed();
        if let Some(cid) = case_id {
            items_query = items_query.filter(adjudication_decisions::case_id.eq(cid));
            count_query = count_query.filter(adjudication_decisions::case_id.eq(cid));
        }

        let total: i64 = count_query
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = items_query
            .order(adjudication_decisions::decided_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<AdjudicationDecision>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_decision(&self, decision_id: Uuid) -> AppResult<AdjudicationDecision> {
        let mut conn = self.db.get_connection()?;
        adjudication_decisions::table
            .find(decision_id)
            .first::<AdjudicationDecision>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Decision {} not found", decision_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_decision(&self, new_decision: NewAdjudicationDecision) -> AppResult<AdjudicationDecision> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(adjudication_decisions::table)
            .values(&new_decision)
            .get_result::<AdjudicationDecision>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_decision(&self, decision_id: Uuid, update: UpdateAdjudicationDecision) -> AppResult<AdjudicationDecision> {
        let mut conn = self.db.get_connection()?;
        diesel::update(adjudication_decisions::table.find(decision_id))
            .set(&update)
            .get_result::<AdjudicationDecision>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn appeal_decision(&self, decision_id: Uuid, reason: String) -> AppResult<AdjudicationDecision> {
        let mut conn = self.db.get_connection()?;
        diesel::update(adjudication_decisions::table.find(decision_id))
            .set((
                adjudication_decisions::appealed.eq(true),
                adjudication_decisions::appeal_reason.eq(Some(reason)),
                adjudication_decisions::appealed_at.eq(Some(Utc::now())),
            ))
            .get_result::<AdjudicationDecision>(&mut conn)
            .map_err(AppError::Database)
    }

    // Workflows
    pub async fn list_workflows(&self, project_id: Option<Uuid>, page: i64, per_page: i64) -> AppResult<(Vec<AdjudicationWorkflow>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let mut items_query = adjudication_workflows::table
            .filter(adjudication_workflows::is_active.eq(true))
            .into_boxed();
        let mut count_query = adjudication_workflows::table
            .filter(adjudication_workflows::is_active.eq(true))
            .into_boxed();
        if let Some(pid) = project_id {
            items_query = items_query.filter(adjudication_workflows::project_id.eq(pid));
            count_query = count_query.filter(adjudication_workflows::project_id.eq(pid));
        }

        let total: i64 = count_query
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = items_query
            .order(adjudication_workflows::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<AdjudicationWorkflow>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_workflow(&self, workflow_id: Uuid) -> AppResult<AdjudicationWorkflow> {
        let mut conn = self.db.get_connection()?;
        adjudication_workflows::table
            .find(workflow_id)
            .first::<AdjudicationWorkflow>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Workflow {} not found", workflow_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_workflow(&self, new_workflow: NewAdjudicationWorkflow) -> AppResult<AdjudicationWorkflow> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(adjudication_workflows::table)
            .values(&new_workflow)
            .get_result::<AdjudicationWorkflow>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_workflow(&self, workflow_id: Uuid, update: UpdateAdjudicationWorkflow) -> AppResult<AdjudicationWorkflow> {
        let mut conn = self.db.get_connection()?;
        diesel::update(adjudication_workflows::table.find(workflow_id))
            .set(&update)
            .get_result::<AdjudicationWorkflow>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_workflow(&self, workflow_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::update(adjudication_workflows::table.find(workflow_id))
            .set(adjudication_workflows::is_active.eq(false))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }
}

