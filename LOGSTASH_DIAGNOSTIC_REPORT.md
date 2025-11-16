# Logstash Comprehensive Diagnostic Report

**Date**: November 16, 2025  
**Status**: ⚠️ **REQUIRES ATTENTION**  
**Container**: `reconciliation-logstash`

---

## 🔍 Executive Summary

Logstash is currently configured with **two ports**:
1. **Port 5044** (TCP): Beats input for log ingestion from Filebeat
2. **Port 9600** (HTTP): HTTP API for monitoring and node statistics

**Current Status**: ✅ Both ports are operational and properly configured, but there are **security and operational concerns** that need to be addressed.

---

## 📊 Current Configuration Analysis

### Port Configuration

| Port | Protocol | Purpose | Exposed | Status |
|------|----------|---------|---------|--------|
| 5044 | TCP | Beats input (Filebeat) | ✅ Yes | ✅ Operational |
| 9600 | HTTP | Monitoring API | ✅ Yes | ✅ Operational |

### Container Status

```json
{
  "container": "reconciliation-logstash",
  "status": "running",
  "ports": {
    "5044": "0.0.0.0:5044",
    "9600": "0.0.0.0:9600"
  },
  "health": "green",
  "uptime": "146 seconds"
}
```

### Service Health

- ✅ **Logstash API**: Responding on port 9600
- ✅ **Beats Input**: Listening on port 5044
- ✅ **Pipeline**: Running (main pipeline active)
- ✅ **Elasticsearch Connection**: Connected to `elasticsearch:9200`
- ⚠️ **Health Check**: Not configured in docker-compose.yml
- ⚠️ **Security**: Both ports exposed to host (security risk)

---

## 🔴 Issues Identified

### 1. **Security Risk: Unnecessary Port Exposure**

**Issue**: Port 9600 (HTTP API) is exposed to the host, which is unnecessary for internal Docker network communication.

**Risk Level**: 🟡 **Medium**
- The HTTP API can be accessed from outside the container
- No authentication configured
- Exposes internal metrics and statistics

**Impact**:
- Potential information disclosure
- Unauthorized access to Logstash metrics
- Increased attack surface

### 2. **Missing Health Check**

**Issue**: No health check configured in `docker-compose.yml` for Logstash service.

**Risk Level**: 🟡 **Medium**
- Docker cannot automatically detect if Logstash is unhealthy
- Dependent services may not wait properly for Logstash to be ready
- No automatic restart on failure

**Impact**:
- Unreliable service startup order
- Potential race conditions
- Difficult to monitor service health

### 3. **Deprecated Configuration**

**Issue**: Pipeline configuration uses deprecated `document_type` setting.

**Risk Level**: 🟢 **Low** (but should be fixed)
- Logs show: `You are using a deprecated config setting "document_type"`
- Will be removed in future Logstash versions

**Impact**:
- Future compatibility issues
- Configuration warnings in logs

### 4. **Performance Configuration**

**Issue**: Pipeline is configured with `pipeline.ordered` enabled, which may be less efficient.

**Risk Level**: 🟢 **Low**
- Logs show: `'pipeline.ordered' is enabled and is likely less efficient`
- May impact throughput under high load

**Impact**:
- Reduced processing throughput
- Higher latency during peak loads

### 5. **No Resource Limits**

**Issue**: No CPU/memory limits configured for Logstash container.

**Risk Level**: 🟡 **Medium**
- Current JVM settings: `-Xms256m -Xmx256m`
- No Docker resource constraints
- Could consume excessive resources

**Impact**:
- Resource contention with other services
- Potential OOM (Out of Memory) issues
- Unpredictable performance

---

## ✅ What's Working Correctly

1. **Port 5044 (Beats Input)**: ✅ Correctly configured and required
   - Filebeat services are correctly pointing to `logstash:5044`
   - Pipeline is listening and ready to receive logs

2. **Port 9600 (HTTP API)**: ✅ Functioning correctly
   - API endpoint responding
   - Monitoring data accessible
   - Node statistics available

3. **Elasticsearch Integration**: ✅ Connected
   - Successfully connected to Elasticsearch
   - Template installation working
   - Index creation configured

4. **Pipeline Configuration**: ✅ Valid
   - JSON log parsing configured
   - Plain text fallback configured
   - Output to Elasticsearch working

---

## 🔧 Proposed Fixes

### Fix 1: Secure Port Exposure (HIGH PRIORITY)

**Action**: Make port 9600 internal-only (remove host exposure)

**Before**:
```yaml
ports:
  - "${LOGSTASH_PORT:-5044}:5044"      # Beats input (required for Filebeat log ingestion)
  - "${LOGSTASH_HTTP_PORT:-9600}:9600" # HTTP API for monitoring and node stats (required)
```

**After**:
```yaml
ports:
  - "${LOGSTASH_PORT:-5044}:5044"      # Beats input (required for Filebeat log ingestion)
  # Port 9600 is only accessible within Docker network (internal monitoring)
  # Access via: docker exec reconciliation-logstash curl http://localhost:9600/_node/stats
```

**Alternative** (if external monitoring is needed):
```yaml
ports:
  - "${LOGSTASH_PORT:-5044}:5044"      # Beats input (required for Filebeat log ingestion)
  - "127.0.0.1:${LOGSTASH_HTTP_PORT:-9600}:9600" # HTTP API (localhost only, not 0.0.0.0)
```

**Benefits**:
- Reduces attack surface
- Maintains internal monitoring capability
- Follows security best practices

---

### Fix 2: Add Health Check (HIGH PRIORITY)

