# Logstash Troubleshooting Runbook

**Service**: `reconciliation-logstash`  
**Last Updated**: December 2024

---

## 🚨 Quick Reference

### Container Information
- **Container Name**: `reconciliation-logstash`
- **Image**: `docker.elastic.co/logstash/logstash:8.11.0`
- **Ports**: 
  - `5044` (Beats input)
  - `9600` (HTTP API, localhost only)

### Quick Health Check
```bash
# Check container status
docker ps | grep reconciliation-logstash

# Check health status
docker inspect reconciliation-logstash | jq '.[0].State.Health'

# Test HTTP API
curl http://localhost:9600/_node/stats
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Container Not Starting

**Symptoms**:
- Container exits immediately
- Status shows "Exited" or "Restarting"

**Diagnosis**:
```bash
# Check container status
docker ps -a | grep reconciliation-logstash

# Check logs
docker logs reconciliation-logstash

# Check recent events
docker inspect reconciliation-logstash | jq '.[0].State'
```

**Common Causes & Solutions**:

1. **Configuration Error**
   ```bash
   # Check pipeline configuration
   docker exec reconciliation-logstash cat /usr/share/logstash/pipeline/logstash.conf
   
   # Check logstash.yml
   docker exec reconciliation-logstash cat /usr/share/logstash/config/logstash.yml
   ```

2. **Elasticsearch Not Available**
   ```bash
   # Verify Elasticsearch is running
   docker ps | grep reconciliation-elasticsearch
   
   # Test connectivity
   docker exec reconciliation-logstash nc -z elasticsearch 9200
   ```

3. **Port Conflicts**
   ```bash
   # Check if ports are in use
   netstat -tlnp | grep 5044
   netstat -tlnp | grep 9600
   
   # Check Docker port mappings
   docker port reconciliation-logstash
   ```

**Solution**:
```bash
# Restart the service
docker-compose restart logstash

# Or recreate if needed
docker-compose up -d logstash
```

---

### Issue 2: Port 5044 Not Listening

**Symptoms**:
- Filebeat cannot connect to Logstash
- Connection refused errors in Filebeat logs
- No logs being ingested

**Diagnosis**:
```bash
# Check if port is listening
docker exec reconciliation-logstash netstat -tlnp | grep 5044

# Test connectivity from Filebeat container
docker exec <filebeat-container> nc -z logstash 5044

# Check Logstash logs
docker logs reconciliation-logstash | grep -i "beats\|5044"
```

**Common Causes & Solutions**:

1. **Pipeline Not Started**
   ```bash
   # Check pipeline status
   curl http://localhost:9600/_node/pipelines
   
   # Check for errors
   docker logs reconciliation-logstash | grep -i error
   ```

2. **Network Issues**
   ```bash
   # Verify Docker network
   docker network inspect reconciliation-network | grep logstash
   
   # Test network connectivity
   docker exec reconciliation-logstash ping -c 1 elasticsearch
   ```

**Solution**:
```bash
# Restart Logstash
docker-compose restart logstash

# Verify Filebeat configuration
docker exec <filebeat-container> cat /usr/share/filebeat/filebeat.yml | grep logstash
```

---

### Issue 3: Port 9600 Not Accessible

**Symptoms**:
- Health check failing
- Cannot access HTTP API
- Monitoring tools cannot scrape metrics

**Diagnosis**:
```bash
# Check if port is listening
docker exec reconciliation-logstash netstat -tlnp | grep 9600

# Test from within container
docker exec reconciliation-logstash curl http://localhost:9600/_node/stats

# Test from host
curl http://localhost:9600/_node/stats

# Check port binding
docker port reconciliation-logstash | grep 9600
```

**Common Causes & Solutions**:

1. **Port Binding Issue**
   - Current config: `127.0.0.1:9600:9600` (localhost only)
   - If you need external access, check docker-compose.yml

2. **HTTP API Not Started**
   ```bash
   # Check Logstash logs
   docker logs reconciliation-logstash | grep -i "http\|9600"
   
   # Check logstash.yml
   docker exec reconciliation-logstash cat /usr/share/logstash/config/logstash.yml | grep http
   ```

**Solution**:
```bash
# Restart Logstash
docker-compose restart logstash

# Wait for startup (40s start_period)
sleep 45

