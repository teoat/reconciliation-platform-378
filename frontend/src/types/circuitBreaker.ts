export interface CircuitBreakerMetrics {
  service: 'database' | 'cache' | 'api';
  state: 'Closed' | 'Open' | 'HalfOpen';
  failures: number;
  successes: number;
  total_requests: number;
  success_rate: number;
}

export interface ResilienceStatus {
  database: CircuitBreakerMetrics;
  cache: CircuitBreakerMetrics;
  api: CircuitBreakerMetrics;
}

