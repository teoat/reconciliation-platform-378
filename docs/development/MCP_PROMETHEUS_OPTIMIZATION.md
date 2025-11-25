# Prometheus MCP Server Optimization

**Last Updated**: January 2025  
**Status**: ✅ Optimized Configuration

---

## 📋 Overview

This document describes the optimized Prometheus MCP server configuration for the Reconciliation Platform.

---

## 🔍 Diagnosis Results

### Issues Identified

1. **Old Package**: Previously using `prometheus-mcp` v1.1.3 (older, less maintained)
2. **Service Dependency**: Prometheus service must be running for MCP server to function
3. **Error Handling**: Limited timeout and retry configuration

### Current Status

- **Prometheus Service**: Not currently running (configured but not active)
- **MCP Server**: Will fail to connect if Prometheus is not available
- **Configuration**: Now optimized with better error handling

---

## ✅ Optimized Solution

### Package Upgrade

**Before:**
```json
{
  "prometheus": {
    "command": "npx",
    "args": ["-y", "prometheus-mcp"],
    "env": {
      "PROMETHEUS_URL": "http://localhost:9090"
    }
  }
}
```

**After:**
```json
{
  "prometheus": {
    "command": "npx",
    "args": ["-y", "@wkronmiller/prometheus-mcp-server"],
    "env": {
      "PROMETHEUS_URL": "http://localhost:9090",
      "PROMETHEUS_TIMEOUT": "10000",
      "PROMETHEUS_RETRIES": "3"
    }
  }
}
```

### Improvements

1. **Newer Package**: `@wkronmiller/prometheus-mcp-server` v2.0.0
   - More recent and actively maintained
   - Better TypeScript support
   - Improved error handling

2. **Enhanced Configuration**:
   - `PROMETHEUS_TIMEOUT`: 10 second timeout for queries
   - `PROMETHEUS_RETRIES`: 3 retry attempts for failed requests
   - Better connection resilience

3. **Binary Command**: Uses optimized binary execution

---

## 🚀 Setup Instructions

### 1. Start Prometheus Service

The Prometheus MCP server requires Prometheus to be running. Start it using:

```bash
# Option 1: Using docker-compose (recommended)
docker-compose -f docker-compose.dev.yml -f docker-compose.monitoring.yml up -d prometheus

# Option 2: Using main docker-compose
docker-compose up -d prometheus

# Verify Prometheus is running
curl http://localhost:9090/-/healthy
```

### 2. Verify MCP Configuration

```bash
# Check configuration
cat .cursor/mcp.json | jq '.mcpServers.prometheus'

# Regenerate if needed
bash scripts/setup-mcp.sh
```

### 3. Restart Cursor IDE

After updating the configuration, restart Cursor IDE to apply changes.

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROMETHEUS_URL` | `http://localhost:9090` | Prometheus server URL |
| `PROMETHEUS_TIMEOUT` | `10000` | Request timeout in milliseconds |
| `PROMETHEUS_RETRIES` | `3` | Number of retry attempts |

### Authentication (Optional)

If your Prometheus instance requires authentication:

```json
{
  "prometheus": {
    "command": "npx",
    "args": ["-y", "@wkronmiller/prometheus-mcp-server"],
    "env": {
      "PROMETHEUS_URL": "http://localhost:9090",
      "PROMETHEUS_USERNAME": "admin",
      "PROMETHEUS_PASSWORD": "password",
      "PROMETHEUS_TIMEOUT": "10000",
      "PROMETHEUS_RETRIES": "3"
    }
  }
}
```

---

## 🐛 Troubleshooting

### MCP Server Not Connecting

1. **Check Prometheus Status**:
   ```bash
   curl http://localhost:9090/-/healthy
   ```

2. **Verify Port**:
   ```bash
   lsof -i :9090
   ```

3. **Check Docker Containers**:
   ```bash
   docker ps | grep prometheus
   ```

### Connection Timeout Errors

- Increase `PROMETHEUS_TIMEOUT` value
- Check network connectivity
- Verify Prometheus is not overloaded

### Authentication Errors

- Verify credentials are correct
- Check if Prometheus requires authentication
- Update environment variables accordingly

---

## 📊 Performance Considerations

### Optimization Tips

1. **Query Efficiency**: Use efficient PromQL queries to reduce load
2. **Caching**: MCP server may cache results for better performance
3. **Connection Pooling**: Server handles connection pooling automatically
4. **Timeout Settings**: Adjust timeout based on query complexity

### Resource Usage

- **Memory**: ~30-50MB per MCP server instance
- **CPU**: Minimal, only during active queries
- **Network**: Depends on query frequency and data volume

---

## 🔄 Alternative: Conditional Prometheus MCP

If Prometheus is not always needed, you can:

1. **Remove from Configuration**: Comment out or remove the Prometheus MCP server
2. **Use Custom Server**: Integrate Prometheus queries into the custom `reconciliation-platform` MCP server
3. **Manual Queries**: Use direct Prometheus API calls when needed

---

## 📚 Related Documentation

- [MCP Setup Guide](./MCP_SETUP_GUIDE.md)
- [Monitoring Setup](../operations/MONITORING_SETUP.md)
- [Docker Compose Configuration](../../docker-compose.monitoring.yml)

---

## ✅ Summary

**Optimized Configuration:**
- ✅ Upgraded to `@wkronmiller/prometheus-mcp-server` v2.0.0
- ✅ Added timeout and retry configuration
- ✅ Better error handling and resilience
- ✅ Documented setup and troubleshooting

**Requirements:**
- Prometheus service must be running on `http://localhost:9090`
- Restart Cursor IDE after configuration changes

