//! WebSocket authentication result message

use actix::Message;

/// Authentication result message for WebSocket
#[derive(Message, Debug, Clone)]
#[rtype(result = "()")]
pub struct AuthResult {
    pub user_id: String,
    pub success: bool,
}

