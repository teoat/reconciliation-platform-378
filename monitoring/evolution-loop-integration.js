// ============================================================================
// AUTONOMOUS EVOLUTION LOOP INTEGRATION - Protocol 3
// ============================================================================

import { continuousMonitoring } from './continuous-monitoring.js';
import { hilApproval } from './hil-approval.js';
import { bugDetection } from './bug-detection.js';

class AutonomousEvolutionLoop {
  constructor() {
    this.systems = new Map();
    this.isActive = false;
  }

  // Initialize the complete autonomous evolution loop
  async initialize() {
    console.log('🚀 Initializing Autonomous Evolution Loop (Protocol 3)...');

    try {
      // Initialize individual systems
      await this.initializeContinuousMonitoring();
      await this.initializeBugDetection();
      await this.initializeHILApproval();

      // Connect systems
      this.connectSystems();

      this.isActive = true;
      console.log('✅ Autonomous Evolution Loop activated - All systems operational');

      // Start integrated monitoring
      this.startIntegratedMonitoring();
    } catch (error) {
      console.error('❌ Failed to initialize Autonomous Evolution Loop:', error);
      throw error;
    }
  }

  // Initialize continuous monitoring system
  async initializeContinuousMonitoring() {
    console.log('📊 Initializing Continuous Monitoring...');
    await continuousMonitoring.initialize();
    this.systems.set('continuousMonitoring', continuousMonitoring);
    console.log('✅ Continuous Monitoring initialized');
  }

  // Initialize bug detection system
  async initializeBugDetection() {
    console.log('🐛 Initializing Bug Detection...');
    await bugDetection.initialize();
    this.systems.set('bugDetection', bugDetection);
    console.log('✅ Bug Detection initialized');
  }

  // Initialize HIL approval system
  async initializeHILApproval() {
    console.log('🤖 Initializing HIL Approval System...');
    await hilApproval.initialize();
    this.systems.set('hilApproval', hilApproval);
    console.log('✅ HIL Approval System initialized');
  }

  // Connect systems together
  connectSystems() {
    console.log('🔗 Connecting systems...');

    // Connect continuous monitoring to HIL approval
    continuousMonitoring.setHILApprovalSystem(hilApproval);

    // Connect bug detection to continuous monitoring (for additional alerts)
    // This could be extended to feed bug reports into evolution tickets

    console.log('✅ Systems connected');
  }

  // Start integrated monitoring loop
  startIntegratedMonitoring() {
    console.log('🔄 Starting integrated monitoring...');

    // Periodic health check of all systems
    setInterval(() => {
      if (!this.isActive) return;

      this.performSystemHealthCheck();
      this.optimizeSystemPerformance();
    }, 300000); // Every 5 minutes

    // Cross-system correlation analysis
    setInterval(() => {
      if (!this.isActive) return;

      this.performCrossSystemAnalysis();
    }, 600000); // Every 10 minutes
  }

  // Perform health check on all systems
  performSystemHealthCheck() {
    console.log('🏥 Performing system health check...');

    const healthStatus = {
      timestamp: new Date().toISOString(),
      systems: {},
      overall: 'healthy',
    };

    for (const [systemName, system] of this.systems) {
      try {
        const status = system.getSystemStatus
          ? system.getSystemStatus()
          : { isActive: system.isActive };
        healthStatus.systems[systemName] = {
          active: status.isActive,
          status: 'healthy',
          metrics: status,
        };

        if (!status.isActive) {
          healthStatus.systems[systemName].status = 'inactive';
          healthStatus.overall = 'degraded';
        }
      } catch (error) {
        healthStatus.systems[systemName] = {
          active: false,
          status: 'error',
          error: error.message,
        };
        healthStatus.overall = 'unhealthy';
      }
    }

    if (healthStatus.overall !== 'healthy') {
      console.warn('⚠️ System health issues detected:', healthStatus);
      this.handleHealthIssues(healthStatus);
    } else {
      console.log('✅ All systems healthy');
    }

    this.lastHealthCheck = healthStatus;
  }

