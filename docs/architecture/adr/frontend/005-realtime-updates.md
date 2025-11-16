# Real-time Updates Implementation

## Status

Accepted

## Context

The reconciliation platform requires real-time capabilities for:

- Live progress updates during long-running reconciliation jobs
- Collaborative editing of reconciliation rules and matches
- Real-time notifications for job completion and errors
- Live dashboard updates with current metrics
- Multi-user conflict resolution
- Instant feedback for user actions

Traditional polling approaches have limitations:
- High server load from frequent requests
- Delayed updates and poor user experience
- Inefficient network usage
- Battery drain on mobile devices

## Decision

We implemented WebSocket-based real-time communication:

- **WebSocket Client**: Persistent connection with automatic reconnection
- **Event-Driven Architecture**: Publish-subscribe pattern for events
- **React Integration**: Custom hooks for WebSocket state management
- **Fallback Strategy**: HTTP polling as backup when WebSocket unavailable
- **Connection Management**: Heartbeat, reconnection logic, and error handling

### Key Components:
- **WebSocket Service**: Core connection management and messaging
- **Event System**: Typed events for different update types
- **React Hooks**: useWebSocketIntegration for component integration
- **State Synchronization**: Real-time state updates across components

### Event Types:
- Job progress updates
- Match creation/modification notifications
- User presence indicators
- System status updates
- Error notifications

## Consequences

### Positive
- **Real-time Experience**: Instant updates improve user experience
- **Efficiency**: Reduced server load compared to polling
- **Scalability**: WebSocket connections handle many concurrent users
- **Reliability**: Automatic reconnection and fallback mechanisms
- **Collaboration**: Enables real-time collaboration features

### Negative
- **Complexity**: WebSocket management adds architectural complexity
- **Browser Support**: Older browsers may not support WebSockets
- **Network Issues**: Firewall and proxy issues can block WebSocket connections
- **State Management**: Real-time updates complicate state synchronization

### Risks
- Connection drops causing data inconsistency
- Race conditions in real-time updates
- Increased server infrastructure requirements
- Security concerns with persistent connections

## Alternatives Considered

### HTTP Polling
- **Pros**: Simple implementation, works everywhere
- **Cons**: High latency, server load, poor user experience
- **Decision**: Rejected due to performance and user experience issues

### Server-Sent Events (SSE)
- **Pros**: Simpler than WebSockets, good for server-to-client
- **Cons**: One-way communication, limited browser support
- **Decision**: Rejected due to need for bidirectional communication

### Long Polling
- **Pros**: Works with all browsers, bidirectional
- **Cons**: Higher latency than WebSockets, complex implementation
- **Decision**: Rejected in favor of WebSocket standard

### GraphQL Subscriptions
- **Pros**: Typed schema, integrated with GraphQL
- **Cons**: Requires GraphQL backend, additional complexity
- **Decision**: Rejected due to REST API architecture

## Related ADRs

- [ADR 002: State Management Strategy](002-state-management.md)
- [ADR 003: API Communication Pattern](003-api-communication.md)

## Notes

- WebSocket connection includes authentication tokens
- Automatic reconnection with exponential backoff
- Fallback to polling when WebSocket unavailable
- Events are typed and validated for type safety