//! WebSocket server implementation for real-time communication
//! 
//! This module provides WebSocket functionality for real-time collaboration,
//! data synchronization, and live updates.

use actix_web::{web, HttpRequest, HttpResponse, Result};
use actix_web_actors::ws;
use actix::{Actor, StreamHandler, Handler, Message, Addr, AsyncContext, ActorContext};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use tokio::sync::RwLock;
use std::sync::Arc;

use crate::errors::{AppError, AppResult};
use crate::database::Database;

/// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize, Message)]
#[rtype(result = "()")]
pub enum WsMessage {
    /// Authentication request
    Auth {
        token: String,
    },
    /// Authentication success
    AuthSuccess {
        user_id: String,
    },
    /// Join project room
    JoinProject {
        project_id: Uuid,
    },
    /// Project joined confirmation
    ProjectJoined {
        project_id: Uuid,
    },
    /// Leave project room
    LeaveProject {
        project_id: Uuid,
    },
    /// Project left confirmation
    ProjectLeft {
        project_id: Uuid,
    },
    /// Data update notification
    DataUpdate {
        project_id: Uuid,
        entity_type: String,
        entity_id: Uuid,
        action: String,
        data: serde_json::Value,
    },
    /// Collaboration message
    Collaboration {
        project_id: Uuid,
        user_id: String,
        action: String,
        data: serde_json::Value,
    },
    /// Notification message
    Notification {
        title: String,
        message: String,
        level: String,
    },
    /// Job progress update
    JobProgressUpdate {
        job_id: Uuid,
        progress: f64,
        status: String,
        eta: Option<i64>,
        message: Option<String>,
    },
    /// Metrics update
    MetricsUpdate {
        metrics: serde_json::Value,
        timestamp: chrono::DateTime<chrono::Utc>,
    },
    /// Ping message
    Ping,
    /// Pong response
    Pong,
    /// Error message
    Error {
        code: String,
        message: String,
    },
}

/// Register session message
#[derive(Message)]
#[rtype(result = "()")]
pub struct RegisterSession {
    pub user_id: String,
    pub session: Addr<WsSession>,
}

/// Unregister session message
#[derive(Message)]
#[rtype(result = "()")]
pub struct UnregisterSession {
    pub user_id: String,
}

/// Join project room message
#[derive(Message)]
#[rtype(result = "()")]
pub struct JoinProjectRoom {
    pub user_id: String,
    pub project_id: Uuid,
    pub session: Addr<WsSession>,
}

/// Leave project room message
#[derive(Message)]
#[rtype(result = "()")]
pub struct LeaveProjectRoom {
    pub user_id: String,
    pub project_id: Uuid,
}

/// Broadcast to project message
#[derive(Message)]
#[rtype(result = "()")]
pub struct BroadcastToProject {
    pub project_id: Uuid,
    pub message: WsMessage,
    pub exclude_session: Option<Addr<WsSession>>,
}

/// Broadcast job progress message
#[derive(Message)]
#[rtype(result = "()")]
pub struct BroadcastJobProgress {
    pub project_id: Uuid,
    pub job_id: Uuid,
    pub progress: f64,
    pub status: String,
    pub eta: Option<i64>,
    pub message: Option<String>,
}

/// Broadcast metrics update message
#[derive(Message)]
#[rtype(result = "()")]
pub struct BroadcastMetricsUpdate {
    pub metrics: serde_json::Value,
}

/// WebSocket server actor
pub struct WsServer {
    /// Database connection
    db: Arc<Database>,
    /// Connected sessions
    sessions: Arc<RwLock<HashMap<String, Addr<WsSession>>>>,
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

/// WebSocket session actor
pub struct WsSession {
    /// User ID
    user_id: Option<String>,
    /// WebSocket server address
    server: Addr<WsServer>,
    /// Database connection
    db: Arc<Database>,
    /// Authentication status
    authenticated: bool,
    /// Project rooms this session is in
    project_rooms: std::collections::HashSet<Uuid>,
    /// Joined projects
    joined_projects: std::collections::HashSet<Uuid>,
    /// Last ping time
    last_ping: Option<std::time::Instant>,
}

impl WsSession {
    pub fn new(server: Addr<WsServer>, db: Arc<Database>) -> Self {
        Self {
            user_id: None,
            server,
            db,
            authenticated: false,
            project_rooms: std::collections::HashSet::new(),
            joined_projects: std::collections::HashSet::new(),
            last_ping: None,
        }
    }
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        // Start heartbeat
        ctx.run_interval(std::time::Duration::from_secs(30), |act, ctx| {
            act.handle_heartbeat(ctx);
        });
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        // Unregister session from server if authenticated
        if let Some(user_id) = self.user_id.clone() {
            self.server.do_send(UnregisterSession { user_id: user_id.to_string() });
        }
    }
}