  // Handle health issues
  handleHealthIssues(healthStatus) {
    for (const [systemName, systemStatus] of Object.entries(healthStatus.systems)) {
      if (systemStatus.status === 'inactive') {
        console.log(`🔄 Attempting to restart ${systemName}...`);
        this.restartSystem(systemName);
      } else if (systemStatus.status === 'error') {
        console.log(`🚨 Critical error in ${systemName}, generating evolution ticket...`);
        this.generateSystemHealthTicket(systemName, systemStatus);
      }
    }
  }

  // Restart a system
  async restartSystem(systemName) {
    try {
      const system = this.systems.get(systemName);
      if (system && system.stop) {
        system.stop();
      }

      // Wait a moment
      await this.delay(1000);

      // Restart based on system type
      switch (systemName) {
        case 'continuousMonitoring':
          await continuousMonitoring.initialize();
          break;
        case 'bugDetection':
          await bugDetection.initialize();
          break;
        case 'hilApproval':
          await hilApproval.initialize();
          break;
      }

      console.log(`✅ Successfully restarted ${systemName}`);
    } catch (error) {
      console.error(`❌ Failed to restart ${systemName}:`, error);
    }
  }

  // Generate system health evolution ticket
  generateSystemHealthTicket(systemName, systemStatus) {
    const ticket = {
      id: `SYS_HEALTH_${Date.now()}`,
      type: 'SYSTEM_HEALTH',
      title: `System Health Issue: ${systemName}`,
      description: `Critical system health issue detected in ${systemName}.

**Issue Details:**
- System: ${systemName}
- Status: ${systemStatus.status}
- Error: ${systemStatus.error || 'Unknown error'}

**Recommended Actions:**
1. Immediate system restart
2. Health check verification
3. Log analysis for root cause
4. Potential system reconfiguration

**Priority:** Critical
**Estimated Impact:** High`,
      status: 'PENDING_HIL_APPROVAL',
      created: new Date().toISOString(),
      systemName,
      systemStatus,
    };

    // Submit to HIL approval
    if (hilApproval && hilApproval.submitTicket) {
      hilApproval.submitTicket(ticket).catch(console.error);
    }
  }

  // Optimize system performance
  optimizeSystemPerformance() {
    console.log('⚡ Optimizing system performance...');

    // Analyze system metrics and suggest optimizations
    const optimizations = this.analyzeSystemOptimizations();

    if (optimizations.length > 0) {
      console.log(`📈 Found ${optimizations.length} optimization opportunities`);
      this.applySystemOptimizations(optimizations);
    }
  }

  // Analyze system optimizations
  analyzeSystemOptimizations() {
    const optimizations = [];

    // Check continuous monitoring metrics
    const monitoringStatus = continuousMonitoring.getSystemStatus();
    if (monitoringStatus.activeAlerts.length > 10) {
      optimizations.push({
        type: 'alert_threshold_optimization',
        description: 'High alert volume detected, consider adjusting thresholds',
        system: 'continuousMonitoring',
      });
    }

    // Check HIL approval queue
    const approvalStatus = hilApproval.getSystemStatus();
    if (approvalStatus.queueLength > 5) {
      optimizations.push({
        type: 'approval_queue_optimization',
        description: 'Long approval queue detected, consider auto-approval rules',
        system: 'hilApproval',
      });
    }

    return optimizations;
  }

