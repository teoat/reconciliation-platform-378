# MCP Server Coordination Proposal

**Last Updated**: January 2025  
**Status**: Proposal  
**Priority**: High

---

## 📋 Executive Summary

This proposal outlines a comprehensive coordination framework for the 7 MCP servers currently in use. The goal is to enable cross-server communication, shared state management, event-driven coordination, and unified monitoring to maximize efficiency and prevent conflicts.

---

## 🔍 Current State Analysis

### Active MCP Servers (7 servers, 74 tools)

| Server | Tools | Redis | Purpose | Coordination Level |
|--------|-------|-------|---------|-------------------|
| **filesystem** | 8 | ❌ | File operations | None |
| **postgres** | 6 | ❌ | Database queries | None |
| **prometheus** | 8 | ❌ | Monitoring | None |
| **reconciliation-platform** | 27 | ✅ | Platform tools | Basic (Redis) |
| **agent-coordination** | 18 | ✅ | Multi-agent coordination | Basic (Redis) |
| **sequential-thinking** | 1 | ❌ | Problem-solving | None |
| **memory** | 6 | ❌ | Knowledge graph | None |

### Current Limitations

1. **No Cross-Server Communication**
   - Servers operate independently
   - No event notifications between servers
   - No shared context or state synchronization

2. **Isolated Redis Usage**
   - `reconciliation-platform` and `agent-coordination` both use Redis
   - No shared data structures or coordination
   - Duplicate connection management

3. **No Unified Monitoring**
   - Each server monitors independently
   - No cross-server health checks
   - No unified metrics or dashboards

4. **No Event-Driven Coordination**
   - File locks in `agent-coordination` don't notify `reconciliation-platform`
   - Health check failures don't trigger coordination actions
   - Task completion doesn't trigger related operations

5. **No Shared Caching Strategy**
   - Each server implements its own caching
   - No cache invalidation coordination
   - Potential cache inconsistencies

---

## 🎯 Proposed Coordination Architecture

### Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Coordination Hub                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Event Bus (Redis Pub/Sub)                                │ │
│  │  - File lock events                                       │ │
│  │  - Task completion events                                 │ │
│  │  - Health check events                                    │ │
│  │  - Cache invalidation events                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Shared State Manager (Redis)                            │ │
│  │  - Server registry                                        │ │
│  │  - Tool availability                                     │ │
│  │  - Health status                                          │ │
│  │  - Metrics aggregation                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Coordination Service                                     │ │
│  │  - Cross-server tool orchestration                        │ │
│  │  - Dependency resolution                                  │ │
│  │  - Conflict prevention                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Platform │   │ Agent   │   │ Postgres│   │ Prometheus│
    │   MCP    │   │ Coord   │   │   MCP   │   │    MCP   │
    └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

---

## 🚀 Proposed Features

### 1. Event-Driven Coordination

#### Event Types

```typescript
// File lock events
interface FileLockEvent {
  type: 'file:locked' | 'file:unlocked';
  file: string;
  agentId: string;
  timestamp: string;
}

// Task events
interface TaskEvent {
  type: 'task:claimed' | 'task:completed' | 'task:released';
  taskId: string;
  agentId: string;
  timestamp: string;
}

// Health check events
interface HealthEvent {
  type: 'health:degraded' | 'health:recovered';
  service: string;
  status: string;
  timestamp: string;
}

// Cache invalidation events
interface CacheEvent {
  type: 'cache:invalidate';
  pattern: string;
  reason: string;
  timestamp: string;
}
```

#### Implementation

- **Redis Pub/Sub**: Use Redis pub/sub for event broadcasting
- **Event Handlers**: Each server subscribes to relevant events
- **Event Routing**: Smart routing based on event type and server capabilities

### 2. Shared State Management

#### Server Registry

```typescript
interface ServerRegistry {
  serverId: string;
  name: string;
  version: string;
  tools: string[];
  status: 'active' | 'inactive' | 'degraded';
  lastSeen: string;
  capabilities: string[];
  dependencies: string[];
}
```

#### Shared Data Structures

- **Server Registry**: Track all active MCP servers
- **Tool Catalog**: Unified tool availability across servers
- **Health Status**: Cross-server health monitoring
- **Metrics Aggregation**: Unified metrics collection

### 3. Cross-Server Tool Orchestration

#### Tool Discovery

