//! Permission-focused facade for project access checks.

use crate::database::Database;
use crate::errors::AppResult;
use uuid::Uuid;

pub struct ProjectPermissionService {
    db: Database,
}

impl ProjectPermissionService {
    pub fn new(db: Database) -> Self { Self { db } }

    pub fn check_project_permission(&self, user_id: Uuid, project_id: Uuid) -> AppResult<()> {
        crate::utils::check_project_permission(&self.db, user_id, project_id)
    }
}


