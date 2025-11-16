//! WebSocket session management
//!
//! This module contains the WebSocket session actor and related connection handling.

use actix::{Actor, ActorContext, Addr, AsyncContext, Handler, StreamHandler};
use actix_web_actors::ws;
use std::collections::HashSet;
use std::sync::Arc;
use std::time::Instant;
use uuid::Uuid;

use crate::database::Database;
use crate::errors::AppResult;
use crate::websocket::server::WsServer;
use crate::websocket::types::*;

/// WebSocket session actor
pub struct WsSession {
    /// User ID
    pub user_id: Option<String>,
    /// WebSocket server address
    pub server: Addr<WsServer>,
    /// Database connection
    pub db: Arc<Database>,
    /// JWT secret for token validation
    pub jwt_secret: String,
    /// Authentication status
    pub authenticated: bool,
    /// Project rooms this session is in
    pub project_rooms: HashSet<Uuid>,
    /// Joined projects
    pub joined_projects: HashSet<Uuid>,
    /// Last ping time
    pub last_ping: Option<Instant>,
}

impl WsSession {
    pub fn new(server: Addr<WsServer>, db: Arc<Database>, jwt_secret: String) -> Self {
        Self {
            user_id: None,
            server,
            db,
            jwt_secret,
            authenticated: false,
            project_rooms: HashSet::new(),
            joined_projects: HashSet::new(),
            last_ping: None,
        }
    }

    /// Validate JWT token
    pub fn validate_token(&self, token: &str) -> AppResult<crate::services::auth::Claims> {
        use crate::services::auth::AuthService;
        let auth_service = AuthService::new(self.jwt_secret.clone(), 3600);
        auth_service.validate_token(token)
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
            self.server.do_send(UnregisterSession {
                user_id: user_id.to_string(),
            });
        }
    }
}

impl Handler<WsMessage> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) {
        match msg {
            WsMessage::Auth { token } => match self.validate_token(&token) {
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
            },
            WsMessage::JoinProject { project_id } => {
                self.handle_join_project(project_id, ctx);
            }
            WsMessage::LeaveProject { project_id } => {
                self.handle_leave_project(project_id, ctx);
            }
            WsMessage::DataUpdate {
                project_id,
                entity_type,
                entity_id,
                action,
                data,
            } => {
                self.handle_data_update(project_id, entity_type, entity_id, action, data, ctx);
            }
            WsMessage::Collaboration {
                project_id,
                user_id,
                action,
                data,
            } => {
                self.handle_collaboration(project_id, user_id, action, data, ctx);
            }
            WsMessage::Notification {
                title,
                message,
                level,
            } => {
                self.handle_notification(title, message, level, ctx);
            }
            WsMessage::Error { code, message } => {
                self.handle_error(code, message, ctx);
            }
            WsMessage::Pong => {
                self.handle_pong(ctx);
            }
            WsMessage::JobProgressUpdate { .. } | WsMessage::MetricsUpdate { .. } => {
                // Handle progress and metrics updates
                // Note: These message types will be broadcast to all connected clients in the project
            }
            WsMessage::AuthSuccess { .. }
            | WsMessage::ProjectJoined { .. }
            | WsMessage::ProjectLeft { .. }
            | WsMessage::Ping => {
                // Handle these message types
                // Note: These are acknowledged but not broadcast (client-specific messages)
            }
        }
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Text(text)) => {
                if let Ok(ws_message) = serde_json::from_str::<WsMessage>(&text) {
                    self.handle_message(ws_message, ctx);
                } else {
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
            WsMessage::Auth { token: _ } => {
                let response = WsMessage::Notification {
                    title: "Authentication".to_string(),
                    message: "Authenticated successfully".to_string(),
                    level: "success".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::JoinProject { project_id } => {
                let response = WsMessage::Notification {
                    title: "Project Room".to_string(),
                    message: format!("Joined project {}", project_id),
                    level: "info".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::LeaveProject { project_id } => {
                let response = WsMessage::Notification {
                    title: "Project Room".to_string(),
                    message: format!("Left project {}", project_id),
                    level: "info".to_string(),
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::DataUpdate {
                project_id,
                entity_type,
                entity_id,
                action,
                data,
            } => {
                let response = WsMessage::DataUpdate {
                    project_id,
                    entity_type,
                    entity_id,
                    action,
                    data,
                };
                ctx.text(serde_json::to_string(&response).unwrap_or_default());
            }
            WsMessage::Collaboration {
                project_id,
                user_id,
                action,
                data,
            } => {
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
    #[allow(dead_code)]
    fn handle_auth(&mut self, token: String, ctx: &mut ws::WebsocketContext<Self>) {
        match self.validate_token(&token) {
            Ok(claims) => {
                self.user_id = Some(claims.sub.clone());
                self.authenticated = true;

                self.server.do_send(RegisterSession {
                    user_id: claims.sub.clone(),
                    session: ctx.address(),
                });

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
    fn handle_data_update(
        &mut self,
        project_id: Uuid,
        entity_type: String,
        entity_id: Uuid,
        action: String,
        data: serde_json::Value,
        ctx: &mut ws::WebsocketContext<Self>,
    ) {
        if !self.authenticated || !self.project_rooms.contains(&project_id) {
            let response = WsMessage::Error {
                code: "AUTH_ERROR".to_string(),
                message: "Not authorized for this project".to_string(),
            };
            ctx.text(serde_json::to_string(&response).unwrap_or_default());
            return;
        }

        self.server.do_send(BroadcastToProject {
            project_id,
            message: WsMessage::DataUpdate {
                project_id,
                entity_type,
                entity_id,
                action,
                data,
            },
            exclude_session: Some(ctx.address()),
        });
    }

    /// Handle collaboration message
    fn handle_collaboration(
        &mut self,
        project_id: Uuid,
        user_id: String,
        action: String,
        data: serde_json::Value,
        ctx: &mut ws::WebsocketContext<Self>,
    ) {
        if !self.authenticated || !self.project_rooms.contains(&project_id) {
            let response = WsMessage::Error {
                code: "AUTH_ERROR".to_string(),
                message: "Not authorized for this project".to_string(),
            };
            ctx.text(serde_json::to_string(&response).unwrap_or_default());
            return;
        }

        self.server.do_send(BroadcastToProject {
            project_id,
            message: WsMessage::Collaboration {
                project_id,
                user_id,
                action,
                data,
            },
            exclude_session: Some(ctx.address()),
        });
    }

    /// Handle notification
    fn handle_notification(
        &mut self,
        title: String,
        message: String,
        level: String,
        ctx: &mut ws::WebsocketContext<Self>,
    ) {
        let response = WsMessage::Notification {
            title,
            message,
            level,
        };
        ctx.text(serde_json::to_string(&response).unwrap_or_default());
    }

    /// Handle error message
    fn handle_error(
        &mut self,
        code: String,
        message: String,
        ctx: &mut ws::WebsocketContext<Self>,
    ) {
        let response = WsMessage::Error { code, message };
        ctx.text(serde_json::to_string(&response).unwrap_or_default());
    }

    /// Handle pong response
    fn handle_pong(&mut self, _ctx: &mut ws::WebsocketContext<Self>) {
        self.last_ping = Some(Instant::now());
    }
}
