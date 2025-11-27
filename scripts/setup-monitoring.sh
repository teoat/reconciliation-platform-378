#!/bin/bash

# Monitoring Setup Script for 378 Reconciliation Platform
# This script sets up comprehensive monitoring with Prometheus, Grafana, and Alertmanager

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
MONITORING_DIR="/opt/monitoring"
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-"admin123"}
PROMETHEUS_RETENTION=${PROMETHEUS_RETENTION:-"30d"}

# Note: # Root check handled at script start from common-functions.sh checks for non-root
# This script needs root, so we check directly
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root"
    exit 1
fi

# Install required packages
install_packages() {
    log_info "Installing required packages..."
    
    # Update package list
    apt-get update
    
    # Install required packages
    apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates
    
    log_success "Packages installed"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    log "Docker installed"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Download Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make executable
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    log "Docker Compose installed"
}

# Create monitoring directory structure
create_directories() {
    log "Creating monitoring directory structure..."
    
    mkdir -p ${MONITORING_DIR}/{prometheus,grafana,alertmanager,node-exporter,postgres-exporter,redis-exporter,nginx-exporter}
    mkdir -p ${MONITORING_DIR}/grafana/{dashboards,datasources,provisioning}
    mkdir -p ${MONITORING_DIR}/prometheus/{rules,alerts}
    
    log "Directories created"
}

# Create Prometheus configuration
create_prometheus_config() {
    log "Creating Prometheus configuration..."
    
    cat > ${MONITORING_DIR}/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Backend application
  - job_name: 'reconciliation-platform'
    static_configs:
      - targets: ['backend:9090']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

  # PostgreSQL exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s

  # Redis exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 30s

  # Node exporter
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 30s

  # Nginx exporter
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    scrape_interval: 30s
EOF

    log "Prometheus configuration created"
}

# Create Alertmanager configuration
create_alertmanager_config() {
    log "Creating Alertmanager configuration..."
    
    cat > ${MONITORING_DIR}/alertmanager/alertmanager.yml << EOF
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@378reconciliation.com'
  smtp_auth_username: 'alerts@378reconciliation.com'
  smtp_auth_password: 'your_smtp_password'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://webhook:5001/'

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@378reconciliation.com'
        subject: '[CRITICAL] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts'
        title: 'Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'warning-alerts'
    email_configs:
      - to: 'team@378reconciliation.com'
        subject: '[WARNING] {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF

    log "Alertmanager configuration created"
}

# Create Grafana datasource configuration
create_grafana_datasource() {
    log "Creating Grafana datasource configuration..."
    
    cat > ${MONITORING_DIR}/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    log "Grafana datasource configuration created"
}

# Create Grafana dashboard configuration
create_grafana_dashboard() {
    log "Creating Grafana dashboard configuration..."
    
    cat > ${MONITORING_DIR}/grafana/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

    log "Grafana dashboard configuration created"
}

# Create Docker Compose file for monitoring
create_docker_compose() {
    log "Creating Docker Compose file for monitoring..."
    
    cat > ${MONITORING_DIR}/docker-compose.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=${PROMETHEUS_RETENTION}'
      - '--web.enable-lifecycle'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_SECURITY_ADMIN_USER: admin
      GF_USERS_ALLOW_SIGN_UP: false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=https://alerts.378reconciliation.com'
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      DATA_SOURCE_NAME: "postgresql://reconciliation_user:password@postgres:5432/reconciliation_platform?sslmode=disable"
    restart: unless-stopped

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      REDIS_ADDR: "redis://redis:6379"
    restart: unless-stopped

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: nginx-exporter
    ports:
      - "9113:9113"
    command:
      - '-nginx.scrape-uri=http://nginx:8080/nginx_status'
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
EOF

    log "Docker Compose file created"
}

# Create systemd service for monitoring
create_systemd_service() {
    log "Creating systemd service for monitoring..."
    
    cat > /etc/systemd/system/monitoring.service << EOF
[Unit]
Description=Monitoring Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${MONITORING_DIR}
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    # Enable service
    systemctl daemon-reload
    systemctl enable monitoring.service
    
    log "Systemd service created and enabled"
}

# Start monitoring stack
start_monitoring() {
    log "Starting monitoring stack..."
    
    cd ${MONITORING_DIR}
    docker-compose up -d
    
    # Wait for services to be ready
    sleep 30
    
    log "Monitoring stack started"
}

# Verify monitoring setup
verify_setup() {
    log "Verifying monitoring setup..."
    
    # Check if services are running
    if ! docker-compose ps | grep -q "Up"; then
        error "Some monitoring services are not running"
    fi
    
    # Check Prometheus
    if ! curl -f -s http://localhost:9090/-/healthy > /dev/null; then
        error "Prometheus is not healthy"
    fi
    
    # Check Grafana
    if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
        error "Grafana is not healthy"
    fi
    
    # Check Alertmanager
    if ! curl -f -s http://localhost:9093/-/healthy > /dev/null; then
        error "Alertmanager is not healthy"
    fi
    
    log "Monitoring setup verified successfully"
}

# Create monitoring dashboard
create_dashboard() {
    log "Creating monitoring dashboard..."
    
    # This would typically import a pre-built dashboard
    # For now, we'll create a basic dashboard configuration
    
    cat > ${MONITORING_DIR}/grafana/dashboards/overview.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "378 Reconciliation Platform Overview",
    "tags": ["reconciliation", "platform"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "System Overview",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "Services Up"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 0
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    log "Dashboard created"
}

# Main function
main() {
    log "Starting monitoring setup..."
    
    # Check if running as root
    check_root
    
    # Install required packages
    install_packages
    
    # Install Docker
    install_docker
    
    # Install Docker Compose
    install_docker_compose
    
    # Create directories
    create_directories
    
    # Create configurations
    create_prometheus_config
    create_alertmanager_config
    create_grafana_datasource
    create_grafana_dashboard
    create_docker_compose
    create_systemd_service
    
    # Create dashboard
    create_dashboard
    
    # Start monitoring
    start_monitoring
    
    # Verify setup
    verify_setup
    
    log "Monitoring setup completed successfully!"
    log "Access URLs:"
    log "  Prometheus: http://localhost:9090"
    log "  Grafana: http://localhost:3000 (admin/${GRAFANA_ADMIN_PASSWORD})"
    log "  Alertmanager: http://localhost:9093"
}

# Run main function
main "$@"
