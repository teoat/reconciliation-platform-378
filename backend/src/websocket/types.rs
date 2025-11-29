//! WebSocket message types and data structures

use actix::{Addr, Message};
use chrono::DateTime;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// WebSocket message types
#[derive(Debug, Clone, Serialize, Deserialize, Message)]
#[rtype(result = "()")]
pub enum WsMessage {
    /// Authentication request
    Auth { token: String },
    /// Authentication success
    AuthSuccess { user_id: String },
    /// Join project room
    JoinProject { project_id: Uuid },
    /// Project joined confirmation
    ProjectJoined { project_id: Uuid },
    /// Leave project room
    LeaveProject { project_id: Uuid },
    /// Project left confirmation
    ProjectLeft { project_id: Uuid },
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
        timestamp: DateTime<Utc>,
    },
    /// Ping message
    Ping,
    /// Pong response
    Pong,
    /// Error message
    Error { code: String, message: String },
}

/// Register session message
#[derive(Message)]
#[rtype(result = "()")]
pub struct RegisterSession {
    pub user_id: String,
    pub session: Addr<crate::websocket::session::WsSession>,
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
    pub session: Addr<crate::websocket::session::WsSession>,
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
    pub exclude_session: Option<Addr<crate::websocket::session::WsSession>>,
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

/// Job progress update message
#[derive(Message)]
#[rtype(result = "()")]
pub struct JobProgressUpdate {
    pub job_id: Uuid,
    pub progress: f64,
    pub status: String,
    pub eta: Option<i64>,
    pub message: Option<String>,
}

/// Metrics update message
#[derive(Message)]
#[rtype(result = "()")]
pub struct MetricsUpdate {
    pub metrics: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}

/// Authentication result message
#[derive(Message)]
#[rtype(result = "()")]
pub struct AuthResult {
    pub user_id: String,
    pub success: bool,
}
