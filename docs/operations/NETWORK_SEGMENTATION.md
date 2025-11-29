# Network Segmentation Guide

**Last Updated**: 2025-11-29  
**Status**: ACTIVE  
**Purpose**: Network segmentation strategy for production deployment

---

## Overview

Network segmentation isolates different components of the Reconciliation Platform to minimize attack surface and contain potential security breaches.

---

## Network Architecture

### Production Environment

```
Internet
  │
  ├─ Load Balancer (Public)
  │   ├─ Frontend (Public Subnet)
  │   └─ API Gateway (Public Subnet)
  │
  ├─ Application Tier (Private Subnet)
  │   ├─ Backend Services
  │   ├─ Worker Services
  │   └─ Background Jobs
  │
  ├─ Data Tier (Isolated Subnet)
  │   ├─ PostgreSQL (Primary)
  │   ├─ PostgreSQL (Replica)
  │   └─ Redis Cluster
  │
  └─ Management Tier (Management Subnet)
      ├─ Monitoring
      ├─ Logging
      └─ Admin Tools
```

---

## Network Zones

### 1. Public Zone

**Purpose**: Expose services to the internet

**Components**:
- Load Balancer
- Frontend (CDN/Static hosting)
- API Gateway

**Security**:
- HTTPS only
- DDoS protection
- WAF (Web Application Firewall)
- Rate limiting

**Access Rules**:
- Inbound: HTTPS (443) from internet
- Outbound: To Application Tier only

---

### 2. Application Tier (Private)

**Purpose**: Application services

**Components**:
- Backend API services
- Worker services
- Background job processors

**Security**:
- No direct internet access
- Internal communication only
- Service-to-service authentication

**Access Rules**:
- Inbound: From Public Zone (via Load Balancer)
- Outbound: To Data Tier and Management Tier
- No direct internet access

---

### 3. Data Tier (Isolated)

**Purpose**: Database and cache services

**Components**:
- PostgreSQL (Primary)
- PostgreSQL (Read Replicas)
- Redis Cluster

**Security**:
- No internet access
- Encrypted connections only
- IP whitelisting
- Database firewall rules

**Access Rules**:
- Inbound: From Application Tier only
- Outbound: None (no internet access)
- Ports: 5432 (PostgreSQL), 6379 (Redis)

---

### 4. Management Tier

**Purpose**: Monitoring, logging, and administration

**Components**:
- Monitoring (Prometheus, Grafana)
- Logging (ELK Stack, Loki)
- Admin tools
- CI/CD runners

**Security**:
- VPN access only
- Multi-factor authentication
- Audit logging

**Access Rules**:
- Inbound: From VPN only
- Outbound: To all tiers (read-only for monitoring)

---

## Kubernetes Network Policies

### Backend Service Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: reconciliation-platform
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to:
    - namespaceSelector:
        matchLabels:
          name: monitoring
    ports:
    - protocol: TCP
      port: 9090
```

### Database Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-network-policy
  namespace: reconciliation-platform
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432
  # No egress - database doesn't initiate connections
```

---

## Cloud Provider Implementation

### AWS

**VPC Configuration**:
- Public Subnet: Internet Gateway
- Private Subnet: NAT Gateway
- Isolated Subnet: No internet gateway
- Management Subnet: VPN Gateway

**Security Groups**:
- Frontend: Allow HTTPS from internet
- Backend: Allow from Load Balancer only
- Database: Allow from Backend only
- Redis: Allow from Backend only

### GCP

**VPC Configuration**:
- Public Subnet: Cloud NAT
- Private Subnet: Private Google Access
- Isolated Subnet: No external access
- Management Subnet: Cloud VPN

**Firewall Rules**:
- Similar to AWS Security Groups
- Use GCP firewall rules

### Azure

**VNet Configuration**:
- Public Subnet: Public IP
- Private Subnet: NAT Gateway
- Isolated Subnet: Private endpoint
- Management Subnet: VPN Gateway

**Network Security Groups**:
- Similar to AWS Security Groups
- Use Azure NSGs

---

## Implementation Checklist

### Phase 1: Basic Segmentation
- [ ] Create separate subnets/VPCs
- [ ] Configure security groups/firewalls
- [ ] Implement network policies
- [ ] Test connectivity

### Phase 2: Enhanced Security
- [ ] Enable encryption in transit
- [ ] Implement IP whitelisting
- [ ] Configure WAF rules
- [ ] Set up DDoS protection

### Phase 3: Monitoring
- [ ] Network flow logging
- [ ] Security monitoring
- [ ] Anomaly detection
- [ ] Alerting

---

## Best Practices

1. **Principle of Least Privilege**
   - Only allow necessary traffic
   - Deny by default
   - Whitelist, don't blacklist

2. **Defense in Depth**
   - Multiple layers of security
   - Network + Application + Data security

3. **Monitoring**
   - Log all network traffic
   - Monitor for anomalies
   - Alert on suspicious activity

4. **Regular Audits**
   - Review network policies quarterly
   - Test segmentation
   - Update rules as needed

---

## Troubleshooting

### Connectivity Issues

```bash
# Test connectivity between pods
kubectl exec -it <pod1> -n reconciliation-platform -- \
  ping <pod2-ip>

# Test database connectivity
kubectl exec -it <backend-pod> -n reconciliation-platform -- \
  psql $DATABASE_URL -c "SELECT 1;"

# Check network policies
kubectl get networkpolicies -n reconciliation-platform
kubectl describe networkpolicy <policy-name> -n reconciliation-platform
```

### Security Group Issues

```bash
# Check security group rules (AWS)
aws ec2 describe-security-groups --group-ids <sg-id>

# Test connectivity
telnet <host> <port>
nc -zv <host> <port>
```

---

## Related Documentation

- [Security Hardening](../project-management/SECURITY_HARDENING_IMPLEMENTATION.md)
- [Production Deployment Plan](../deployment/DEPLOYMENT_RUNBOOK.md)
- [Kubernetes Configuration](../deployment/KUBERNETES_DOCKER_CONFIGURATION_ANALYSIS.md)

---

**Last Updated**: 2025-11-29  
**Maintained By**: DevOps Team