impl Handler<WsMessage> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) {
        match msg {
            WsMessage::Auth { token } => {
                // Handle authentication inline
                match self.validate_token(&token) {
                    Ok(claims) => {
                        self.user_id = Some(claims.sub.clone());
                        self.authenticated = true;
                        
                        let response = WsMessage::Notification {
                            title: "Authentication".to_string(),
                            message: "Authentication successful".to_string(),
                            level: "success".to_string(),
                        };
                        ctx.text(serde_json::to_string(&response).unwrap_or_default());
                    }
                    Err(_) => {
                        let response = WsMessage::Error {
                            code: "AUTH_ERROR".to_string(),
                            message: "Invalid authentication token".to_string(),
                        };
                        ctx.text(serde_json::to_string(&response).unwrap_or_default());
                    }
                }
            }
            WsMessage::JoinProject { project_id } => {
                // Handle joining project room
                self.handle_join_project(project_id, ctx);
            }
            WsMessage::LeaveProject { project_id } => {
                // Handle leaving project room
                self.handle_leave_project(project_id, ctx);
            }
            WsMessage::DataUpdate { project_id, entity_type, entity_id, action, data } => {
                // Handle data update
                self.handle_data_update(project_id, entity_type, entity_id, action, data, ctx);
            }
            WsMessage::Collaboration { project_id, user_id, action, data } => {
                // Handle collaboration message
                self.handle_collaboration(project_id, user_id, action, data, ctx);
            }
            WsMessage::Notification { title, message, level } => {
                // Handle notification
                self.handle_notification(title, message, level, ctx);
            }
            WsMessage::Error { code, message } => {
                // Handle error message
                self.handle_error(code, message, ctx);
            }
            WsMessage::Pong => {
                // Handle pong response
                self.handle_pong(ctx);
            }
            WsMessage::JobProgressUpdate { .. } | WsMessage::MetricsUpdate { .. } => {
                // Handle progress and metrics updates
                // TODO: Implement these handlers
            }
            WsMessage::AuthSuccess { .. } | WsMessage::ProjectJoined { .. } | WsMessage::ProjectLeft { .. } | WsMessage::Ping => {
                // Handle these message types
                // TODO: Implement these handlers
            }
        }
    }
}
impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Text(text)) => {
                // Parse incoming message
                if let Ok(ws_message) = serde_json::from_str::<WsMessage>(&text) {
                    self.handle_message(ws_message, ctx);
                } else {
                    // Send error response
                    let error_msg = WsMessage::Error {
                        code: "INVALID_FORMAT".to_string(),
                        message: "Invalid message format".to_string(),
                    };
                    ctx.text(serde_json::to_string(&error_msg).unwrap_or_default());
                }
            }
            Ok(ws::Message::Binary(_)) => {
                // Handle binary messages if needed
            }
            Ok(ws::Message::Ping(msg)) => {
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                // Handle pong
            }
            Ok(ws::Message::Close(_)) => {
                ctx.stop();
            }
            _ => {
                ctx.stop();
            }
        }
    }
}