**Action**: Add health check to docker-compose.yml

**Add to logstash service**:
```yaml
logstash:
  # ... existing configuration ...
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:9600/_node/stats || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 40s
```

**Benefits**:
- Docker can detect unhealthy containers
- Proper dependency management
- Automatic restart on failure

---

### Fix 3: Remove Deprecated Configuration (MEDIUM PRIORITY)

**Action**: Remove `document_type` from pipeline.conf

**Before** (`logging/logstash/pipeline.conf`):
```ruby
output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "reconciliation-logs-%{+YYYY.MM.dd}"
    document_type => "_doc"  # ❌ DEPRECATED
  }
}
```

**After**:
```ruby
output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "reconciliation-logs-%{+YYYY.MM.dd}"
    # document_type removed (deprecated in Elasticsearch 7.0+)
  }
}
```

**Benefits**:
- Future-proof configuration
- Removes warning messages
- Cleaner logs

---

### Fix 4: Optimize Pipeline Configuration (LOW PRIORITY)

**Action**: Review and optimize pipeline settings

**Current** (`logging/logstash/logstash.yml`):
```yaml
pipeline.workers: 1
pipeline.batch.size: 125
pipeline.batch.delay: 50
```

**Recommended** (if order preservation not required):
```yaml
pipeline.workers: 2  # Increase for better throughput
pipeline.batch.size: 500  # Larger batches for efficiency
pipeline.batch.delay: 50
# Remove pipeline.ordered if event order not critical
```

**Benefits**:
- Better throughput
- Lower latency
- More efficient resource usage

---

### Fix 5: Add Resource Limits (MEDIUM PRIORITY)

**Action**: Add resource constraints to docker-compose.yml

**Add to logstash service**:
```yaml
logstash:
  # ... existing configuration ...
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

**Update environment variable**:
```yaml
environment:
  - "LS_JAVA_OPTS=-Xms256m -Xmx256m"  # Keep aligned with memory limit
```

**Benefits**:
- Predictable resource usage
- Prevents resource exhaustion
- Better container orchestration

---

### Fix 6: Add Logging Configuration (LOW PRIORITY)

**Action**: Configure structured logging for Logstash itself

**Add to logstash service**:
```yaml
logstash:
  # ... existing configuration ...
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

**Benefits**:
- Better log management
- Prevents disk space issues
- Easier troubleshooting

---

## 📋 Implementation Checklist

### Immediate Actions (Security & Reliability)

- [ ] **Fix 1**: Secure port 9600 exposure (remove or bind to localhost)
- [ ] **Fix 2**: Add health check to docker-compose.yml
- [ ] **Fix 3**: Remove deprecated `document_type` from pipeline.conf

### Short-term Actions (Performance & Operations)

- [ ] **Fix 5**: Add resource limits to docker-compose.yml
- [ ] **Fix 6**: Add logging configuration

### Long-term Actions (Optimization)

- [ ] **Fix 4**: Review and optimize pipeline configuration based on load patterns
- [ ] Monitor Logstash performance metrics
- [ ] Consider adding authentication for HTTP API if external access needed

---

## 🔍 Verification Steps

After implementing fixes, verify:

1. **Port Security**:
   ```bash
   # Should NOT be accessible from outside (if removed)
   curl http://localhost:9600/_node/stats  # Should fail if properly secured
   
   # Should be accessible from within container
   docker exec reconciliation-logstash curl http://localhost:9600/_node/stats
   ```

2. **Health Check**:
   ```bash
   docker inspect reconciliation-logstash | grep -A 10 Health
   # Should show health check configuration
   ```

3. **Pipeline**:
   ```bash
   docker logs reconciliation-logstash | grep -i "deprecated"
   # Should show no deprecated warnings
   ```

4. **Resource Limits**:
   ```bash
   docker stats reconciliation-logstash
   # Should show resource usage within limits
   ```

---

## 📊 Monitoring Recommendations

### Key Metrics to Monitor

1. **Port 5044 (Beats Input)**:
   - Connection count
   - Events received per second
   - Connection errors

2. **Port 9600 (HTTP API)**:
   - API response time
   - Request count
   - Error rate

3. **Pipeline Performance**:
   - Events processed per second
   - Pipeline latency
   - Queue size
   - Worker utilization

4. **Resource Usage**:
   - CPU usage
   - Memory usage (heap)
   - JVM GC metrics

### Monitoring Queries

**Check Logstash health**:
```bash
curl http://localhost:9600/_node/stats | jq '.jvm.mem.heap_used_percent'
```

**Check pipeline status**:
```bash
curl http://localhost:9600/_node/stats | jq '.pipelines.main.events'
```

**Check input connections**:
```bash
curl http://localhost:9600/_node/stats | jq '.pipelines.main.plugins.inputs'
```

---

## 🎯 Summary

### Current State
- ✅ Both ports are functional and correctly configured
- ⚠️ Security concerns with port 9600 exposure
- ⚠️ Missing health check configuration
- ⚠️ Deprecated configuration warnings

### Recommended Actions
1. **Immediate**: Secure port 9600 (remove host exposure)
2. **Immediate**: Add health check
3. **Short-term**: Remove deprecated configuration
4. **Short-term**: Add resource limits
5. **Long-term**: Optimize pipeline configuration

### Expected Outcomes
- 🔒 Improved security posture
- 🔄 Better service reliability
- 📈 Enhanced monitoring capabilities
- 🚀 Future-proof configuration

---

**Report Generated**: November 16, 2025  
**Next Review**: After implementing fixes

