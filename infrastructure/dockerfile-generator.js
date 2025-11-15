// ============================================================================
// DOCKERFILE GENERATOR - Infrastructure Automation
// ============================================================================

class DockerfileGenerator {
  constructor() {
    this.templates = new Map();
    this.generatedFiles = new Map();
    this.isActive = false;
  }

  // Initialize the generator
  async initialize() {
    console.log('🐳 Initializing Dockerfile Generator...');

    this.loadTemplates();
    this.isActive = true;
    console.log('✅ Dockerfile Generator activated');
  }

  // Load Dockerfile templates
  loadTemplates() {
    // Node.js/Frontend Template
    this.templates.set('nodejs', {
      name: 'Node.js Application',
      baseImage: 'node:18-alpine',
      stages: ['deps', 'build', 'production'],
      ports: [3000, 3001],
      envVars: ['NODE_ENV', 'PORT', 'DATABASE_URL'],
      dockerfile: `# Multi-stage Node.js Dockerfile
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "start"]
`,
    });

    // Python/API Template
    this.templates.set('python', {
      name: 'Python API Service',
      baseImage: 'python:3.11-slim',
      stages: ['deps', 'production'],
      ports: [8000, 8001],
      envVars: ['ENVIRONMENT', 'PORT', 'DATABASE_URL', 'REDIS_URL'],
      dockerfile: `# Python API Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \\
    && chown -R app:app /app
USER app

EXPOSE 8000
ENV PORT=8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`,
    });

    // Go Service Template
    this.templates.set('go', {
      name: 'Go Microservice',
      baseImage: 'golang:1.21-alpine',
      stages: ['build', 'production'],
      ports: [8080, 8081],
      envVars: ['ENV', 'PORT', 'DATABASE_URL'],
      dockerfile: `# Multi-stage Go Dockerfile
FROM golang:1.21-alpine AS build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copy the binary from build stage
COPY --from=build /app/main .

EXPOSE 8080
ENV PORT=8080

CMD ["./main"]
`,
    });

    // Rust Service Template
    this.templates.set('rust', {
      name: 'Rust Service',
      baseImage: 'rust:1.70-slim',
      stages: ['build', 'production'],
      ports: [8080, 8081],
      envVars: ['RUST_ENV', 'PORT', 'DATABASE_URL'],
      dockerfile: `# Multi-stage Rust Dockerfile
FROM rust:1.70-slim AS build

WORKDIR /app

# Copy manifest files
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Build the application
RUN cargo build --release

FROM debian:bullseye-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \\
    ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from build stage
COPY --from=build /app/target/release/app .

EXPOSE 8080
ENV PORT=8080

CMD ["./app"]
`,
    });

    // Database Template (PostgreSQL)
    this.templates.set('postgres', {
      name: 'PostgreSQL Database',
      baseImage: 'postgres:15-alpine',
      stages: ['production'],
      ports: [5432],
      envVars: ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'],
      dockerfile: `# PostgreSQL Database Dockerfile
FROM postgres:15-alpine

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/

# Set environment variables
ENV POSTGRES_DB=myapp
ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword

EXPOSE 5432

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD pg_isready -U $POSTGRES_USER -d $POSTGRES_DB || exit 1
`,
    });

    // Redis Cache Template
    this.templates.set('redis', {
      name: 'Redis Cache',
      baseImage: 'redis:7-alpine',
      stages: ['production'],
      ports: [6379],
      envVars: ['REDIS_PASSWORD'],
      dockerfile: `# Redis Cache Dockerfile
FROM redis:7-alpine

# Copy configuration
COPY redis.conf /etc/redis/redis.conf

EXPOSE 6379

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD redis-cli ping || exit 1

CMD ["redis-server", "/etc/redis/redis.conf"]
`,
    });

    // Nginx Reverse Proxy Template
    this.templates.set('nginx', {
      name: 'Nginx Reverse Proxy',
      baseImage: 'nginx:alpine',
      stages: ['production'],
      ports: [80, 443],
      envVars: [],
      dockerfile: `# Nginx Reverse Proxy Dockerfile
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Copy SSL certificates (if needed)
# COPY ssl/ /etc/ssl/certs/

EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
`,
    });

    // Monitoring Stack (Prometheus)
    this.templates.set('prometheus', {
      name: 'Prometheus Monitoring',
      baseImage: 'prom/prometheus:latest',
      stages: ['production'],
      ports: [9090],
      envVars: [],
      dockerfile: `# Prometheus Monitoring Dockerfile
FROM prom/prometheus:latest

# Copy configuration
COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY rules/ /etc/prometheus/rules/

EXPOSE 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:9090/-/healthy || exit 1

CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus", "--web.console.libraries=/etc/prometheus/console_libraries", "--web.console.templates=/etc/prometheus/consoles", "--storage.tsdb.retention.time=200h", "--web.enable-lifecycle"]
`,
    });

    // Grafana Dashboard Template
    this.templates.set('grafana', {
      name: 'Grafana Dashboard',
      baseImage: 'grafana/grafana:latest',
      stages: ['production'],
      ports: [3000],
      envVars: ['GF_SECURITY_ADMIN_PASSWORD', 'GF_USERS_ALLOW_SIGN_UP'],
      dockerfile: `# Grafana Dashboard Dockerfile
FROM grafana/grafana:latest

# Copy provisioning configuration
COPY provisioning/ /etc/grafana/provisioning/
COPY dashboards/ /var/lib/grafana/dashboards/

# Set environment variables
ENV GF_SECURITY_ADMIN_USER=admin
ENV GF_USERS_ALLOW_SIGN_UP=false
ENV GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["grafana-server", "--homepath=/usr/share/grafana", "--config=/etc/grafana/grafana.ini"]
`,
    });
  }