```typescript
// Discover tools across all servers
interface ToolDiscovery {
  toolName: string;
  serverId: string;
  description: string;
  parameters: Record<string, unknown>;
  dependencies: string[];
}
```

#### Orchestration Examples

- **File Lock + Health Check**: When file is locked, check if related services are healthy
- **Task + Database**: When task is claimed, check database connection
- **Cache + Monitoring**: When cache is invalidated, update monitoring metrics

### 4. Unified Health Monitoring

#### Health Check Coordination

```typescript
interface UnifiedHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  servers: {
    [serverId: string]: {
      status: string;
      lastCheck: string;
      tools: number;
      errors: number;
    };
  };
  dependencies: {
    redis: 'connected' | 'disconnected';
    postgres: 'connected' | 'disconnected';
    prometheus: 'connected' | 'disconnected';
  };
}
```

### 5. Shared Caching Strategy

#### Cache Coordination

- **Cache Keys**: Standardized key patterns across servers
- **Cache Invalidation**: Cross-server cache invalidation
- **Cache Warming**: Coordinated cache warming
- **Cache Metrics**: Unified cache hit/miss tracking

---

## 📐 Implementation Plan

### Phase 1: Foundation (Week 1-2)

#### 1.1 Create Coordination Hub

**New File**: `mcp-server/src/coordination-hub.ts`

```typescript
/**
 * MCP Coordination Hub
 * 
 * Provides:
 * - Event bus (Redis Pub/Sub)
 * - Server registry
 * - Shared state management
 * - Cross-server communication
 */

interface CoordinationHub {
  // Event bus
  publish(event: MCPEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): Promise<void>;
  
  // Server registry
  registerServer(server: ServerRegistry): Promise<void>;
  getServer(serverId: string): Promise<ServerRegistry | null>;
  listServers(): Promise<ServerRegistry[]>;
  
  // Shared state
  setState(key: string, value: unknown, ttl?: number): Promise<void>;
  getState(key: string): Promise<unknown>;
  deleteState(key: string): Promise<void>;
  
  // Health monitoring
  reportHealth(serverId: string, status: HealthStatus): Promise<void>;
  getUnifiedHealth(): Promise<UnifiedHealthStatus>;
}
```

#### 1.2 Update Existing Servers

**Modify**: `mcp-server/src/index.ts` (reconciliation-platform)

- Add coordination hub integration
- Subscribe to relevant events
- Register server on startup

**Modify**: `mcp-server/src/agent-coordination.ts`

- Add coordination hub integration
- Publish file lock events
- Publish task events
- Subscribe to health events

#### 1.3 Create Shared Types

**New File**: `mcp-server/src/types/coordination.ts`

```typescript
// Shared types for coordination
export interface MCPEvent {
  type: string;
  source: string;
  data: unknown;
  timestamp: string;
}

export interface ServerRegistry {
  serverId: string;
  name: string;
  version: string;
  tools: string[];
  status: 'active' | 'inactive' | 'degraded';
  lastSeen: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  errors: number;
  lastCheck: string;
}
```

### Phase 2: Event System (Week 2-3)

#### 2.1 Implement Event Bus

**New File**: `mcp-server/src/coordination/event-bus.ts`

```typescript
/**
 * Event Bus using Redis Pub/Sub
 */
class EventBus {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private handlers: Map<string, EventHandler[]>;
  
  async publish(event: MCPEvent): Promise<void> {
    await this.publisher.publish('mcp:events', JSON.stringify(event));
  }
  
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    // Subscribe to Redis channel
    // Route events to handlers
  }
}
```

#### 2.2 Event Handlers

**New File**: `mcp-server/src/coordination/handlers/`

- `file-lock-handler.ts`: Handle file lock events
- `task-handler.ts`: Handle task events
- `health-handler.ts`: Handle health events
- `cache-handler.ts`: Handle cache events

### Phase 3: Server Registry (Week 3-4)

#### 3.1 Server Registration

**New File**: `mcp-server/src/coordination/server-registry.ts`

```typescript
/**
 * Server Registry
 * Tracks all active MCP servers
 */
class ServerRegistry {
  async register(server: ServerRegistry): Promise<void> {
    // Store in Redis
    // Publish registration event
  }
  
  async get(serverId: string): Promise<ServerRegistry | null> {
    // Retrieve from Redis
  }
  
  async list(): Promise<ServerRegistry[]> {
    // List all registered servers
  }
  
  async updateHealth(serverId: string, health: HealthStatus): Promise<void> {
    // Update health status
    // Publish health event if status changed
  }
}
```

