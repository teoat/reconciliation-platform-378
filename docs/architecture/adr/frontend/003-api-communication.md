# API Communication Pattern

## Status

Accepted

## Context

The frontend needs robust API communication for:

- RESTful API calls to backend services
- File uploads for data sources
- Real-time WebSocket connections
- Error handling and retry logic
- Authentication token management
- Request/response interceptors
- Caching and performance optimization

The platform handles sensitive financial data and requires reliable, secure communication.

## Decision

We implemented a layered API communication architecture:

- **Base API Client**: Axios-based client with interceptors and error handling
- **Service Layer**: Domain-specific services (auth, projects, reconciliation, etc.)
- **React Query Integration**: Server state management and caching
- **WebSocket Client**: Real-time communication with automatic reconnection
- **Error Handling**: Centralized error management with user-friendly messages

### Key Components:
- **apiClient.ts**: Base HTTP client with authentication and error handling
- **Service Classes**: Domain-specific API operations
- **WebSocket Provider**: Real-time updates and notifications
- **Error Context**: Global error state management

## Consequences

### Positive
- **Reliability**: Automatic retry logic and error recovery
- **Performance**: Intelligent caching and request deduplication
- **Security**: Centralized authentication and token management
- **Maintainability**: Clear separation between API logic and UI components
- **Real-time**: WebSocket integration for live updates
- **Type Safety**: Full TypeScript support for API responses

### Negative
- **Complexity**: Multiple layers add abstraction overhead
- **Learning Curve**: Understanding the layered architecture
- **Bundle Size**: Additional dependencies for HTTP and WebSocket clients

### Risks
- Over-engineering simple API calls
- WebSocket connection management complexity
- Authentication token refresh race conditions

## Alternatives Considered

### Fetch API Only
- **Pros**: Native browser API, no dependencies
- **Cons**: Manual error handling, no interceptors, verbose code
- **Decision**: Rejected due to lack of features and poor developer experience

### React Query Only
- **Pros**: Built-in caching and error handling
- **Cons**: No authentication management, limited customization
- **Decision**: Rejected due to missing authentication and WebSocket features

### Apollo Client
- **Pros**: Comprehensive GraphQL solution with caching
- **Cons**: Requires GraphQL backend, overkill for REST API
- **Decision**: Rejected due to backend architecture mismatch

### SWR (React Query predecessor)
- **Pros**: Lightweight, React-focused
- **Cons**: Smaller ecosystem, less features than React Query
- **Decision**: Rejected in favor of more mature React Query

## Related ADRs

- [ADR 001: Frontend Architecture Choice](001-frontend-architecture.md)
- [ADR 005: Real-time Updates Implementation](005-real-time-updates.md)

## Notes

- Axios chosen for its interceptor system and wide adoption
- Service layer provides clean API for components
- WebSocket client handles automatic reconnection and heartbeat
- Error handling includes user-friendly messages and retry options