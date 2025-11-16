//! WebSocket HTTP handlers
//!
//! This module contains HTTP handlers for WebSocket connections.

use actix::Addr;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use actix_web_actors::ws;
use std::sync::Arc;

use crate::config::Config;
use crate::database::Database;
use crate::errors::AppError;
use crate::websocket::server::WsServer;
use crate::websocket::session::WsSession;

/// WebSocket connection handler
pub async fn websocket_handler(
    req: HttpRequest,
    stream: web::Payload,
    server: web::Data<Addr<WsServer>>,
    config: web::Data<Config>,
) -> Result<HttpResponse, AppError> {
    let db = req
        .app_data::<web::Data<Arc<Database>>>()
        .ok_or_else(|| AppError::InternalServerError("Database not available".to_string()))?
        .get_ref()
        .clone();

    let session = WsSession::new(server.get_ref().clone(), db, config.jwt_secret.clone());

    let resp = ws::start(session, &req, stream)?;
    Ok(resp)
}

/// Configure WebSocket routes
pub fn configure_websocket_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/ws", web::get().to(websocket_handler));
}