  // Generate Dockerfile for service
  async generateDockerfile(serviceConfig) {
    const { serviceType, serviceName, ports = [], envVars = [], customConfig = {} } = serviceConfig;

    console.log(`🐳 Generating Dockerfile for ${serviceName} (${serviceType})`);

    const template = this.templates.get(serviceType);
    if (!template) {
      throw new Error(`Unknown service type: ${serviceType}`);
    }

    let dockerfile = template.dockerfile;

    // Customize ports
    if (ports.length > 0) {
      const exposeLines = ports.map((port) => `EXPOSE ${port}`).join('\n');
      dockerfile = dockerfile.replace(/EXPOSE \d+( \d+)*/g, exposeLines);
    }

    // Add custom environment variables
    if (envVars.length > 0) {
      const envLines = envVars.map((env) => `ENV ${env}`).join('\n');
      // Insert after existing ENV lines
      dockerfile = dockerfile.replace(/(ENV .*\n)+/, `$&${envLines}\n`);
    }

    // Apply custom configuration
    dockerfile = this.applyCustomConfig(dockerfile, customConfig, serviceType);

    const result = {
      serviceName,
      serviceType,
      dockerfile,
      metadata: {
        baseImage: template.baseImage,
        ports: ports.length > 0 ? ports : template.ports,
        envVars: [...template.envVars, ...envVars],
        generatedAt: new Date().toISOString(),
      },
    };

    this.generatedFiles.set(serviceName, result);
    console.log(`✅ Generated Dockerfile for ${serviceName}`);

    return result;
  }

  // Apply custom configuration
  applyCustomConfig(dockerfile, customConfig, serviceType) {
    let customized = dockerfile;

    switch (serviceType) {
      case 'nodejs':
        if (customConfig.buildCommand) {
          customized = customized.replace('RUN npm run build', `RUN ${customConfig.buildCommand}`);
        }
        if (customConfig.startCommand) {
          customized = customized.replace(
            'CMD ["npm", "start"]',
            `CMD ${customConfig.startCommand}`
          );
        }
        break;

      case 'python':
        if (customConfig.requirementsFile) {
          customized = customized.replace(
            'COPY requirements.txt .',
            `COPY ${customConfig.requirementsFile} .`
          );
          customized = customized.replace(
            'RUN pip install --no-cache-dir -r requirements.txt',
            `RUN pip install --no-cache-dir -r ${customConfig.requirementsFile}`
          );
        }
        if (customConfig.appModule) {
          customized = customized.replace(
            'CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]',
            `CMD ["uvicorn", "${customConfig.appModule}", "--host", "0.0.0.0", "--port", "8000"]`
          );
        }
        break;

      case 'go':
        if (customConfig.binaryName) {
          customized = customized.replace(
            'RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .',
            `RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o ${customConfig.binaryName} .`
          );
          customized = customized.replace(
            'COPY --from=build /app/main .',
            `COPY --from=build /app/${customConfig.binaryName} .`
          );
          customized = customized.replace('CMD ["./main"]', `CMD ["./${customConfig.binaryName}"]`);
        }
        break;

      case 'postgres':
        if (customConfig.database) {
          customized = customized.replace(
            'ENV POSTGRES_DB=myapp',
            `ENV POSTGRES_DB=${customConfig.database}`
          );
        }
        if (customConfig.username) {
          customized = customized.replace(
            'ENV POSTGRES_USER=myuser',
            `ENV POSTGRES_USER=${customConfig.username}`
          );
        }
        break;
    }

    return customized;
  }

