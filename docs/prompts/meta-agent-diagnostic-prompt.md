# Meta-Agent Diagnostic & Analysis Prompt

## Purpose
This prompt is designed to systematically analyze functions, features, and code patterns in your codebase to identify candidates for extraction into AI-powered meta agents. These agents can autonomously handle routine operations, monitoring, decision-making, and repetitive tasks while maintaining appropriate human oversight.

---

## Analysis Framework

### Primary Analysis Questions

For each function, feature, or system component, evaluate against these criteria:

#### 1. **Autonomy Potential** (Score: 0-10)
- **Questions:**
  - Can this function operate independently without human intervention?
  - Does it require complex decision-making that could be encoded into rules or learned?
  - How often does it need human input or approval?
  - Could it benefit from autonomous execution with periodic human review?

- **High Score Indicators (8-10):**
  - Operates on fixed schedules or triggers
  - Uses rule-based decision logic
  - Has clear success/failure criteria
  - Performs routine monitoring or data processing
  - Handles repetitive workflows

- **Low Score Indicators (0-3):**
  - Requires creative problem-solving
  - Needs domain expertise for each decision
  - Involves high-stakes business decisions
  - Lacks clear operational parameters

#### 2. **Risk Assessment** (Score: 0-10, lower = lower risk)
- **Questions:**
  - What is the impact if this function makes an incorrect decision?
  - Can errors be easily detected and rolled back?
  - Does it touch production data or critical systems?
  - Are there safeguards in place for failures?

- **Low Risk Indicators (0-3):**
  - Read-only operations
  - Non-critical monitoring/logging
  - Has rollback capabilities
  - Affects development/testing environments
  - Low-impact operations

- **High Risk Indicators (7-10):**
  - Modifies production databases
  - Handles financial transactions
  - Changes security configurations
  - Affects user authentication/authorization
  - Irreversible operations

#### 3. **Frequency & Repetition** (Score: 0-10)
- **Questions:**
  - How often is this function executed?
  - Is it triggered by events, schedules, or user actions?
  - Would automating this save significant human time?
  - Does it follow predictable patterns?

- **High Score Indicators (8-10):**
  - Runs continuously or on fixed intervals
  - Triggered by common events (every API call, log entry, etc.)
  - Part of automated workflows
  - Called hundreds/thousands of times per day

- **Low Score Indicators (0-3):**
  - Rarely executed (few times per month)
  - Requires unique context each time
  - User-initiated ad-hoc operations

#### 4. **Decision Complexity** (Score: 0-10)
- **Questions:**
  - Can decisions be encoded into rules, patterns, or thresholds?
  - Does it use machine learning or pattern matching?
  - Are there clear heuristics or algorithms?
  - Could AI improve decision quality through learning?

- **Suitable for Agents (4-7):**
  - Rule-based decision trees
  - Threshold-based triggers
  - Pattern matching algorithms
  - Statistical analysis with clear criteria
  - ML models with confidence thresholds

- **Too Complex/Simple:**
  - Requires nuanced human judgment (0-2)
  - Trivial boolean logic (9-10 - should remain as simple code)

#### 5. **Observability & Monitoring** (Score: 0-10)
- **Questions:**
  - Can agent actions be logged and audited?
  - Are there metrics/telemetry for agent behavior?
  - Can humans review agent decisions after the fact?
  - Is there a feedback loop for improving agent behavior?

- **High Score Indicators (8-10):**
  - Comprehensive logging infrastructure
  - Metrics/monitoring in place
  - Audit trail capabilities
  - Dashboard/visibility into operations

#### 6. **Integration Readiness** (Score: 0-10)
- **Questions:**
  - Can this function be cleanly extracted into an agent?
  - Does it have well-defined inputs/outputs?
  - Is it loosely coupled from other systems?
  - Could it be deployed as a separate service/module?

- **High Score Indicators (8-10):**
  - Well-defined API boundaries
  - Minimal dependencies
  - Clear interface contracts
  - Stateless or stateful in manageable way
  - Can be containerized/modularized

