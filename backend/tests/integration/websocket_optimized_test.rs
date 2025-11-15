//! Integration tests for optimized WebSocket implementation

use crate::websocket::optimized::{OptimizedWebSocket, WebSocketOptimization};

#[tokio::test]
async fn test_websocket_compression() {
    let config = WebSocketOptimization {
        enable_compression: true,
        enable_batching: false,
        batch_size: 10,
        priority_queue: false,
    };
    
    let ws = OptimizedWebSocket::new(config);
    let test_message = "Hello, World! This is a test message.";
    
    // Test that compression compiles and runs
    let compressed = ws.compress(test_message);
    assert!(!compressed.is_empty());
}

#[tokio::test]
async fn test_websocket_batching() {
    let config = WebSocketOptimization {
        enable_compression: false,
        enable_batching: true,
        batch_size: 5,
        priority_queue: false,
    };
    
    let ws = OptimizedWebSocket::new(config);
    
    // Test batching configuration
    assert_eq!(ws.config.batch_size, 5);
    assert!(ws.config.enable_batching);
}

#[tokio::test]
async fn test_websocket_metrics() {
    let config = WebSocketOptimization::default();
    let ws = OptimizedWebSocket::new(config);
    
    let metrics = ws.get_metrics();
    
    // Verify metrics structure
    assert_eq!(metrics.messages_sent, 0);
    assert_eq!(metrics.messages_received, 0);
    assert!(metrics.compression_ratio > 0.0);
}