  // Generate docker-compose.yml for multiple services
  async generateDockerCompose(services, config = {}) {
    console.log('🐳 Generating docker-compose.yml for services');

    const { version = '3.8', networks = ['app-network'], volumes = [] } = config;

    const composeConfig = {
      version,
      services: {},
      networks: {},
      volumes: {},
    };

    // Add networks
    networks.forEach((network) => {
      composeConfig.networks[network] = {
        driver: 'bridge',
      };
    });

    // Add volumes
    volumes.forEach((volume) => {
      composeConfig.volumes[volume] = {
        driver: 'local',
      };
    });

    // Add services
    for (const service of services) {
      const serviceConfig = await this.generateServiceConfig(service);
      composeConfig.services[service.serviceName] = serviceConfig;
    }

    const yamlContent = this.convertToYAML(composeConfig);

    console.log('✅ Generated docker-compose.yml');
    return yamlContent;
  }

  // Generate service configuration for docker-compose
  async generateServiceConfig(service) {
    const dockerfile = await this.generateDockerfile(service);

    const config = {
      build: {
        context: '.',
        dockerfile: `Dockerfile.${service.serviceName}`,
      },
      ports: service.ports || dockerfile.metadata.ports,
      environment: service.envVars || dockerfile.metadata.envVars,
      networks: ['app-network'],
    };

    // Add service-specific configuration
    switch (service.serviceType) {
      case 'postgres':
        config.volumes = [`${service.serviceName}_data:/var/lib/postgresql/data`];
        config.environment = config.environment.concat([
          'POSTGRES_DB=${POSTGRES_DB}',
          'POSTGRES_USER=${POSTGRES_USER}',
          'POSTGRES_PASSWORD=${POSTGRES_PASSWORD}',
        ]);
        break;

      case 'redis':
        config.volumes = [`${service.serviceName}_data:/data`];
        if (service.envVars?.includes('REDIS_PASSWORD')) {
          config.command = ['redis-server', '--requirepass', '${REDIS_PASSWORD}'];
        }
        break;

      case 'grafana':
        config.volumes = [
          `${service.serviceName}_data:/var/lib/grafana`,
          './monitoring/grafana/provisioning:/etc/grafana/provisioning',
          './monitoring/grafana/dashboards:/var/lib/grafana/dashboards',
        ];
        break;

      case 'prometheus':
        config.volumes = [
          `${service.serviceName}_data:/prometheus`,
          './monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml',
          './monitoring/prometheus/rules:/etc/prometheus/rules',
        ];
        config.command = [
          '--config.file=/etc/prometheus/prometheus.yml',
          '--storage.tsdb.path=/prometheus',
          '--web.console.libraries=/etc/prometheus/console_libraries',
          '--web.console.templates=/etc/prometheus/consoles',
        ];
        break;
    }

    // Add dependencies
    if (service.dependsOn) {
      config.depends_on = service.dependsOn;
    }

    // Add health checks
    if (service.healthCheck) {
      config.healthcheck = service.healthCheck;
    }

    return config;
  }