#### 3.2 Auto-Registration

- Each server registers on startup
- Periodic health updates
- Automatic cleanup of inactive servers

### Phase 4: Tool Orchestration (Week 4-5)

#### 4.1 Tool Discovery

**New File**: `mcp-server/src/coordination/tool-discovery.ts`

```typescript
/**
 * Tool Discovery Service
 * Discovers and catalogs tools across all servers
 */
class ToolDiscovery {
  async discoverTools(): Promise<ToolDiscovery[]> {
    // Query all registered servers
    // Aggregate tool information
  }
  
  async findTool(toolName: string): Promise<ToolDiscovery | null> {
    // Find tool across all servers
  }
  
  async orchestrate(toolName: string, params: unknown): Promise<unknown> {
    // Find tool
    // Check dependencies
    // Execute with coordination
  }
}
```

#### 4.2 Dependency Resolution

- Check tool dependencies
- Resolve cross-server dependencies
- Handle dependency failures gracefully

### Phase 5: Unified Monitoring (Week 5-6)

#### 5.1 Health Aggregation

**New File**: `mcp-server/src/coordination/health-monitor.ts`

```typescript
/**
 * Unified Health Monitor
 * Aggregates health from all servers
 */
class HealthMonitor {
  async getUnifiedHealth(): Promise<UnifiedHealthStatus> {
    // Aggregate health from all servers
    // Check dependencies
    // Return unified status
  }
  
  async monitor(): Promise<void> {
    // Periodic health checks
    // Publish health events
  }
}
```

#### 5.2 Metrics Aggregation

- Collect metrics from all servers
- Aggregate tool usage statistics
- Provide unified metrics API

---

## 🔧 Technical Implementation Details

### Redis Pub/Sub Channels

```typescript
// Event channels
const CHANNELS = {
  EVENTS: 'mcp:events',
  FILE_LOCKS: 'mcp:events:file-locks',
  TASKS: 'mcp:events:tasks',
  HEALTH: 'mcp:events:health',
  CACHE: 'mcp:events:cache',
};

// Server registry keys
const KEYS = {
  SERVER_REGISTRY: 'mcp:servers:registry',
  SERVER_HEALTH: (serverId: string) => `mcp:servers:health:${serverId}`,
  TOOL_CATALOG: 'mcp:tools:catalog',
  METRICS: 'mcp:metrics',
};
```

### Event Flow Example

```typescript
// 1. Agent locks file
await agentCoordination.lockFile({ file: 'backend/src/api.rs', agentId: 'agent-1' });

// 2. Event published
await coordinationHub.publish({
  type: 'file:locked',
  source: 'agent-coordination',
  data: { file: 'backend/src/api.rs', agentId: 'agent-1' },
  timestamp: new Date().toISOString(),
});

// 3. Reconciliation platform receives event
coordinationHub.subscribe('file:locked', async (event) => {
  // Update internal state
  // Invalidate related cache
  // Log for monitoring
});

// 4. Prometheus receives event
coordinationHub.subscribe('file:locked', async (event) => {
  // Update metrics
  // Track file lock frequency
});
```

### Shared State Example

```typescript
// Server registration
await coordinationHub.registerServer({
  serverId: 'reconciliation-platform',
  name: 'Reconciliation Platform MCP',
  version: '2.1.0',
  tools: ['docker_container_status', 'redis_get', ...],
  status: 'active',
  lastSeen: new Date().toISOString(),
  capabilities: ['docker', 'redis', 'health'],
  dependencies: ['redis', 'postgres'],
});

// Health reporting
await coordinationHub.reportHealth('reconciliation-platform', {
  status: 'healthy',
  errors: 0,
  lastCheck: new Date().toISOString(),
});

// Unified health check
const health = await coordinationHub.getUnifiedHealth();
// Returns aggregated health from all servers
```

---

## 📊 Benefits

### 1. Conflict Prevention

- **File Lock Coordination**: All servers aware of file locks
- **Task Coordination**: Prevent duplicate work across servers
- **Resource Coordination**: Prevent resource conflicts

### 2. Improved Efficiency

