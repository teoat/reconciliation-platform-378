/**
 * MCP Integration Service for Frenly AI Meta Agent
 * 
 * Provides integration layer between Frenly AI and MCP server tools
 * Enables Frenly to use MCP tools for intelligent assistance
 */

import { logger } from './logger';

interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}

interface ToolUsageStats {
  tool: string;
  count: number;
  avgTime: number;
  successRate: number;
}

interface PerformanceSummary {
  toolUsage: {
    totalTools: number;
    totalCalls: number;
    mostUsed: ToolUsageStats[];
    slowest: ToolUsageStats[];
    errorProne: ToolUsageStats[];
  };
  systemHealth: {
    cpu: { load: number; cores: number };
    memory: { usagePercent: string; total: number; used: number };
  };
  backendHealth: { status: string; timestamp: string } | null;
  recommendations: string[];
  timestamp: string;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

class MCPIntegrationService {
  private mcpServerUrl: string;
  private isAvailable: boolean = false;
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'closed',
  };
  private readonly maxFailures = 5;
  private readonly circuitOpenDuration = 60000; // 1 minute
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second
  private apiKey: string | null = null;

  constructor() {
    // MCP HTTP bridge service URL
    this.mcpServerUrl = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3001';
    this.apiKey = import.meta.env.VITE_MCP_BRIDGE_API_KEY || null;
    this.checkAvailability();
  }

  /**
   * Check circuit breaker state
   */
  private checkCircuitBreaker(): boolean {
    const now = Date.now();
    
    if (this.circuitBreaker.state === 'open') {
      if (now - this.circuitBreaker.lastFailureTime > this.circuitOpenDuration) {
        // Try half-open state
        this.circuitBreaker.state = 'half-open';
        return true;
      }
      return false; // Circuit is open
    }
    
    return true; // Circuit is closed or half-open
  }