# Test again
curl http://localhost:9600/_node/stats
```

---

### Issue 4: High Memory Usage

**Symptoms**:
- Container using excessive memory
- OOM (Out of Memory) errors
- Slow performance

**Diagnosis**:
```bash
# Check current memory usage
docker stats reconciliation-logstash --no-stream

# Check JVM heap usage
curl http://localhost:9600/_node/stats | jq '.jvm.mem.heap_used_percent'

# Check memory limits
docker inspect reconciliation-logstash | jq '.[0].HostConfig.Memory'
```

**Common Causes & Solutions**:

1. **Heap Too Large**
   - Current: `-Xms256m -Xmx256m`
   - Check if this matches your workload

2. **Large Batch Sizes**
   - Current: `pipeline.batch.size: 500`
   - Consider reducing if memory constrained

**Solution**:
```yaml
# Adjust in docker-compose.yml
environment:
  - "LS_JAVA_OPTS=-Xms128m -Xmx256m"  # Reduce initial heap

# Or adjust pipeline settings in logstash.yml
pipeline.batch.size: 250  # Reduce batch size
```

---

### Issue 5: No Logs Being Processed

**Symptoms**:
- No events in Elasticsearch indices
- Pipeline shows 0 events in/out
- Filebeat connected but no data

**Diagnosis**:
```bash
# Check pipeline events
curl http://localhost:9600/_node/stats | jq '.pipelines.main.events'

# Check Filebeat logs
docker logs <filebeat-container> | grep -i logstash

# Check Elasticsearch indices
curl http://localhost:9200/_cat/indices/reconciliation-logs-*?v

# Check Logstash logs for processing
docker logs reconciliation-logstash | grep -i "processing\|pipeline"
```

**Common Causes & Solutions**:

1. **Filebeat Not Sending Data**
   ```bash
   # Check Filebeat status
   docker exec <filebeat-container> filebeat test output
   
   # Check if logs exist
   docker exec <filebeat-container> ls -la /var/log/reconciliation-backend/
   ```

2. **Pipeline Filter Issues**
   ```bash
   # Check pipeline configuration
   docker exec reconciliation-logstash cat /usr/share/logstash/pipeline/logstash.conf
   
   # Enable debug logging temporarily
   # Add to logstash.yml: log.level: debug
   ```

3. **Elasticsearch Connection Issues**
   ```bash
   # Test Elasticsearch connectivity
   docker exec reconciliation-logstash curl http://elasticsearch:9200/_cluster/health
   
   # Check Elasticsearch logs
   docker logs reconciliation-elasticsearch | tail -50
   ```

**Solution**:
```bash
# Restart entire stack
docker-compose restart filebeat logstash

# Verify end-to-end
docker logs <filebeat-container> --tail 20
docker logs reconciliation-logstash --tail 20
curl http://localhost:9200/_cat/indices/reconciliation-logs-*?v
```

---

### Issue 6: Health Check Failing

**Symptoms**:
- Container shows "unhealthy" status
- Health check retries exhausted
- Container keeps restarting

**Diagnosis**:
```bash
# Check health check status
docker inspect reconciliation-logstash | jq '.[0].State.Health'

# Check health check logs
docker inspect reconciliation-logstash | jq '.[0].State.Health.Log'

# Test health check manually
docker exec reconciliation-logstash curl -f http://localhost:9600/_node/stats
```

**Common Causes & Solutions**:

1. **HTTP API Not Ready**
   - Health check starts after 40s (start_period)
   - May need more time if system is slow

2. **Curl Not Available**
   ```bash
   # Verify curl is available
   docker exec reconciliation-logstash which curl
   
   # If not, install or use alternative
   docker exec reconciliation-logstash wget -q -O- http://localhost:9600/_node/stats
   ```

**Solution**:
```yaml
# Adjust health check in docker-compose.yml if needed
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:9600/_node/stats || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s  # Increase if needed
```

---

## 🔧 Diagnostic Commands

### Container Status
```bash
# Basic status
docker ps | grep reconciliation-logstash

# Detailed status
docker inspect reconciliation-logstash | jq '.[0].State'

# Resource usage
docker stats reconciliation-logstash --no-stream
```

### Logs
```bash
# Recent logs
docker logs reconciliation-logstash --tail 100

