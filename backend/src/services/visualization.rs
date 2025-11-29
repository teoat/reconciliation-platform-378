//! Visualization service module

use diesel::prelude::*;
use std::sync::Arc;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::{AppError, AppResult};
use crate::models::schema::{charts, dashboards, reports};
use crate::models::{
    Chart, Dashboard, NewChart, NewDashboard, NewReport, Report, UpdateChart, UpdateDashboard,
    UpdateReport,
};

/// Visualization service
pub struct VisualizationService {
    db: Arc<Database>,
}

impl VisualizationService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    // Charts
    pub async fn list_charts(&self, project_id: Option<Uuid>, page: i64, per_page: i64) -> AppResult<(Vec<Chart>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let mut items_query = charts::table.into_boxed();
        let mut count_query = charts::table.into_boxed();
        if let Some(pid) = project_id {
            items_query = items_query.filter(charts::project_id.eq(pid));
            count_query = count_query.filter(charts::project_id.eq(pid));
        }

        let total: i64 = count_query
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = items_query
            .order(charts::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<Chart>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_chart(&self, chart_id: Uuid) -> AppResult<Chart> {
        let mut conn = self.db.get_connection()?;
        charts::table
            .find(chart_id)
            .first::<Chart>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Chart {} not found", chart_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_chart(&self, new_chart: NewChart) -> AppResult<Chart> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(charts::table)
            .values(&new_chart)
            .get_result::<Chart>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_chart(&self, chart_id: Uuid, update: UpdateChart) -> AppResult<Chart> {
        let mut conn = self.db.get_connection()?;
        diesel::update(charts::table.find(chart_id))
            .set(&update)
            .get_result::<Chart>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_chart(&self, chart_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(charts::table.find(chart_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    // Dashboards
    pub async fn list_dashboards(&self, project_id: Option<Uuid>, page: i64, per_page: i64) -> AppResult<(Vec<Dashboard>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let mut items_query = dashboards::table.into_boxed();
        let mut count_query = dashboards::table.into_boxed();
        if let Some(pid) = project_id {
            items_query = items_query.filter(dashboards::project_id.eq(pid));
            count_query = count_query.filter(dashboards::project_id.eq(pid));
        }

        let total: i64 = count_query
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = items_query
            .order(dashboards::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<Dashboard>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_dashboard(&self, dashboard_id: Uuid) -> AppResult<Dashboard> {
        let mut conn = self.db.get_connection()?;
        dashboards::table
            .find(dashboard_id)
            .first::<Dashboard>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Dashboard {} not found", dashboard_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_dashboard(&self, new_dashboard: NewDashboard) -> AppResult<Dashboard> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(dashboards::table)
            .values(&new_dashboard)
            .get_result::<Dashboard>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_dashboard(&self, dashboard_id: Uuid, update: UpdateDashboard) -> AppResult<Dashboard> {
        let mut conn = self.db.get_connection()?;
        diesel::update(dashboards::table.find(dashboard_id))
            .set(&update)
            .get_result::<Dashboard>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_dashboard(&self, dashboard_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(dashboards::table.find(dashboard_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    // Reports
    pub async fn list_reports(&self, project_id: Option<Uuid>, page: i64, per_page: i64) -> AppResult<(Vec<Report>, i64)> {
        let mut conn = self.db.get_connection()?;
        let offset = (page - 1) * per_page;

        let mut items_query = reports::table.into_boxed();
        let mut count_query = reports::table.into_boxed();
        if let Some(pid) = project_id {
            items_query = items_query.filter(reports::project_id.eq(pid));
            count_query = count_query.filter(reports::project_id.eq(pid));
        }

        let total: i64 = count_query
            .count()
            .get_result(&mut conn)
            .map_err(AppError::Database)?;

        let items = items_query
            .order(reports::created_at.desc())
            .limit(per_page)
            .offset(offset)
            .load::<Report>(&mut conn)
            .map_err(AppError::Database)?;

        Ok((items, total))
    }

    pub async fn get_report(&self, report_id: Uuid) -> AppResult<Report> {
        let mut conn = self.db.get_connection()?;
        reports::table
            .find(report_id)
            .first::<Report>(&mut conn)
            .map_err(|e| match e {
                diesel::result::Error::NotFound => AppError::NotFound(format!("Report {} not found", report_id)),
                _ => AppError::Database(e),
            })
    }

    pub async fn create_report(&self, new_report: NewReport) -> AppResult<Report> {
        let mut conn = self.db.get_connection()?;
        diesel::insert_into(reports::table)
            .values(&new_report)
            .get_result::<Report>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn update_report(&self, report_id: Uuid, update: UpdateReport) -> AppResult<Report> {
        let mut conn = self.db.get_connection()?;
        diesel::update(reports::table.find(report_id))
            .set(&update)
            .get_result::<Report>(&mut conn)
            .map_err(AppError::Database)
    }

    pub async fn delete_report(&self, report_id: Uuid) -> AppResult<()> {
        let mut conn = self.db.get_connection()?;
        diesel::delete(reports::table.find(report_id))
            .execute(&mut conn)
            .map_err(AppError::Database)?;
        Ok(())
    }

    pub async fn generate_report(&self, report_id: Uuid) -> AppResult<serde_json::Value> {
        let report = self.get_report(report_id).await?;
        use chrono::Utc;
        
        // Update last_generated_at
        let update = UpdateReport {
            last_generated_at: Some(Some(Utc::now())),
            ..Default::default()
        };
        let _ = self.update_report(report_id, update).await?;

        Ok(serde_json::json!({
            "report_id": report.id,
            "status": "generated",
            "generated_at": Utc::now(),
            "template": report.template,
        }))
    }
}

