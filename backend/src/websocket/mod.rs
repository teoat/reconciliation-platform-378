//! WebSocket server implementation for real-time communication
//!
//! This module provides WebSocket functionality for real-time collaboration,
//! data synchronization, and live updates.

pub mod handlers;
pub mod server;
pub mod session;
pub mod types;

pub use handlers::{configure_websocket_routes, websocket_handler};
pub use server::WsServer;
pub use session::WsSession;
pub use types::*;
