#!/bin/bash
# ============================================================================
# UNIFIED MONITORING SETUP - 378 Reconciliation Platform
# ============================================================================
# Comprehensive monitoring setup with multiple modes
# Usage: ./setup-monitoring.sh [mode] [options]
# Modes: basic, production, full
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
MODE="${1:-basic}"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-admin123}"
PROMETHEUS_RETENTION="${PROMETHEUS_RETENTION:-30d}"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}📊 378 Reconciliation Platform - Monitoring Setup${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "Mode: ${GREEN}${MODE}${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${GREEN}>>> $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error and exit
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check Docker
    if ! docker info > /dev/null 2>&1; then
        error_exit "Docker is not running. Please start Docker first."
    fi

    # Check docker-compose
    if ! command -v docker-compose > /dev/null 2>&1 && ! docker compose version > /dev/null 2>&1; then
        error_exit "docker-compose is not installed"
    fi

    echo -e "${GREEN}✅ Prerequisites met${NC}"
}

# Basic monitoring setup
setup_basic() {
    print_step "Setting up basic monitoring..."

    # Create monitoring directories
    mkdir -p monitoring/logs

    # Configure basic environment variables
    if [ -f ".env" ]; then
        # Add basic monitoring config to .env
        if ! grep -q "PROMETHEUS_PORT" .env; then
            echo "" >> .env
            echo "# Monitoring" >> .env
            echo "PROMETHEUS_PORT=9090" >> .env
            echo "GRAFANA_PORT=3000" >> .env
            echo "GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}" >> .env
        fi
    fi

    # Create basic docker-compose monitoring file
    cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=${PROMETHEUS_RETENTION}'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_SECURITY_ADMIN_USER: admin
      GF_USERS_ALLOW_SIGN_UP: false
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
EOF

    # Create basic Prometheus config
    mkdir -p monitoring
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'reconciliation-platform'
    static_configs:
      - targets: ['host.docker.internal:2000']
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF

    print_success "Basic monitoring setup complete"
}

# Production monitoring setup
setup_production() {
    print_step "Setting up production monitoring..."

    # Create performance directories
    mkdir -p performance-results
    mkdir -p performance-alerts
    mkdir -p monitoring/logs

    # Set performance baseline
    if [ ! -f "performance-results/baseline.json" ]; then
        print_step "Creating performance baseline..."

        cat > performance-results/baseline.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")",
  "bundleSize": {
    "totalSizeMB": 4.2,
    "chunks": [
      {"name": "app.js", "sizeKB": 1200},
      {"name": "vendor.js", "sizeKB": 800},
      {"name": "common.js", "sizeKB": 300}
    ]
  },
  "lighthouse": {
    "performance": 85,
    "firstContentfulPaint": 1800,
    "largestContentfulPaint": 2500,
    "firstInputDelay": 50,
    "cumulativeLayoutShift": 0.05
  },
  "synthetic": {
    "initialLoadTime": 2200,
    "domContentLoaded": 1500,
    "firstPaint": 1200,
    "reactHydrationTime": 400
  }
}
EOF
        print_success "Performance baseline created"
    fi

    # Configure alert channels
    if [ -f ".env" ]; then
        if ! grep -q "SLACK_WEBHOOK_URL" .env; then
            echo "" >> .env
            echo "# Alert Channels" >> .env
            echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" >> .env
            echo "ALERT_EMAIL_TO=alerts@yourcompany.com" >> .env
            echo "GITHUB_REPO=your-org/reconciliation-platform" >> .env
        fi
    fi

    # Setup automated monitoring cron job
    if command -v crontab > /dev/null 2>&1; then
        CRON_JOB="0 */4 * * * cd $(pwd) && npm run performance:test > monitoring/logs/performance-\$(date +\%Y\%m\%d-\%H\%M\%S).log 2>&1"

        if ! crontab -l 2>/dev/null | grep -q "performance:test"; then
            print_step "Setting up automated performance monitoring..."
            (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
            print_success "Cron job added for performance monitoring"
        fi
    fi

    print_success "Production monitoring setup complete"
}

