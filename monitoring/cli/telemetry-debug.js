#!/usr/bin/env node

/**
 * Telemetry Debug CLI
 * A unified tool for developers to debug and inspect telemetry data
 * from the Reconciliation Platform monitoring stack.
 * 
 * Usage:
 *   node telemetry-debug.js [command] [options]
 * 
 * Commands:
 *   logs      - Query and tail logs from Elasticsearch
 *   metrics   - Query metrics from Prometheus
 *   traces    - Query traces from Jaeger
 *   health    - Check health of all monitoring services
 *   alerts    - List active alerts from Alertmanager
 */

const http = require('http');

// Configuration - can be overridden via environment variables
const config = {
  elasticsearch: {
    host: process.env.ELASTICSEARCH_HOST || 'localhost',
    port: parseInt(process.env.ELASTICSEARCH_PORT) || 9200
  },
  prometheus: {
    host: process.env.PROMETHEUS_HOST || 'localhost',
    port: parseInt(process.env.PROMETHEUS_PORT) || 9090
  },
  jaeger: {
    host: process.env.JAEGER_HOST || 'localhost',
    port: parseInt(process.env.JAEGER_PORT) || 16686
  },
  alertmanager: {
    host: process.env.ALERTMANAGER_HOST || 'localhost',
    port: parseInt(process.env.ALERTMANAGER_PORT) || 9093
  },
  kibana: {
    host: process.env.KIBANA_HOST || 'localhost',
    port: parseInt(process.env.KIBANA_PORT) || 5601
  }
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Make HTTP request to a service
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - Response data
 */
function httpRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * Check health of all monitoring services
 */
async function checkHealth() {
  console.log(`${colors.cyan}=== Monitoring Stack Health Check ===${colors.reset}\n`);

  const services = [
    {
      name: 'Elasticsearch',
      host: config.elasticsearch.host,
      port: config.elasticsearch.port,
      path: '/_cluster/health'
    },
    {
      name: 'Prometheus',
      host: config.prometheus.host,
      port: config.prometheus.port,
      path: '/-/healthy'
    },
    {
      name: 'Kibana',
      host: config.kibana.host,
      port: config.kibana.port,
      path: '/api/status'
    },
    {
      name: 'Alertmanager',
      host: config.alertmanager.host,
      port: config.alertmanager.port,
      path: '/-/healthy'
    },
    {
      name: 'Jaeger',
      host: config.jaeger.host,
      port: config.jaeger.port,
      path: '/'
    }
  ];

  for (const service of services) {
    try {
      const result = await httpRequest({
        hostname: service.host,
        port: service.port,
        path: service.path,
        method: 'GET'
      });
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`${colors.green}✓${colors.reset} ${service.name}: ${colors.green}Healthy${colors.reset}`);
      } else {
        console.log(`${colors.yellow}!${colors.reset} ${service.name}: ${colors.yellow}Degraded${colors.reset} (status: ${result.status})`);
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${service.name}: ${colors.red}Unreachable${colors.reset} (${error.message})`);
    }
  }
}

/**
 * Query logs from Elasticsearch
 * @param {Object} options - Query options
 */
async function queryLogs(options = {}) {
  const { 
    level = '', 
    service = '', 
    timeRange = '15m',
    limit = 50,
    follow = false 
  } = options;

  console.log(`${colors.cyan}=== Log Query ===${colors.reset}`);
  console.log(`Time range: last ${timeRange} | Limit: ${limit}`);
  if (level) console.log(`Filter: level=${level}`);
  if (service) console.log(`Filter: service=${service}`);
  console.log('');

  const query = {
    size: limit,
    sort: [{ "@timestamp": { order: "desc" } }],
    query: {
      bool: {
        must: []
      }
    }
  };

  // Add time range filter
  query.query.bool.must.push({
    range: {
      "@timestamp": {
        gte: `now-${timeRange}`,
        lte: "now"
      }
    }
  });

  // Add level filter
  if (level) {
    query.query.bool.must.push({
      match: { level: level }
    });
  }

  // Add service filter
  if (service) {
    query.query.bool.must.push({
      match: { service: service }
    });
  }

  try {
    const result = await httpRequest({
      hostname: config.elasticsearch.host,
      port: config.elasticsearch.port,
      path: '/reconciliation-logs-*/_search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: query
    });

    if (result.data.hits && result.data.hits.hits) {
      const hits = result.data.hits.hits.reverse();
      
      for (const hit of hits) {
        const source = hit._source;
        const timestamp = source['@timestamp'] || '';
        const logLevel = source.level || 'info';
        const logService = source.service || 'unknown';
        const message = source.log_message || source.message || '';

        const levelColor = {
          error: colors.red,
          warn: colors.yellow,
          warning: colors.yellow,
          info: colors.green,
          debug: colors.cyan
        }[logLevel.toLowerCase()] || colors.white;

        console.log(
          `${colors.blue}${timestamp}${colors.reset} ` +
          `${levelColor}[${logLevel.toUpperCase()}]${colors.reset} ` +
          `${colors.magenta}${logService}${colors.reset}: ` +
          `${message}`
        );
      }

      console.log(`\n${colors.cyan}Total: ${result.data.hits.total.value} logs found${colors.reset}`);
    } else {
      console.log(`${colors.yellow}No logs found${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error querying logs: ${error.message}${colors.reset}`);
  }
}

/**
 * Query metrics from Prometheus
 * @param {Object} options - Query options
 */
async function queryMetrics(options = {}) {
  const { query = '', instant = true, timeRange = '1h', step = '1m' } = options;

  console.log(`${colors.cyan}=== Metrics Query ===${colors.reset}`);
  
  // If no specific query, show overview metrics
  const queries = query ? [{ name: 'Custom Query', expr: query }] : [
    { name: 'HTTP Request Rate', expr: 'rate(http_requests_total[5m])' },
    { name: 'API Latency (P95)', expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))' },
    { name: 'Error Rate', expr: 'rate(http_requests_total{status_code=~"5.."}[5m])' },
    { name: 'Database Connections', expr: 'database_connections_active' },
    { name: 'Cache Hit Rate', expr: 'cache_hits_total / (cache_hits_total + cache_misses_total)' },
    { name: 'Memory Usage', expr: 'system_memory_usage_percent' },
    { name: 'CPU Usage', expr: 'system_cpu_usage_percent' }
  ];

  for (const q of queries) {
    try {
      const path = instant 
        ? `/api/v1/query?query=${encodeURIComponent(q.expr)}`
        : `/api/v1/query_range?query=${encodeURIComponent(q.expr)}&start=${Date.now()/1000 - parseTimeRange(timeRange)}&end=${Date.now()/1000}&step=${step}`;

      const result = await httpRequest({
        hostname: config.prometheus.host,
        port: config.prometheus.port,
        path: path,
        method: 'GET'
      });

      if (result.data.status === 'success' && result.data.data.result.length > 0) {
        console.log(`\n${colors.green}${q.name}:${colors.reset}`);
        for (const r of result.data.data.result) {
          const labels = Object.entries(r.metric || {})
            .filter(([k]) => k !== '__name__')
            .map(([k, v]) => `${k}="${v}"`)
            .join(', ');
          const value = Array.isArray(r.value) ? r.value[1] : r.values?.slice(-1)[0]?.[1] || 'N/A';
          console.log(`  ${labels ? `{${labels}}` : ''} => ${value}`);
        }
      } else {
        console.log(`\n${colors.yellow}${q.name}: No data${colors.reset}`);
      }
    } catch (error) {
      console.log(`\n${colors.red}${q.name}: Error - ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Query traces from Jaeger
 * @param {Object} options - Query options
 */
async function queryTraces(options = {}) {
  const { service = 'reconciliation-backend', limit = 20, minDuration = '' } = options;

  console.log(`${colors.cyan}=== Trace Query ===${colors.reset}`);
  console.log(`Service: ${service} | Limit: ${limit}`);
  if (minDuration) console.log(`Min duration: ${minDuration}`);
  console.log('');

  try {
    let path = `/api/traces?service=${encodeURIComponent(service)}&limit=${limit}`;
    if (minDuration) {
      path += `&minDuration=${encodeURIComponent(minDuration)}`;
    }

    const result = await httpRequest({
      hostname: config.jaeger.host,
      port: config.jaeger.port,
      path: path,
      method: 'GET'
    });

    if (result.data.data && result.data.data.length > 0) {
      for (const trace of result.data.data) {
        const rootSpan = trace.spans.find(s => !s.references || s.references.length === 0) || trace.spans[0];
        const duration = (rootSpan.duration / 1000).toFixed(2);
        const startTime = new Date(rootSpan.startTime / 1000).toISOString();
        const operationName = rootSpan.operationName;
        const spanCount = trace.spans.length;

        const durationColor = duration > 500 ? colors.red : duration > 100 ? colors.yellow : colors.green;

        console.log(
          `${colors.blue}${startTime}${colors.reset} ` +
          `${colors.magenta}${operationName}${colors.reset} ` +
          `${durationColor}${duration}ms${colors.reset} ` +
          `(${spanCount} spans) ` +
          `${colors.cyan}[${trace.traceID.substring(0, 8)}...]${colors.reset}`
        );
      }
    } else {
      console.log(`${colors.yellow}No traces found${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error querying traces: ${error.message}${colors.reset}`);
  }
}

/**
 * List active alerts from Alertmanager
 */
async function listAlerts() {
  console.log(`${colors.cyan}=== Active Alerts ===${colors.reset}\n`);

  try {
    const result = await httpRequest({
      hostname: config.alertmanager.host,
      port: config.alertmanager.port,
      path: '/api/v2/alerts',
      method: 'GET'
    });

    if (Array.isArray(result.data) && result.data.length > 0) {
      for (const alert of result.data) {
        const severity = alert.labels?.severity || 'unknown';
        const alertname = alert.labels?.alertname || 'Unknown';
        const summary = alert.annotations?.summary || 'No summary';
        const startsAt = alert.startsAt ? new Date(alert.startsAt).toISOString() : '';

        const severityColor = {
          critical: colors.red,
          warning: colors.yellow,
          info: colors.blue
        }[severity] || colors.white;

        console.log(
          `${severityColor}[${severity.toUpperCase()}]${colors.reset} ` +
          `${colors.magenta}${alertname}${colors.reset}`
        );
        console.log(`  Summary: ${summary}`);
        console.log(`  Started: ${startsAt}`);
        console.log('');
      }

      console.log(`${colors.cyan}Total: ${result.data.length} active alerts${colors.reset}`);
    } else {
      console.log(`${colors.green}No active alerts${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error fetching alerts: ${error.message}${colors.reset}`);
  }
}

/**
 * Parse time range string to seconds
 * @param {string} range - Time range (e.g., '1h', '15m', '1d')
 * @returns {number} - Seconds
 */
function parseTimeRange(range) {
  const match = range.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // Default 1 hour
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 3600);
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
${colors.cyan}Telemetry Debug CLI${colors.reset}
A unified tool for debugging the Reconciliation Platform monitoring stack.

${colors.yellow}Usage:${colors.reset}
  node telemetry-debug.js <command> [options]

${colors.yellow}Commands:${colors.reset}
  health                Check health of all monitoring services
  logs [options]        Query logs from Elasticsearch
  metrics [options]     Query metrics from Prometheus
  traces [options]      Query traces from Jaeger
  alerts                List active alerts from Alertmanager

${colors.yellow}Log Options:${colors.reset}
  --level <level>       Filter by log level (error, warn, info, debug)
  --service <name>      Filter by service name
  --time <range>        Time range (e.g., 15m, 1h, 1d). Default: 15m
  --limit <n>           Number of logs to fetch. Default: 50
  --follow              Continuously tail logs (not implemented yet)

${colors.yellow}Metric Options:${colors.reset}
  --query <expr>        Custom PromQL query
  --range               Query range instead of instant
  --time <range>        Time range for range queries. Default: 1h
  --step <interval>     Step interval for range queries. Default: 1m

${colors.yellow}Trace Options:${colors.reset}
  --service <name>      Service name. Default: reconciliation-backend
  --limit <n>           Number of traces to fetch. Default: 20
  --min-duration <ms>   Minimum trace duration filter

${colors.yellow}Environment Variables:${colors.reset}
  ELASTICSEARCH_HOST, ELASTICSEARCH_PORT
  PROMETHEUS_HOST, PROMETHEUS_PORT
  JAEGER_HOST, JAEGER_PORT
  ALERTMANAGER_HOST, ALERTMANAGER_PORT
  KIBANA_HOST, KIBANA_PORT

${colors.yellow}Examples:${colors.reset}
  node telemetry-debug.js health
  node telemetry-debug.js logs --level error --time 1h
  node telemetry-debug.js metrics --query 'rate(http_requests_total[5m])'
  node telemetry-debug.js traces --min-duration 100ms
  node telemetry-debug.js alerts
`);
}

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} - Parsed options
 */
function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      options[key] = value;
    }
  }
  return options;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = parseArgs(args.slice(1));

  switch (command) {
    case 'health':
      await checkHealth();
      break;
    case 'logs':
      await queryLogs(options);
      break;
    case 'metrics':
      await queryMetrics(options);
      break;
    case 'traces':
      await queryTraces(options);
      break;
    case 'alerts':
      await listAlerts();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      printUsage();
  }
}

main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
