//! WebSocket server actor
//!
//! This module contains the WebSocket server actor that manages all connections.

use actix::{Actor, Addr, Handler};
use std::collections::HashMap;

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::database::Database;
use crate::errors::AppResult;
use crate::websocket::session::WsSession;
use crate::websocket::types::*;

/// WebSocket server actor
pub struct WsServer {
    /// Database connection
    pub db: Arc<Database>,
    /// Connected sessions
    pub sessions: Arc<RwLock<HashMap<String, Addr<WsSession>>>>,
}

impl WsServer {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Send message to all connected sessions
    pub async fn broadcast(&self, message: WsMessage) -> AppResult<()> {
        let sessions = self.sessions.read().await;
        for (_, session) in sessions.iter() {
            session.do_send(message.clone());
        }
        Ok(())
    }

    /// Send message to specific user
    pub async fn send_to_user(&self, user_id: String, message: WsMessage) -> AppResult<()> {
        let sessions = self.sessions.read().await;
        if let Some(session) = sessions.get(&user_id) {
            session.do_send(message);
        }
        Ok(())
    }

    /// Register a new session
    pub async fn register_session(&self, user_id: String, session: Addr<WsSession>) {
        let mut sessions = self.sessions.write().await;
        sessions.insert(user_id, session);
    }

    /// Unregister a session
    pub async fn unregister_session(&self, user_id: String) {
        let mut sessions = self.sessions.write().await;
        sessions.remove(&user_id);
    }
}

impl Actor for WsServer {
    type Context = actix::Context<Self>;
}

impl Handler<RegisterSession> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: RegisterSession, _ctx: &mut Self::Context) {
        let sessions = self.sessions.clone();
        let user_id = msg.user_id;
        let session_addr = msg.session;

        tokio::spawn(async move {
            let mut sessions = sessions.write().await;
            sessions.insert(user_id, session_addr);
        });
    }
}

impl Handler<UnregisterSession> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: UnregisterSession, _ctx: &mut Self::Context) {
        let sessions = self.sessions.clone();
        let user_id = msg.user_id;

        tokio::spawn(async move {
            let mut sessions = sessions.write().await;
            sessions.remove(&user_id);
        });
    }
}

impl Handler<JoinProjectRoom> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: JoinProjectRoom, _ctx: &mut Self::Context) {
        tracing::info!("Session joined project room: {}", msg.project_id);
    }
}

impl Handler<LeaveProjectRoom> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveProjectRoom, _ctx: &mut Self::Context) {
        tracing::info!("Session left project room: {}", msg.project_id);
    }
}

impl Handler<BroadcastToProject> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: BroadcastToProject, _ctx: &mut Self::Context) {
        let sessions = self.sessions.clone();
        let _project_id = msg.project_id;
        let message = msg.message;
        let exclude_session = msg.exclude_session;

        tokio::spawn(async move {
            let sessions = sessions.read().await;
            for (_, session) in sessions.iter() {
                if let Some(ref exclude) = exclude_session {
                    if session == exclude {
                        continue;
                    }
                }
                session.do_send(message.clone());
            }
        });
    }
}

impl Handler<BroadcastJobProgress> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: BroadcastJobProgress, _ctx: &mut Self::Context) {
        let sessions = self.sessions.clone();
        let _project_id = msg.project_id;
        let job_id = msg.job_id;
        let progress = msg.progress;
        let status = msg.status;
        let eta = msg.eta;
        let message = msg.message;

        tokio::spawn(async move {
            let job_progress_message = WsMessage::JobProgressUpdate {
                job_id,
                progress,
                status,
                eta,
                message,
            };

            let sessions = sessions.read().await;
            for (_, session) in sessions.iter() {
                session.do_send(job_progress_message.clone());
            }
        });
    }
}

impl Handler<BroadcastMetricsUpdate> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: BroadcastMetricsUpdate, _ctx: &mut Self::Context) {
        let sessions = self.sessions.clone();
        let metrics = msg.metrics;

        tokio::spawn(async move {
            let metrics_message = WsMessage::MetricsUpdate {
                metrics,
                timestamp: chrono::Utc::now(),
            };

            let sessions = sessions.read().await;
            for (_, session) in sessions.iter() {
                session.do_send(metrics_message.clone());
            }
        });
    }
}
