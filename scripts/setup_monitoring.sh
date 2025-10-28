#!/bin/bash
# Setup Monitoring Infrastructure
# Configures Sentry, Prometheus, and Grafana

set -e

echo "📊 Setting up monitoring infrastructure..."

# Check environment variables
if [ -z "$SENTRY_DSN" ]; then
    echo "⚠️  SENTRY_DSN not set. Creating placeholder..."
    echo "SENTRY_DSN=https://your-sentry-dsn@sentry.io/project" >> .env
fi

# Configure Grafana datasources
echo "📈 Configuring Grafana..."

cat > infrastructure/grafana/datasources.yaml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
EOF

# Create Grafana dashboards directory
mkdir -p infrastructure/grafana/dashboards

echo "✅ Monitoring configuration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add your Sentry DSN to .env:"
echo "   SENTRY_DSN=https://your-key@sentry.io/your-project"
echo ""
echo "2. Start monitoring stack:"
echo "   docker-compose -f docker-compose.monitoring.yml up -d"
echo ""
echo "3. Access dashboards:"
echo "   Grafana: http://localhost:3000"
echo "   Prometheus: http://localhost:9090"
echo ""