impl WsSession {
    /// Handle incoming WebSocket message
    fn handle_message(&mut self, msg: WsMessage, ctx: &mut ws::WebsocketContext<Self>) {
        match msg {
            WsMessage::Auth { token } => {
                // Validate token and authenticate user
                // This would typically validate the JWT token
                // For now, we'll just acknowledge
                let response = WsMessage::Notification {
                    title: "Authentication".to_string(),
                    message: "Authenticated successfully".to_string(),
                    level: "success".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::JoinProject { project_id } => {
                // Handle joining a project room
                let response = WsMessage::Notification {
                    title: "Project Room".to_string(),
                    message: format!("Joined project {}", project_id),
                    level: "info".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::LeaveProject { project_id } => {
                // Handle leaving a project room
                let response = WsMessage::Notification {
                    title: "Project Room".to_string(),
                    message: format!("Left project {}", project_id),
                    level: "info".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::DataUpdate { project_id, entity_type, entity_id, action, data } => {
                // Handle real-time data updates
                // Broadcast to all users in the project
                let response = WsMessage::DataUpdate {
                    project_id,
                    entity_type,
                    entity_id,
                    action,
                    data,
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::Collaboration { project_id, user_id, action, data } => {
                // Handle collaboration actions
                let response = WsMessage::Collaboration {
                    project_id,
                    user_id,
                    action,
                    data,
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            _ => {
                // Handle other message types
            }
        }
    }

    /// Handle heartbeat
    fn handle_heartbeat(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.ping(b"heartbeat");
    }

    /// Handle authentication
    fn handle_auth(&mut self, token: String, ctx: &mut ws::WebsocketContext<Self>) {
        match self.validate_token(&token) {
            Ok(claims) => {
                self.user_id = Some(claims.sub.clone());
                self.authenticated = true;
                
                // Register session with server
                self.server.do_send(RegisterSession {
                    user_id: claims.sub.clone(),
                    session: ctx.address(),
                });
                
                // Send success response
                let response = WsMessage::Notification {
                    title: "Authentication".to_string(),
                    message: "Authenticated successfully".to_string(),
                    level: "success".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            Err(_) => {
                let response = WsMessage::Error {
                    code: "AUTH_ERROR".to_string(),
                    message: "Invalid token".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
        }
    }

    /// Handle joining project room
    fn handle_join_project(&mut self, project_id: Uuid, ctx: &mut ws::WebsocketContext<Self>) {
        if !self.authenticated {
            let response = WsMessage::Error {
                code: "AUTH_ERROR".to_string(),
                message: "Not authenticated".to_string(),
            };
            ctx.text(serde_json::to_string(&response).unwrap_or_default());
            return;
        }

        self.project_rooms.insert(project_id);
        
        // Join project room
        if let Some(user_id) = &self.user_id {
            self.server.do_send(JoinProjectRoom {
                user_id: user_id.to_string(),
                project_id,
                session: ctx.address(),
            });
        }
        
        let response = WsMessage::Notification {
            title: "Project".to_string(),
            message: format!("Joined project {}", project_id),
            level: "info".to_string(),
        };
        ctx.text(serde_json::to_string(&response).unwrap_or_default());
    }

    /// Handle leaving project room
    fn handle_leave_project(&mut self, project_id: Uuid, ctx: &mut ws::WebsocketContext<Self>) {
        self.project_rooms.remove(&project_id);
        
        // Leave project room
        if let Some(user_id) = &self.user_id {
            self.server.do_send(LeaveProjectRoom {
                user_id: user_id.to_string(),
                project_id,
            });
        }
        
        let response = WsMessage::Notification {
            title: "Project".to_string(),
            message: format!("Left project {}", project_id),
            level: "info".to_string(),
        };
        ctx.text(serde_json::to_string(&response).unwrap_or_default());
    }

    /// Handle data update
    fn handle_data_update(&mut self, project_id: Uuid, entity_type: String, entity_id: Uuid, action: String, data: serde_json::Value, ctx: &mut ws::WebsocketContext<Self>) {
        if !self.authenticated || !self.project_rooms.contains(&project_id) {
            let response = WsMessage::Error {
                code: "AUTH_ERROR".to_string(),
                message: "Not authorized for this project".to_string(),
            };
            ctx.text(serde_json::to_string(&response).unwrap_or_default());
            return;
        }

        // Broadcast update to other users in the project
        self.server.do_send(BroadcastToProject {
            project_id,
            message: WsMessage::DataUpdate { project_id, entity_type, entity_id, action, data },
            exclude_session: Some(ctx.address()),
        });
    }

    /// Handle collaboration message
    fn handle_collaboration(&mut self, project_id: Uuid, user_id: String, action: String, data: serde_json::Value, ctx: &mut ws::WebsocketContext<Self>) {
        if !self.authenticated || !self.project_rooms.contains(&project_id) {
            let response = WsMessage::Error {
                code: "AUTH_ERROR".to_string(),
                message: "Not authorized for this project".to_string(),
            };
            ctx.text(serde_json::to_string(&response).unwrap_or_default());
            return;
        }

        // Broadcast collaboration message to other users in the project
        self.server.do_send(BroadcastToProject {
            project_id,
            message: WsMessage::Collaboration { project_id, user_id, action, data },
            exclude_session: Some(ctx.address()),
        });
    }

    /// Handle notification
    fn handle_notification(&mut self, title: String, message: String, level: String, ctx: &mut ws::WebsocketContext<Self>) {
        let response = WsMessage::Notification { title, message, level };
        ctx.text(serde_json::to_string(&response).unwrap_or_default());
    }

    /// Handle error message
    fn handle_error(&mut self, code: String, message: String, ctx: &mut ws::WebsocketContext<Self>) {
        let response = WsMessage::Error { 
            code,
            message 
        };
        ctx.text(serde_json::to_string(&response).unwrap_or_default());
    }

    /// Handle pong response
    fn handle_pong(&mut self, _ctx: &mut ws::WebsocketContext<Self>) {
        // Update last ping time
        self.last_ping = Some(std::time::Instant::now());
    }

    /// Validate JWT token
    fn validate_token(&self, token: &str) -> AppResult<crate::services::auth::Claims> {
        use crate::services::auth::AuthService;
        let auth_service = AuthService::new("default_jwt_secret".to_string(), 3600);
        auth_service.validate_token(token)
    }
}

/// WebSocket connection handler
pub async fn websocket_handler(
    req: HttpRequest,
    stream: web::Payload,
    server: web::Data<Addr<WsServer>>,
) -> Result<HttpResponse, AppError> {
    // Get database from app data
    let db = req
        .app_data::<web::Data<Arc<Database>>>()
        .ok_or_else(|| AppError::InternalServerError("Database not available".to_string()))?
        .get_ref()
        .clone();

    // Create WebSocket session
    let session = WsSession::new(server.get_ref().clone(), db);

    // Start WebSocket connection
    let resp = ws::start(session, &req, stream)?;
    Ok(resp)
}

/// Configure WebSocket routes
pub fn configure_websocket_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/ws", web::get().to(websocket_handler));
}

/// Handle register session message
impl Handler<RegisterSession> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: RegisterSession, _ctx: &mut Self::Context) {
        // Register session in async context
        let sessions = self.sessions.clone();
        let user_id = msg.user_id;
        let session_addr = msg.session;
        
        tokio::spawn(async move {
            let mut sessions = sessions.write().await;
            sessions.insert(user_id, session_addr);
        });
    }
}

/// Handle unregister session message
impl Handler<UnregisterSession> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: UnregisterSession, _ctx: &mut Self::Context) {
        // Unregister session in async context
        let sessions = self.sessions.clone();
        let user_id = msg.user_id;
        
        tokio::spawn(async move {
            let mut sessions = sessions.write().await;
            sessions.remove(&user_id);
        });
    }
}

/// Handle join project room message
impl Handler<JoinProjectRoom> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: JoinProjectRoom, _ctx: &mut Self::Context) {
        // Store project room membership
        // This would typically be stored in a database or in-memory cache
        tracing::info!("Session joined project room: {}", msg.project_id);
    }
}

/// Handle leave project room message
impl Handler<LeaveProjectRoom> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveProjectRoom, _ctx: &mut Self::Context) {
        // Remove project room membership
        tracing::info!("Session left project room: {}", msg.project_id);
    }
}

/// Handle broadcast to project message
impl Handler<BroadcastToProject> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: BroadcastToProject, _ctx: &mut Self::Context) {
        let sessions = self.sessions.clone();
        let project_id = msg.project_id;
        let message = msg.message;
        let exclude_session = msg.exclude_session;
        
        tokio::spawn(async move {
            let sessions = sessions.read().await;
            for (_, session) in sessions.iter() {
                // Skip excluded session
                if let Some(ref exclude) = exclude_session {
                    if session == exclude {
                        continue;
                    }
                }
                
                // Send message to session
                session.do_send(message.clone());
            }
        });
    }
}

/// Handle broadcast job progress message
impl Handler<BroadcastJobProgress> for WsServer {
    type Result = ();

    fn handle(&mut self, msg: BroadcastJobProgress, _ctx: &mut Self::Context) {
        let sessions = self.sessions.clone();
        let project_id = msg.project_id;
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

/// Handle broadcast metrics update message
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