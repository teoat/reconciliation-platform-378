# Horizontal Scaling Guide

## Overview

This guide covers horizontal scaling strategies for the Reconciliation Platform, including stateless service design, Kubernetes auto-scaling, and best practices for building scalable distributed systems.

## Stateless Service Design

### Principles

1. **No Local State**: Store all state in external systems (Redis, PostgreSQL)
2. **External Sessions**: Use Redis for session storage
3. **Distributed Caching**: Share cache across instances
4. **Idempotent Operations**: Design APIs for safe retries
5. **Load Balancer Friendly**: No sticky sessions required

### Backend Implementation

```rust
// Stateless service configuration
pub struct AppConfig {
    // Database connection pool (shared state)
    pub db_pool: PgPool,
    
    // Redis for caching and sessions
    pub redis_pool: Pool,
    
    // No in-memory state
    // All data in external stores
}

// Session stored in Redis, not in memory
pub async fn get_session(redis: &Pool, token: &str) -> Result<Session> {
    let mut conn = redis.get().await?;
    let session_data: String = conn.get(format!("session:{}", token)).await?;
    Ok(serde_json::from_str(&session_data)?)
}

// Idempotent operation design
pub async fn create_reconciliation(
    db: &PgPool,
    idempotency_key: &str,
    input: CreateReconciliationInput,
) -> Result<Reconciliation> {
    // Check for existing operation with same idempotency key
    if let Some(existing) = get_by_idempotency_key(db, idempotency_key).await? {
        return Ok(existing);
    }
    
    // Create new reconciliation
    create_new_reconciliation(db, idempotency_key, input).await
}
```

### Frontend Implementation

```typescript
// Stateless API client
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  // Token from storage, not memory
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

// Retry with exponential backoff
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config._retry && error.response?.status >= 500) {
      config._retry = true;
      await new Promise((r) => setTimeout(r, 1000));
      return apiClient(config);
    }
    throw error;
  }
);
```

## Kubernetes Auto-Scaling

### Horizontal Pod Autoscaler (HPA)

```yaml
# k8s/optimized/base/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: reconciliation-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 20
  metrics:
    # CPU-based scaling
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    
    # Memory-based scaling
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    
    # Custom metrics (requests per second)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: backend-vpa
  namespace: reconciliation-platform
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: backend
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 4
          memory: 8Gi
        controlledResources: ["cpu", "memory"]
```

### Cluster Autoscaler

```yaml
# AWS EKS Cluster Autoscaler
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
spec:
  template:
    spec:
      containers:
        - name: cluster-autoscaler
          image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0
          command:
            - ./cluster-autoscaler
            - --v=4
            - --cloud-provider=aws
            - --skip-nodes-with-local-storage=false
            - --expander=least-waste
            - --scale-down-enabled=true
            - --scale-down-delay-after-add=10m
            - --scale-down-unneeded-time=10m
            - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/reconciliation-cluster
```

### Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: backend-pdb
  namespace: reconciliation-platform
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: reconciliation-platform
      component: backend
```

## KEDA (Event-Driven Autoscaling)

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: backend-scaledobject
  namespace: reconciliation-platform
spec:
  scaleTargetRef:
    name: backend
  pollingInterval: 15
  cooldownPeriod: 300
  minReplicaCount: 2
  maxReplicaCount: 50
  triggers:
    # Scale based on Redis queue length
    - type: redis
      metadata:
        address: redis:6379
        listName: reconciliation-queue
        listLength: "100"
    
    # Scale based on PostgreSQL connections
    - type: postgresql
      metadata:
        targetQueryValue: "100"
        connectionFromEnv: DATABASE_URL
        query: "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"
    
    # Scale based on Prometheus metrics
    - type: prometheus
      metadata:
        serverAddress: http://prometheus:9090
        metricName: http_requests_total
        threshold: "1000"
        query: sum(rate(http_requests_total{service="backend"}[2m]))
```

## Load Balancing Configuration

### Nginx Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: reconciliation-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/load-balance: "round_robin"
    nginx.ingress.kubernetes.io/upstream-hash-by: "$request_uri"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "route"
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
spec:
  rules:
    - host: api.reconciliation-platform.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 80
```

### AWS Application Load Balancer

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: reconciliation-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/load-balancer-attributes: |
      idle_timeout.timeout_seconds=60,
      routing.http.drop_invalid_header_fields.enabled=true
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "15"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "3"
```

## Database Scaling

### PostgreSQL Read Replicas

```yaml
# Using CloudNativePG
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: reconciliation-postgres
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised
  
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      work_mem: "16MB"
  
  bootstrap:
    initdb:
      database: reconciliation
      owner: app
  
  storage:
    size: 100Gi
    storageClass: gp3
  
  resources:
    requests:
      memory: 2Gi
      cpu: 1
    limits:
      memory: 4Gi
      cpu: 2
```

### Redis Cluster

```yaml
# Using Redis Operator
apiVersion: redis.redis.opstreelabs.in/v1beta1
kind: RedisCluster
metadata:
  name: reconciliation-redis
spec:
  clusterSize: 3
  clusterVersion: "7.2.0"
  persistenceEnabled: true
  
  kubernetesConfig:
    resources:
      requests:
        cpu: 500m
        memory: 1Gi
      limits:
        cpu: 1
        memory: 2Gi
  
  storage:
    volumeClaimTemplate:
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

## Monitoring Scaling Events

### Prometheus Rules

```yaml
groups:
  - name: scaling
    rules:
      - alert: HighCPUUtilization
        expr: |
          avg(rate(container_cpu_usage_seconds_total{container="backend"}[5m])) by (pod) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High CPU utilization on {{ $labels.pod }}
      
      - alert: ScalingThrottled
        expr: |
          kube_horizontalpodautoscaler_status_condition{condition="ScalingLimited", status="true"} == 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: HPA {{ $labels.horizontalpodautoscaler }} is scaling limited
      
      - alert: PodEvictions
        expr: |
          increase(kube_pod_container_status_restarts_total[1h]) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High pod restart rate
```

### Grafana Dashboard

Key metrics to monitor:
- Pod count over time
- HPA target vs current replicas
- Resource utilization per pod
- Request latency percentiles
- Error rates during scaling events
- Queue depth (for event-driven scaling)

## Best Practices

1. **Start with HPA on CPU/Memory** - Simple and effective
2. **Add custom metrics gradually** - Only when needed
3. **Set appropriate PDB** - Ensure availability during scaling
4. **Test scaling behavior** - Load test before production
5. **Monitor scaling events** - Track and alert on anomalies
6. **Right-size resources** - Use VPA recommendations
7. **Implement graceful shutdown** - Handle SIGTERM properly
8. **Use pod anti-affinity** - Spread pods across nodes
9. **Configure probes correctly** - Avoid premature scaling
10. **Document scaling limits** - Know your system boundaries

## Scaling Limits

| Component | Min Replicas | Max Replicas | Scale Trigger |
|-----------|--------------|--------------|---------------|
| Backend | 2 | 20 | CPU > 70% |
| Frontend | 3 | 30 | CPU > 70% |
| Workers | 1 | 10 | Queue > 100 |
| Database | 3 | 3 | Manual |
| Redis | 3 | 6 | Memory > 80% |