- **Shared Caching**: Coordinated cache invalidation
- **Tool Discovery**: Find tools across all servers
- **Dependency Resolution**: Automatic dependency checking

### 3. Better Monitoring

- **Unified Health**: Single source of truth for system health
- **Metrics Aggregation**: Unified metrics across servers
- **Event Tracking**: Complete event history

### 4. Enhanced Reliability

- **Automatic Failover**: Detect and handle server failures
- **Health Recovery**: Automatic recovery monitoring
- **Dependency Management**: Track and manage dependencies

---

## 🎯 Success Metrics

### Coordination Metrics

- **Event Throughput**: Events processed per second
- **Event Latency**: Time from event to handler execution
- **Server Uptime**: Percentage of time all servers active
- **Conflict Prevention**: Number of conflicts prevented

### Performance Metrics

- **Cache Hit Rate**: Improved cache hit rate with coordination
- **Tool Discovery Time**: Time to discover tools across servers
- **Health Check Latency**: Time to aggregate health status

### Reliability Metrics

- **Server Recovery Time**: Time to detect and recover from failures
- **Event Delivery Rate**: Percentage of events successfully delivered
- **State Consistency**: Consistency of shared state across servers

---

## 🚦 Migration Path

### Step 1: Add Coordination Hub (Non-Breaking)

- Add coordination hub as optional feature
- Existing servers continue to work independently
- Gradual migration to coordination

### Step 2: Enable Event System

- Enable event publishing for key operations
- Add event handlers incrementally
- Monitor event system performance

### Step 3: Migrate to Shared State

- Migrate server registry to shared state
- Migrate health monitoring to unified system
- Migrate metrics to aggregated system

### Step 4: Full Coordination

- All servers using coordination hub
- All events flowing through event bus
- Full unified monitoring

---

## 📝 Configuration

### Environment Variables

```bash
# Coordination Hub
MCP_COORDINATION_ENABLED=true
MCP_COORDINATION_REDIS_URL=redis://:redis_pass@localhost:6379
MCP_COORDINATION_EVENT_TTL=3600

# Server Registration
MCP_SERVER_ID=reconciliation-platform
MCP_SERVER_NAME=Reconciliation Platform MCP
MCP_SERVER_VERSION=2.1.0

# Event Subscriptions
MCP_SUBSCRIBE_FILE_LOCKS=true
MCP_SUBSCRIBE_TASKS=true
MCP_SUBSCRIBE_HEALTH=true
MCP_SUBSCRIBE_CACHE=true
```

### Configuration File

```json
{
  "coordination": {
    "enabled": true,
    "redisUrl": "redis://:redis_pass@localhost:6379",
    "eventTtl": 3600,
    "serverId": "reconciliation-platform",
    "subscriptions": {
      "fileLocks": true,
      "tasks": true,
      "health": true,
      "cache": true
    }
  }
}
```

---

## 🔒 Security Considerations

### 1. Event Authentication

- Verify event source
- Validate event data
- Prevent event spoofing

### 2. State Access Control

- Restrict state access by server
- Validate state modifications
- Audit state changes

### 3. Redis Security

- Use Redis ACLs for access control
- Encrypt Redis connections (TLS)
- Monitor Redis access patterns

---

## 📚 Related Documentation

- [MCP Setup Complete](./MCP_SETUP_COMPLETE.md) - Current MCP setup
- [Agent Coordination Implementation](./AGENT_COORDINATION_IMPLEMENTATION_COMPLETE.md) - Agent coordination details
- [Redis and Tools Configuration](./REDIS_AND_TOOLS_CONFIGURATION.md) - Redis setup
- [Agent Coordination MCP Proposal](./AGENT_COORDINATION_MCP_PROPOSAL.md) - Original proposal

---

## ✅ Next Steps

1. **Review and Approve**: Review proposal and get approval
2. **Create Coordination Hub**: Implement Phase 1 foundation
3. **Add Event System**: Implement Phase 2 event bus
4. **Server Registry**: Implement Phase 3 registration
5. **Tool Orchestration**: Implement Phase 4 orchestration
6. **Unified Monitoring**: Implement Phase 5 monitoring
7. **Testing**: Comprehensive testing of coordination
8. **Documentation**: Update documentation with coordination details

---

**Status**: Ready for Implementation  
**Estimated Timeline**: 6 weeks  
**Priority**: High  
**Dependencies**: Redis, existing MCP servers