# Full monitoring setup (requires root)
setup_full() {
    print_step "Setting up full monitoring infrastructure..."

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error_exit "Full monitoring setup requires root privileges. Run with sudo."
    fi

    # Install required packages
    print_step "Installing required packages..."
    apt-get update
    apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates

    # Install Docker if not present
    if ! command -v docker > /dev/null 2>&1; then
        print_step "Installing Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        systemctl start docker
        systemctl enable docker
    fi

    # Install Docker Compose if not present
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_step "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    fi

    # Create monitoring directory structure
    MONITORING_DIR="/opt/monitoring"
    mkdir -p ${MONITORING_DIR}/{prometheus,grafana,alertmanager,node-exporter,postgres-exporter,redis-exporter,nginx-exporter}
    mkdir -p ${MONITORING_DIR}/grafana/{dashboards,datasources,provisioning}
    mkdir -p ${MONITORING_DIR}/prometheus/{rules,alerts}

    # Create comprehensive Prometheus config
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
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'reconciliation-platform'
    static_configs:
      - targets: ['backend:9090']
    metrics_path: '/metrics'
    scrape_interval: 30s
    scrape_timeout: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 30s

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 30s
EOF

    # Create Alertmanager config
    cat > ${MONITORING_DIR}/alertmanager/alertmanager.yml << EOF
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@378reconciliation.com'

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
EOF

    # Create Grafana datasource config
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

    # Create full docker-compose file
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
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
EOF

    # Create systemd service
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

    systemctl daemon-reload
    systemctl enable monitoring.service

    print_success "Full monitoring infrastructure setup complete"
}

# Start monitoring services
start_monitoring() {
    case "$MODE" in
        basic)
            print_step "Starting basic monitoring..."
            docker-compose -f docker-compose.monitoring.yml up -d
            ;;
        production)
            print_step "Production monitoring is configured (no services to start)"
            ;;
        full)
            print_step "Starting full monitoring stack..."
            cd /opt/monitoring
            docker-compose up -d
            ;;
    esac

    # Wait and verify
    sleep 10

    case "$MODE" in
        basic|full)
            if curl -f -s http://localhost:9090/-/healthy > /dev/null; then
                print_success "Prometheus is healthy"
            else
                echo -e "${YELLOW}⚠️  Prometheus health check failed${NC}"
            fi

            if curl -f -s http://localhost:3000/api/health > /dev/null; then
                print_success "Grafana is healthy"
            else
                echo -e "${YELLOW}⚠️  Grafana health check failed${NC}"
            fi
            ;;
    esac
}

# Show access information
show_access_info() {
    echo ""
    echo -e "${BLUE}Monitoring Access Information:${NC}"

    case "$MODE" in
        basic|full)
            echo -e "  Prometheus: ${GREEN}http://localhost:9090${NC}"
            echo -e "  Grafana:    ${GREEN}http://localhost:3000${NC} (admin/${GRAFANA_ADMIN_PASSWORD})"
            ;;
    esac

    case "$MODE" in
        full)
            echo -e "  Alertmanager: ${GREEN}http://localhost:9093${NC}"
            echo -e "  Node Exporter: ${GREEN}http://localhost:9100${NC}"
            ;;
    esac

    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    case "$MODE" in
        basic)
            echo -e "  Start:  ${YELLOW}docker-compose -f docker-compose.monitoring.yml up -d${NC}"
            echo -e "  Stop:   ${YELLOW}docker-compose -f docker-compose.monitoring.yml down${NC}"
            ;;
        full)
            echo -e "  Start:  ${YELLOW}sudo systemctl start monitoring${NC}"
            echo -e "  Stop:   ${YELLOW}sudo systemctl stop monitoring${NC}"
            ;;
    esac
}

# Main logic
case "$MODE" in
    basic)
        check_prerequisites
        setup_basic
        start_monitoring
        show_access_info
        ;;
    production)
        setup_production
        show_access_info
        ;;
    full)
        setup_full
        start_monitoring
        show_access_info
        ;;
    *)
        echo -e "${RED}Unknown monitoring mode: $MODE${NC}"
        echo "Usage: $0 [mode] [options]"
        echo ""
        echo "Modes:"
        echo "  basic      Basic Prometheus + Grafana setup (default)"
        echo "  production Production performance monitoring"
        echo "  full       Full infrastructure monitoring (requires root)"
        echo ""
        echo "Options:"
        echo "  GRAFANA_ADMIN_PASSWORD=your_password   Set Grafana admin password"
        echo "  PROMETHEUS_RETENTION=30d              Set Prometheus data retention"
        echo ""
        echo "Examples:"
        echo "  $0 basic"
        echo "  $0 production"
        echo "  GRAFANA_ADMIN_PASSWORD=mypassword $0 full"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}  📊 Monitoring setup completed successfully!${NC}"
echo -e "${GREEN}============================================================================${NC}"