---

## Specific Pattern Analysis

### Pattern 1: Monitoring & Alerting Functions
**Evaluate functions that:**
- Continuously monitor system health
- Collect metrics and telemetry
- Trigger alerts based on thresholds
- Aggregate and report on system state

**Example Candidates:**
```typescript
// ✅ Good candidate for meta-agent
function checkSystemHealth(): SystemHealth {
  // Monitors metrics, checks thresholds, generates reports
  // Runs on schedule, rule-based decisions
}

// ❌ Better as simple function
function getCurrentTime(): Date {
  // Too trivial for an agent
}
```

### Pattern 2: Automated Decision-Making
**Evaluate functions that:**
- Apply business rules automatically
- Approve/reject based on criteria
- Route requests or tasks
- Classify or categorize data

**Example Candidates:**
```rust
// ✅ Good candidate for meta-agent
async fn auto_approve_ticket(ticket: Ticket) -> ApprovalDecision {
  // Rule-based approval logic
  // Could learn from past approvals
  // Has rollback capabilities
}
```

### Pattern 3: Data Processing & ETL
**Evaluate functions that:**
- Transform data between formats
- Clean and normalize data
- Batch process records
- Synchronize data between systems

**Example Candidates:**
```typescript
// ✅ Good candidate for meta-agent
async function reconcileDataSource(source: DataSource, target: DataSource) {
  // Automated reconciliation workflow
  // Can run continuously
  // Has error handling and retry logic
}
```

### Pattern 4: Automated Remediation
**Evaluate functions that:**
- Fix common issues automatically
- Retry failed operations
- Scale resources up/down
- Clear caches or reset connections

**Example Candidates:**
```typescript
// ✅ Good candidate for meta-agent
async function autoRemediateError(error: SystemError) {
  // Identifies error type
  // Applies appropriate fix
  // Verifies resolution
}
```

### Pattern 5: Pattern Detection & Learning
**Evaluate functions that:**
- Detect anomalies in data
- Identify trends or patterns
- Learn from user behavior
- Optimize based on historical data

**Example Candidates:**
```rust
// ✅ Good candidate for meta-agent
async fn detect_anomalies(data: Vec<Metric>) -> Vec<Anomaly> {
  // ML-based anomaly detection
  // Learns from past anomalies
  // Can adapt thresholds over time
}
```

---

## Human-in-the-Loop (HIL) Integration Points

### Functions Requiring HIL:
- **High-risk operations** that need human approval before execution
- **Ambiguous decisions** where confidence is below threshold
- **Complex problem-solving** that requires domain expertise
- **First-time scenarios** that lack historical precedent

### Functions Suitable for Full Autonomy:
- **Low-risk, high-frequency** operations with clear success criteria
- **Rule-based decisions** with well-defined parameters
- **Monitoring and reporting** (non-destructive operations)
- **Automated remediation** of known issues with rollback plans

---

## Analysis Template

For each candidate function/feature, document:

```markdown
## Function: [Function Name]
**Location:** `[file path]`
**Current Implementation:** [Brief description]

### Scoring
- **Autonomy Potential:** [0-10] - [Reasoning]
- **Risk Assessment:** [0-10] - [Reasoning]
- **Frequency:** [0-10] - [Reasoning]
- **Decision Complexity:** [0-10] - [Reasoning]
- **Observability:** [0-10] - [Reasoning]
- **Integration Readiness:** [0-10] - [Reasoning]

**Overall Meta-Agent Suitability Score:** [Average or weighted score]

### Analysis
**Current Behavior:**
- [What it does now]

**Agent Potential:**
- [What it could do as an agent]
- [Benefits of agentization]

**Required Capabilities:**
- [What the agent needs to do]
- [APIs/services to integrate with]
- [Data sources required]

**Risk Mitigation:**
- [Rollback strategies]
- [Monitoring requirements]
- [HIL approval triggers]

**Implementation Recommendations:**
- [Should this become a meta-agent?]
- [If yes, what type? (monitoring, remediation, decision-making, etc.)]
- [Recommended autonomy level (full/partial/HIL)]
- [Priority for implementation]

### Dependencies & Integration Points
- [Other functions this interacts with]
- [Services/APIs it calls]
- [Data stores it accesses]
```