# Follow logs
docker logs -f reconciliation-logstash

# Search for errors
docker logs reconciliation-logstash 2>&1 | grep -i error

# Search for warnings
docker logs reconciliation-logstash 2>&1 | grep -i warn
```

### Network
```bash
# Check network connectivity
docker exec reconciliation-logstash ping -c 1 elasticsearch

# Test port connectivity
docker exec reconciliation-logstash nc -z elasticsearch 9200

# Check network configuration
docker network inspect reconciliation-network | jq '.[0].Containers'
```

### Performance
```bash
# Node statistics
curl http://localhost:9600/_node/stats | jq

# Pipeline statistics
curl http://localhost:9600/_node/stats | jq '.pipelines'

# JVM metrics
curl http://localhost:9600/_node/stats | jq '.jvm'

# Hot threads
curl http://localhost:9600/_node/hot_threads
```

### Configuration
```bash
# View pipeline config
docker exec reconciliation-logstash cat /usr/share/logstash/pipeline/logstash.conf

# View logstash.yml
docker exec reconciliation-logstash cat /usr/share/logstash/config/logstash.yml

# Test configuration
docker exec reconciliation-logstash /usr/share/logstash/bin/logstash --config.test_and_exit --path.config=/usr/share/logstash/pipeline
```

---

## 📊 Monitoring & Metrics

### Key Metrics to Monitor

1. **Pipeline Events**
   ```bash
   curl http://localhost:9600/_node/stats | jq '.pipelines.main.events'
   ```

2. **JVM Heap Usage**
   ```bash
   curl http://localhost:9600/_node/stats | jq '.jvm.mem.heap_used_percent'
   ```

3. **Pipeline Latency**
   ```bash
   curl http://localhost:9600/_node/stats | jq '.pipelines.main.queue'
   ```

4. **Input/Output Rates**
   ```bash
   curl http://localhost:9600/_node/stats | jq '.pipelines.main.plugins'
   ```

### Alert Thresholds

- **Heap Usage**: > 80% (warning), > 90% (critical)
- **Pipeline Queue**: > 1000 events (warning), > 5000 events (critical)
- **Health Check Failures**: > 2 consecutive failures

---

## 🔄 Recovery Procedures

### Restart Logstash
```bash
# Graceful restart
docker-compose restart logstash

# Force restart
docker-compose stop logstash
docker-compose rm -f logstash
docker-compose up -d logstash
```

### Reset Logstash
```bash
# Stop and remove
docker-compose stop logstash
docker-compose rm -f logstash

# Recreate
docker-compose up -d logstash

# Verify
docker logs -f reconciliation-logstash
```

### Emergency Recovery
```bash
# If Logstash is completely broken
docker-compose stop logstash
docker-compose rm -f logstash

# Check configuration files
cat logging/logstash/pipeline.conf
cat logging/logstash/logstash.yml

# Recreate with fresh start
docker-compose up -d logstash

# Monitor startup
docker logs -f reconciliation-logstash
```

---

## 📚 Additional Resources

- **Comprehensive Analysis**: `LOGSTASH_COMPREHENSIVE_ANALYSIS.md`
- **Configuration Details**: `LOGSTASH_FIXES_COMPLETE.md`
- **Verification Script**: `scripts/verify-logstash.sh`
- **Elastic Documentation**: https://www.elastic.co/guide/en/logstash/current/index.html

---

## 🆘 Escalation

If issues persist after following this runbook:

1. **Collect Diagnostics**:
   ```bash
   # Run verification script
   ./scripts/verify-logstash.sh > logstash-diagnostics.txt
   
   # Collect logs
   docker logs reconciliation-logstash > logstash-logs.txt
   
   # Collect configuration
   docker exec reconciliation-logstash cat /usr/share/logstash/pipeline/logstash.conf > pipeline.conf
   docker exec reconciliation-logstash cat /usr/share/logstash/config/logstash.yml > logstash.yml
   ```

2. **Check Dependencies**:
   - Elasticsearch health
   - Filebeat connectivity
   - Network configuration
   - Resource availability

3. **Review Recent Changes**:
   - Configuration changes
   - Docker Compose updates
   - Environment variable changes

---

**Last Updated**: December 2024  
**Maintained By**: DevOps Team