  // Apply system optimizations
  applySystemOptimizations(optimizations) {
    for (const optimization of optimizations) {
      console.log(`🔧 Applying optimization: ${optimization.description}`);

      // Generate evolution ticket for optimization
      const ticket = {
        id: `SYS_OPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'SYSTEM_OPTIMIZATION',
        title: `System Optimization: ${optimization.type}`,
        description: `Automated system optimization opportunity identified.

**Optimization Details:**
${optimization.description}

**System:** ${optimization.system}
**Type:** ${optimization.type}

**Recommended Actions:**
1. Review current system configuration
2. Apply suggested optimization
3. Monitor impact
4. Adjust as needed

**Priority:** Medium
**Risk Level:** Low`,
        status: 'PENDING_HIL_APPROVAL',
        created: new Date().toISOString(),
        optimization,
      };

      // Submit for approval
      if (hilApproval && hilApproval.submitTicket) {
        hilApproval.submitTicket(ticket).catch(console.error);
      }
    }
  }

  // Perform cross-system analysis
  performCrossSystemAnalysis() {
    console.log('🔍 Performing cross-system correlation analysis...');

    const monitoringStatus = continuousMonitoring.getSystemStatus();
    const approvalStatus = hilApproval.getSystemStatus();

    // Analyze correlations between monitoring alerts and approval decisions
    const correlations = this.analyzeCorrelations(monitoringStatus, approvalStatus);

    if (correlations.length > 0) {
      console.log(`📊 Found ${correlations.length} system correlations`);
      this.processCorrelations(correlations);
    }
  }

  // Analyze correlations between systems
  analyzeCorrelations(monitoringStatus, approvalStatus) {
    const correlations = [];

    // Correlation 1: High rejection rate for certain monitor types
    const rejectedTickets = approvalStatus.rejectedTickets || [];
    const monitorRejections = {};

    for (const ticket of rejectedTickets) {
      if (ticket.issue && ticket.issue.monitor) {
        monitorRejections[ticket.issue.monitor] =
          (monitorRejections[ticket.issue.monitor] || 0) + 1;
      }
    }

    for (const [monitor, count] of Object.entries(monitorRejections)) {
      if (count > 3) {
        correlations.push({
          type: 'high_rejection_rate',
          monitor,
          rejectionCount: count,
          insight: `${monitor} monitor has high rejection rate, consider adjusting alert thresholds or ticket generation criteria`,
        });
      }
    }

    // Correlation 2: Auto-approval success rate
    const approvedTickets = approvalStatus.approvedTickets || [];
    const autoApproved = approvedTickets.filter((t) =>
      t.approvalDecision?.approver?.includes('automation')
    );
    const autoApprovalRate =
      approvedTickets.length > 0 ? autoApproved.length / approvedTickets.length : 0;

    if (autoApprovalRate > 0.8) {
      correlations.push({
        type: 'high_auto_approval_rate',
        rate: autoApprovalRate,
        insight:
          'High auto-approval rate suggests rules may be too permissive, consider tightening criteria',
      });
    } else if (autoApprovalRate < 0.3) {
      correlations.push({
        type: 'low_auto_approval_rate',
        rate: autoApprovalRate,
        insight:
          'Low auto-approval rate suggests rules may be too restrictive, consider expanding auto-approval criteria',
      });
    }

    return correlations;
  }

  // Process correlations
  processCorrelations(correlations) {
    for (const correlation of correlations) {
      console.log(`💡 Correlation insight: ${correlation.insight}`);

      // Generate evolution ticket for correlation-based optimization
      const ticket = {
        id: `CORRELATION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'SYSTEM_CORRELATION',
        title: `System Correlation: ${correlation.type}`,
        description: `Cross-system analysis revealed correlation requiring attention.

**Correlation Details:**
${correlation.insight}

**Type:** ${correlation.type}
**Data:** ${JSON.stringify(correlation, null, 2)}

**Recommended Actions:**
1. Review system configuration
2. Adjust monitoring or approval parameters
3. Implement correlation-based optimizations
4. Monitor impact of changes

**Priority:** Medium
**Risk Level:** Low`,
        status: 'PENDING_HIL_APPROVAL',
        created: new Date().toISOString(),
        correlation,
      };

      // Submit for approval
      if (hilApproval && hilApproval.submitTicket) {
        hilApproval.submitTicket(ticket).catch(console.error);
      }
    }
  }

  // Get overall system status
  getSystemStatus() {
    return {
      isActive: this.isActive,
      systems: Object.fromEntries(
        Array.from(this.systems.entries()).map(([name, system]) => [
          name,
          system.getSystemStatus ? system.getSystemStatus() : { isActive: system.isActive },
        ])
      ),
      lastHealthCheck: this.lastHealthCheck,
      timestamp: new Date().toISOString(),
    };
  }

  // Utility delay function
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Stop the evolution loop
  stop() {
    console.log('⏹️ Stopping Autonomous Evolution Loop...');

    this.isActive = false;

    // Stop all systems
    for (const system of this.systems.values()) {
      if (system.stop) {
        system.stop();
      }
    }

    console.log('✅ Autonomous Evolution Loop stopped');
  }
}

// Export singleton instance
export const autonomousEvolutionLoop = new AutonomousEvolutionLoop();

// Auto-initialize if running in Node.js environment
if (typeof window === 'undefined') {
  autonomousEvolutionLoop.initialize().catch(console.error);
}