---

## Execution Instructions

### Step 1: Discovery
1. Search codebase for functions matching patterns above
2. Identify functions with keywords: `monitor`, `check`, `automate`, `detect`, `analyze`, `process`, `reconcile`, `retry`, `remediate`
3. Review service files, utility functions, and background workers
4. Examine event handlers and scheduled tasks

### Step 2: Categorization
Group candidates into categories:
- **Monitoring Agents:** Continuous observation and reporting
- **Remediation Agents:** Automated issue resolution
- **Decision Agents:** Rule-based or ML-based decision-making
- **Processing Agents:** Data transformation and ETL
- **Optimization Agents:** Performance tuning and resource management

### Step 3: Scoring & Prioritization
- Score each candidate using the framework above
- Prioritize by:
  1. **High Frequency + Low Risk + High Autonomy Potential**
  2. **Clear ROI** (time saved × risk level)
  3. **Integration Readiness** (easier to extract = higher priority)

### Step 4: Recommendation Report
Generate a prioritized list with:
- **Immediate Candidates** (score 8-10): Ready for agent extraction
- **High-Potential Candidates** (score 6-7): Requires some refactoring
- **Future Candidates** (score 4-5): Needs architecture changes
- **Not Suitable** (score 0-3): Keep as-is

---

## Example Analysis Output

```markdown
# Meta-Agent Analysis Report
**Date:** [Current Date]
**Codebase:** [Project Name]
**Analyzer:** [AI/User Name]

## Summary
- Total Functions Analyzed: [X]
- Immediate Candidates: [Y]
- High-Potential Candidates: [Z]
- Estimated Time Savings: [Hours/Week]

## Immediate Candidates (Priority 1)

### 1. ContinuousMonitoringSystem.checkSystemHealth()
**Overall Score:** 9.2/10
- Autonomy: 10/10 (fully automated)
- Risk: 1/10 (read-only monitoring)
- Frequency: 10/10 (runs every 30 seconds)
- **Recommendation:** Extract to Monitoring Meta-Agent
- **ROI:** High - Eliminates manual health checks

[Continue with detailed analysis...]
```

---

## Usage Prompt

Copy and paste this into your AI assistant:

```
Analyze the codebase at [PROJECT_PATH] and identify functions, features, 
and system components that are good candidates for extraction into AI-powered 
meta agents. Use the Meta-Agent Diagnostic Framework to:

1. Score each candidate function on:
   - Autonomy Potential (0-10)
   - Risk Assessment (0-10, lower = safer)
   - Frequency & Repetition (0-10)
   - Decision Complexity (0-10)
   - Observability (0-10)
   - Integration Readiness (0-10)

2. Focus on patterns including:
   - Monitoring and alerting functions
   - Automated decision-making logic
   - Data processing and ETL operations
   - Automated remediation functions
   - Pattern detection and learning systems

3. For each candidate, provide:
   - File location and function signature
   - Current behavior description
   - Meta-agent suitability score
   - Recommended agent type (monitoring/remediation/decision/processing/optimization)
   - Required capabilities and integration points
   - Risk mitigation strategies
   - HIL approval requirements (if any)

4. Generate a prioritized recommendation report with:
   - Immediate candidates (score 8-10)
   - High-potential candidates (score 6-7)
   - Future candidates (score 4-5)
   - Functions to keep as-is (score 0-3)

5. Include estimated time savings and ROI for top candidates.

Provide the analysis in the format specified in the template above.
```

---

## Notes

- This framework is designed to be used with AI code analysis tools
- Adjust scoring weights based on your specific priorities
- Consider organizational constraints (approval processes, security policies)
- Review recommendations with stakeholders before implementation
- Start with low-risk, high-frequency candidates to build confidence

