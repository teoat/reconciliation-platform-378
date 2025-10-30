//! Thin CRUD facade over the existing ProjectService to begin modularizing responsibilities.

use crate::database::Database;
use crate::errors::AppResult;
use crate::models::{Project};

/// CRUD-focused facade that delegates to the canonical ProjectService for now.
pub struct ProjectCRUDService {
    db: Database,
}

impl ProjectCRUDService {
    pub fn new(db: Database) -> Self { Self { db } }

    pub async fn get_project_by_id(&self, project_id: uuid::Uuid) -> AppResult<Project> {
        let svc = crate::services::project::ProjectService::new(self.db.clone());
        svc.get_project_by_id(project_id).await
    }
}