  /**
   * Record success (reset circuit breaker)
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.state = 'closed';
    }
    this.circuitBreaker.failures = 0;
  }

  /**
   * Record failure (update circuit breaker)
   */
  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failures >= this.maxFailures) {
      this.circuitBreaker.state = 'open';
      logger.warn('Circuit breaker opened due to repeated failures', {
        failures: this.circuitBreaker.failures,
      });
    }
  }

  /**
   * Retry with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        const delay = this.retryDelay * Math.pow(2, i);
        logger.debug(`Retry attempt ${i + 1}/${retries} after ${delay}ms`, { error });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Check if MCP server is available
   */
  private async checkAvailability(): Promise<void> {
    if (!this.checkCircuitBreaker()) {
      this.isAvailable = false;
      return;
    }

    try {
      const response = await fetch(`${this.mcpServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5s timeout
      });
      this.isAvailable = response.ok;
      this.recordSuccess();
    } catch (error) {
      logger.warn('MCP server not available', { error });
      this.isAvailable = false;
      this.recordFailure();
    }
  }

  /**
   * Call MCP tool via HTTP bridge with retry and circuit breaker
   */
  private async callMCPTool(toolName: string, args: Record<string, unknown> = {}): Promise<MCPToolResult> {
    if (!this.checkCircuitBreaker()) {
      throw new Error('Circuit breaker is open. Service temporarily unavailable.');
    }

    return this.retryWithBackoff(async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (this.apiKey) {
          headers['X-API-Key'] = this.apiKey;
        }

        const response = await fetch(`${this.mcpServerUrl}/tools/${toolName}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ args }),
          signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        this.recordSuccess();
        
        return {
          success: result.success,
          data: result.data,
          error: result.error,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        this.recordFailure();
        logger.error(`Failed to call MCP tool: ${toolName}`, { error, args });
        throw error;
      }
    });
  }

  /**
   * Get tool usage statistics for Frenly AI insights
   */
  async getToolUsageStats(tool?: string): Promise<ToolUsageStats | ToolUsageStats[]> {
    try {
      logger.info('Getting tool usage stats', { tool });
      
      const result = await this.callMCPTool('get_tool_usage_stats', tool ? { tool } : {});
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get tool usage stats');
      }

      // Handle response format from MCP server
      const data = result.data as any;
      
      if (tool) {
        // Single tool stats
        return {
          tool: data.name || tool,
          count: data.count || 0,
          avgTime: data.avgTime || 0,
          successRate: data.successRate || 100,
        };
      } else {
        // All tools stats
        if (data.tools && Array.isArray(data.tools)) {
          return data.tools.map((t: any) => ({
            tool: t.name,
            count: t.count || 0,
            avgTime: t.avgTime || 0,
            successRate: t.successRate || 100,
          }));
        }
        return [];
      }
    } catch (error) {
      logger.error('Failed to get tool usage stats', { error });
      // Return empty data instead of throwing to allow graceful degradation
      return tool ? {
        tool,
        count: 0,
        avgTime: 0,
        successRate: 100,
      } : [];
    }
  }

  /**
   * Get performance summary for Frenly AI recommendations
   */
  async getPerformanceSummary(): Promise<PerformanceSummary> {
    try {
      logger.info('Getting performance summary');
      
      const result = await this.callMCPTool('get_performance_summary', {});
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get performance summary');
      }

      const data = result.data as any;
      
      // Transform MCP response to expected format
      return {
        toolUsage: {
          totalTools: data.toolUsage?.totalTools || 0,
          totalCalls: data.toolUsage?.totalCalls || 0,
          mostUsed: (data.toolUsage?.mostUsed || []).map((t: any) => ({
            tool: t.name || t.tool,
            count: t.count || 0,
            avgTime: t.avgTime || 0,
            successRate: t.successRate || 100,
          })),
          slowest: (data.toolUsage?.slowest || []).map((t: any) => ({
            tool: t.name || t.tool,
            count: t.count || 0,
            avgTime: t.avgTime || 0,
            successRate: t.successRate || 100,
          })),
          errorProne: (data.toolUsage?.errorProne || []).map((t: any) => ({
            tool: t.name || t.tool,
            count: t.count || 0,
            avgTime: t.avgTime || 0,
            successRate: t.successRate || 100,
          })),
        },
        systemHealth: {
          cpu: {
            load: data.systemHealth?.cpu?.load || 0,
            cores: data.systemHealth?.cpu?.cores || 0,
          },
          memory: {
            usagePercent: data.systemHealth?.memory?.usagePercent || '0',
            total: data.systemHealth?.memory?.total || 0,
            used: data.systemHealth?.memory?.used || 0,
          },
        },
        backendHealth: data.backendHealth || null,
        recommendations: data.recommendations || [],
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get performance summary', { error });
      // Return default structure for graceful degradation
      return {
        toolUsage: {
          totalTools: 0,
          totalCalls: 0,
          mostUsed: [],
          slowest: [],
          errorProne: [],
        },
        systemHealth: {
          cpu: { load: 0, cores: 0 },
          memory: { usagePercent: '0', total: 0, used: 0 },
        },
        backendHealth: null,
        recommendations: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Run security audit and provide insights to Frenly
   */
  async runSecurityAudit(scope: 'frontend' | 'backend' | 'all' = 'all'): Promise<{
    scope: string;
    results: Record<string, unknown>;
    timestamp: string;
  }> {
    try {
      logger.info('Running security audit', { scope });
      
      const result = await this.callMCPTool('run_security_audit', { scope });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to run security audit');
      }

      const data = result.data as any;
      return {
        scope: data.scope || scope,
        results: data.results || {},
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to run security audit', { error });
      // Return empty results for graceful degradation
      return {
        scope,
        results: {},
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get system metrics for Frenly AI context
   */
  async getSystemMetrics(includeProcesses = false): Promise<{
    cpu: { currentLoad: number; avgLoad: number; cores: number };
    memory: { total: number; used: number; free: number; usagePercent: string };
    disk: Array<{
      fs: string;
      size: number;
      used: number;
      available: number;
      usagePercent: string;
    }>;
    processes?: {
      total: number;
      running: number;
      sleeping: number;
      topCpu: Array<{ pid: number; name: string; cpu: number }>;
    };
    timestamp: string;
  }> {
    try {
      logger.info('Getting system metrics', { includeProcesses });
      
      const result = await this.callMCPTool('get_system_metrics', { includeProcesses });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to get system metrics');
      }

      const data = result.data as any;
      return {
        cpu: {
          currentLoad: data.cpu?.currentLoad || 0,
          avgLoad: data.cpu?.avgLoad || 0,
          cores: data.cpu?.cores || 0,
        },
        memory: {
          total: data.memory?.total || 0,
          used: data.memory?.used || 0,
          free: data.memory?.free || 0,
          usagePercent: data.memory?.usagePercent || '0',
        },
        disk: data.disk || [],
        processes: data.processes,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get system metrics', { error });
      // Return default structure for graceful degradation
      return {
        cpu: { currentLoad: 0, avgLoad: 0, cores: 0 },
        memory: { total: 0, used: 0, free: 0, usagePercent: '0' },
        disk: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check backend health for Frenly AI context
   */
  async checkBackendHealth(): Promise<{
    status: string;
    data?: unknown;
    statusCode?: number;
    timestamp: string;
  }> {
    try {
      logger.info('Checking backend health');
      
      const result = await this.callMCPTool('backend_health_check', {});
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to check backend health');
      }

      const data = result.data as any;
      return {
        status: data.status || 'unknown',
        data: data.data,
        statusCode: data.statusCode,
        timestamp: data.timestamp || new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to check backend health', { error });
      // Return unknown status for graceful degradation
      return {
        status: 'unknown',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate Frenly AI message based on MCP insights
   */
  async generateInsightMessage(): Promise<string> {
    try {
      const summary = await this.getPerformanceSummary();
      
      if (summary.recommendations.length > 0) {
        return `I've detected some performance issues: ${summary.recommendations.join('. ')}. Would you like me to help optimize these?`;
      }
      
      if (summary.toolUsage.totalCalls > 100) {
        return `Great! You've been very active with ${summary.toolUsage.totalCalls} tool calls. Everything looks healthy!`;
      }
      
      return 'System is running smoothly. Let me know if you need any assistance!';
    } catch (error) {
      logger.error('Failed to generate insight message', { error });
      return 'I\'m having trouble checking system status. Please try again later.';
    }
  }

  /**
   * Check if MCP integration is available
   */
  isMCPAvailable(): boolean {
    return this.isAvailable;
  }
}

// Export singleton instance
export const mcpIntegrationService = new MCPIntegrationService();

