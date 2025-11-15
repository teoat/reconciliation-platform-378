//! WebSocket server implementation for real-time communication
//! 
//! This module provides WebSocket functionality for real-time collaboration,
//! data synchronization, and live updates.

pub mod types;
pub mod server;
pub mod session;
pub mod handlers;

pub use types::*;
pub use server::WsServer;
pub use session::WsSession;
pub use handlers::{websocket_handler, configure_websocket_routes};