  // Convert configuration object to YAML
  convertToYAML(obj, indent = 0) {
    const spaces = ' '.repeat(indent * 2);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (typeof item === 'object') {
            yaml += `${spaces}  - ${this.convertToYAML(item, indent + 1).trim()}\n`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.convertToYAML(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  // Generate complete infrastructure setup
  async generateInfrastructure(services, outputDir = './infrastructure/generated') {
    console.log('🏗️ Generating complete infrastructure setup');

    const results = {
      dockerfiles: [],
      dockerCompose: '',
      scripts: [],
      documentation: '',
    };

    // Generate Dockerfiles
    for (const service of services) {
      const dockerfile = await this.generateDockerfile(service);
      results.dockerfiles.push(dockerfile);

      // Write Dockerfile to file system
      const filename = `Dockerfile.${service.serviceName}`;
      await this.writeFile(`${outputDir}/${filename}`, dockerfile.dockerfile);
    }

    // Generate docker-compose.yml
    results.dockerCompose = await this.generateDockerCompose(services);
    await this.writeFile(`${outputDir}/docker-compose.yml`, results.dockerCompose);

    // Generate deployment scripts
    results.scripts = await this.generateDeploymentScripts(services, outputDir);

    // Generate documentation
    results.documentation = this.generateDocumentation(services);

    console.log('✅ Complete infrastructure setup generated');
    return results;
  }

  // Generate deployment scripts
  async generateDeploymentScripts(services, outputDir) {
    const scripts = [];

    // Build script
    const buildScript = `#!/bin/bash
# Build all services
echo "Building all services..."

${services
  .map(
    (s) => `echo "Building ${s.serviceName}..."
docker build -f Dockerfile.${s.serviceName} -t ${s.serviceName}:latest .`
  )
  .join('\n')}

echo "All services built successfully!"
`;

    await this.writeFile(`${outputDir}/build.sh`, buildScript);
    scripts.push('build.sh');

    // Deploy script
    const deployScript = `#!/bin/bash
# Deploy infrastructure
echo "Deploying infrastructure..."

# Stop existing containers
docker-compose down

# Start services
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Check service health
docker-compose ps

echo "Infrastructure deployed successfully!"
echo "Access services at:"
${services
  .map((s) => {
    const ports = s.ports || this.templates.get(s.serviceType)?.ports || [];
    return ports.map((port) => `# ${s.serviceName}: http://localhost:${port}`).join('\n');
  })
  .join('\n')}
`;

    await this.writeFile(`${outputDir}/deploy.sh`, deployScript);
    scripts.push('deploy.sh');

    // Logs script
    const logsScript = `#!/bin/bash
# View logs for all services
docker-compose logs -f
`;

    await this.writeFile(`${outputDir}/logs.sh`, logsScript);
    scripts.push('logs.sh');

    return scripts;
  }

  // Generate documentation
  generateDocumentation(services) {
    const docs = `# Infrastructure Documentation

Generated on: ${new Date().toISOString()}

## Services

${services
  .map(
    (service) => `
### ${service.serviceName}
- **Type**: ${service.serviceType}
- **Ports**: ${service.ports?.join(', ') || 'Default'}
- **Environment Variables**: ${service.envVars?.join(', ') || 'None'}
- **Description**: ${service.description || 'No description provided'}
`
  )
  .join('\n')}

## Getting Started

1. Build all services:
   \`\`\`bash
   ./build.sh
   \`\`\`

2. Deploy infrastructure:
   \`\`\`bash
   ./deploy.sh
   \`\`\`

3. View logs:
   \`\`\`bash
   ./logs.sh
   \`\`\`

## Service URLs

${services
  .map((service) => {
    const ports = service.ports || this.templates.get(service.serviceType)?.ports || [];
    return ports.map((port) => `- ${service.serviceName}: http://localhost:${port}`).join('\n');
  })
  .join('\n')}

## Environment Variables

Make sure to set the following environment variables:

${services
  .flatMap((service) => service.envVars || [])
  .map((env) => `- \`${env}\``)
  .join('\n')}
`;

    return docs;
  }

  // Write file (simulated - in real implementation would write to filesystem)
  async writeFile(filename, content) {
    console.log(`📝 Writing file: ${filename}`);
    // In a real implementation, this would write to the filesystem
    // For now, we'll just log the action
  }

  // Get generator status
  getGeneratorStatus() {
    return {
      isActive: this.isActive,
      availableTemplates: Array.from(this.templates.keys()),
      generatedFiles: Array.from(this.generatedFiles.keys()),
      templateCount: this.templates.size,
    };
  }

  // Stop the generator
  stop() {
    this.isActive = false;
    console.log('⏹️ Dockerfile Generator stopped');
  }
}

// Export singleton instance
export const dockerfileGenerator = new DockerfileGenerator();

// Auto-initialize if running in Node.js environment
if (typeof window === 'undefined') {
  dockerfileGenerator.initialize().catch(console.error);
}
