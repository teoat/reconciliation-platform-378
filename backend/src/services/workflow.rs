//! Workflow service module

use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{workflow_instances, workflow_rules, workflows};
use crate::models::{
    NewWorkflow, NewWorkflowInstance, NewWorkflowRule, UpdateWorkflow, UpdateWorkflowInstance,
    UpdateWorkflowRule, Workflow, WorkflowInstance, WorkflowRule,
};

/// Workflow service
pub struct WorkflowService {
    db: Arc<Database>,
}

impl WorkflowService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn list_workflows(&self, page: i64, per_page: i64) -> AppResult<(Vec<Workflow>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = workflows::table.count().get_result(&mut conn).map_err(AppError::Database)?;

        let items = workflows::table
            .order(workflows::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<Workflow>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_workflow(&self, workflow_id: Uuid) -> AppResult<Workflow> {
        let mut conn = self.db.get_connection()?;
        workflows::table
            .find(workflow_id)
            .first::<Workflow>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Workflow {} not found", workflow_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_workflow(&self, new_workflow: NewWorkflow) -> AppResult<Workflow> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(workflows::table)
            .values(&new_workflow)
            .get_result::<Workflow>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_workflow(&self, workflow_id: Uuid, update: UpdateWorkflow) -> AppResult<Workflow> {
        let mut conn = self.db.get_connection()?;
        diesel::update(workflows::table.find(workflow_id))
            .set(&update)
            .get_result::<Workflow>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_workflow(&self, workflow_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(workflows::table.find(workflow_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    pub async fn list_instances(&self, workflow_id: Uuid, page: i64, per_page: i64) -> AppResult<(Vec<WorkflowInstance>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let total: i64 = workflow_instances::table
            .filter(workflow_instances::workflow_id.eq(workflow_id))
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = workflow_instances::table
            .filter(workflow_instances::workflow_id.eq(workflow_id))
            .order(workflow_instances::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<WorkflowInstance>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn create_instance(&self, new_instance: NewWorkflowInstance) -> AppResult<WorkflowInstance> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(workflow_instances::table)
            .values(&new_instance)
            .get_result::<WorkflowInstance>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn get_instance(&self, instance_id: Uuid) -> AppResult<WorkflowInstance> {
        let mut conn = self.db.get_connection()?;
        workflow_instances::table
            .find(instance_id)
            .first::<WorkflowInstance>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Instance {} not found", instance_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn update_instance(&self, instance_id: Uuid, update: UpdateWorkflowInstance) -> AppResult<WorkflowInstance> {
        let mut conn = self.db.get_connection()?;
        diesel::update(workflow_instances::table.find(instance_id))
            .set(&update)
            .get_result::<WorkflowInstance>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn list_rules(&self, workflow_id: Uuid) -> AppResult<Vec<WorkflowRule>> {
        let mut conn = self.db.get_connection()?;
        workflow_rules::table
            .filter(workflow_rules::workflow_id.eq(workflow_id))
            .filter(workflow_rules::is_active.eq(true))
            .order(workflow_rules::priority.desc())
            .load::<WorkflowRule>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn create_rule(&self, new_rule: NewWorkflowRule) -> AppResult<WorkflowRule> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(workflow_rules::table)
            .values(&new_rule)
            .get_result::<WorkflowRule>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn get_rule(&self, rule_id: Uuid) -> AppResult<WorkflowRule> {
        let mut conn = self.db.get_connection()?;
        workflow_rules::table
            .find(rule_id)
            .first::<WorkflowRule>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Rule {} not found", rule_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn update_rule(&self, rule_id: Uuid, update: UpdateWorkflowRule) -> AppResult<WorkflowRule> {
        let mut conn = self.db.get_connection()?;
        diesel::update(workflow_rules::table.find(rule_id))
            .set(&update)
            .get_result::<WorkflowRule>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_rule(&self, rule_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(workflow_rules::table.find(rule_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }
}

