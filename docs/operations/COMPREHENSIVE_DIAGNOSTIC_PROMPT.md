# Comprehensive Deep Diagnostic & Analysis Prompt (V1)

**Purpose**: Run a complete, multi-layered diagnostic of the entire codebase, investigate all findings, and provide comprehensive analysis and actionable recommendations.

**Last Updated**: 2025-01-16  
**Status**: Superseded by V2

> **Note**: This is the original V1 prompt. For the complete combined version with automated remediation, historical tracking, and predictive analysis, see [COMPREHENSIVE_DIAGNOSTIC_PROMPT_V2.md](./COMPREHENSIVE_DIAGNOSTIC_PROMPT_V2.md)

---

## Prompt Instructions

Execute the following comprehensive diagnostic workflow:

### Phase 1: Initial Comprehensive Diagnostics

1. **Run System-Wide Diagnostics**
   - Execute `scripts/comprehensive-diagnostic.sh` to get baseline scores
   - Run all 15 individual diagnostic scripts from `scripts/diagnostics/`
   - Use MCP diagnostic tools: `run_diagnostic` with scope='full'
   - Check backend compilation: `checkBackendCompilation` with verbose=true
   - Check frontend build status: `checkFrontendBuildStatus` with checkSize=true

2. **Code Quality Analysis**
   - Run SSOT validation: `scripts/validate-ssot.sh`
   - Run import validation: `scripts/validate-imports.sh`
   - Run linter checks: `npm run lint` (frontend) and `cargo clippy` (backend)
   - Run type checking: `npx tsc --noEmit` (frontend) and `cargo check` (backend)

3. **Security & Dependency Analysis**
   - Run security audit: `npm audit` and `cargo audit`
   - Check for exposed secrets: `scripts/validate-secrets.sh`
   - Analyze dependency vulnerabilities
   - Review authentication/authorization patterns

4. **Testing & Coverage Analysis**
   - Run test coverage audit: `scripts/test-coverage-audit-enhanced.sh`
   - Check test execution: `scripts/run-all-tests.sh`
   - Analyze test gaps and missing coverage
   - Review test quality and patterns

5. **Performance & Bundle Analysis**
   - Run bundle analysis: `scripts/analyze-bundle-size.sh`
   - Check performance metrics: `scripts/verify-performance.sh`
   - Analyze database query performance
   - Review API response times

6. **Infrastructure & Configuration**
   - Validate deployment configs: `scripts/validate-deployment.sh`
   - Check Docker configurations
   - Review environment variables
   - Analyze infrastructure as code

7. **Documentation Analysis**
   - Check documentation completeness
   - Verify API documentation (OpenAPI/Swagger)
   - Review code documentation coverage
   - Check for outdated documentation

### Phase 2: Deep Investigation of Findings

For each finding from Phase 1, perform:

1. **Root Cause Analysis**
   - Trace the issue to its source
   - Identify contributing factors
   - Determine impact scope (files, modules, systems affected)
   - Check for related issues

2. **Pattern Detection**
   - Identify if finding is part of a pattern
   - Search codebase for similar issues
   - Determine if it's a systemic problem
   - Check historical context (git history)

3. **Impact Assessment**
   - Evaluate severity (Critical, High, Medium, Low)
   - Assess business impact
   - Determine user impact
   - Estimate fix complexity

4. **Dependency Analysis**
   - Identify dependencies between issues
   - Check if fixing one issue affects others
   - Determine fix order/priority
   - Identify blocking issues

### Phase 3: Comprehensive Analysis & Review

Generate a complete analysis report with:

1. **Executive Summary**
   - Overall system health score
   - Critical issues count and status
   - High-level recommendations
   - Priority action items

2. **Detailed Findings Report**
   For each category (Backend, Frontend, Infrastructure, Security, Code Quality, Testing, Documentation):
   - **Current State**: Scores, metrics, status
   - **Issues Found**: Complete list with severity
   - **Root Causes**: Analysis of why issues exist
   - **Impact**: Business, technical, user impact
   - **Patterns**: Recurring issues and systemic problems
   - **Dependencies**: How issues relate to each other

3. **Investigation Results**
   - Deep dive into each critical/high severity issue
   - Code examples showing the problem
   - Related issues found
   - Historical context (when introduced, why)
   - Contributing factors

4. **Recommendations**
   - **Immediate Actions**: Critical fixes needed now
   - **Short-term**: High priority improvements (1-2 weeks)
   - **Medium-term**: Important enhancements (1-3 months)
   - **Long-term**: Strategic improvements (3-6 months)
   - **Best Practices**: Patterns to adopt/avoid

5. **Action Plan**
   - Prioritized task list
   - Estimated effort per task
   - Dependencies between tasks
   - Suggested implementation order
   - Risk assessment

6. **Metrics & Trends**
   - Comparison with previous diagnostics (if available)
   - Trend analysis (improving/degrading)
   - Benchmark comparisons
   - Progress tracking recommendations

### Phase 4: Code Review & Quality Assessment

1. **Architecture Review**
   - SSOT compliance check
   - Code organization assessment
   - Module boundaries review
   - Dependency graph analysis

2. **Code Patterns Review**
   - Identify anti-patterns
   - Check for best practice violations
   - Review error handling patterns
   - Assess type safety

3. **Security Review**
   - OWASP Top 10 compliance check
   - Authentication/authorization review
   - Input validation assessment
   - Secrets management review

4. **Performance Review**
   - Database query optimization opportunities
   - API endpoint performance analysis
   - Frontend bundle optimization
   - Caching strategy review

### Phase 5: Generate Comprehensive Report

Create a detailed markdown report with:

1. **Report Structure**
   ```markdown
   # Comprehensive Diagnostic & Analysis Report
   
   ## Executive Summary
   - Overall Health Score: X/100
   - Critical Issues: X
   - High Priority Issues: X
   - Recommendations: X
   
   ## Detailed Analysis
   ### Backend Analysis
   ### Frontend Analysis
   ### Infrastructure Analysis
   ### Security Analysis
   ### Code Quality Analysis
   ### Testing Analysis
   ### Documentation Analysis
   
   ## Deep Investigation Results
   ### Critical Issue #1: [Title]
   ### Critical Issue #2: [Title]
   ...
   
   ## Recommendations & Action Plan
   ### Immediate Actions
   ### Short-term Improvements
   ### Medium-term Enhancements
   ### Long-term Strategic Changes
   
   ## Metrics & Trends
   ## Code Review Findings
   ## Conclusion
   ```

2. **Include in Report**
   - All diagnostic scores and metrics
   - Complete list of findings with severity
   - Code examples for each issue
   - Root cause analysis
   - Impact assessment
   - Detailed recommendations
   - Prioritized action plan
   - Risk assessment
   - Timeline estimates

3. **Output Formats**
   - Primary: Markdown report in `docs/analysis/COMPREHENSIVE_DIAGNOSTIC_REPORT_[TIMESTAMP].md`
   - Secondary: JSON summary in `diagnostic-results/comprehensive_analysis_[TIMESTAMP].json`
   - Summary: Executive summary in console output

### Phase 6: Validation & Verification

1. **Verify Findings**
   - Confirm all issues are real (not false positives)
   - Validate severity classifications
   - Check for duplicate findings
   - Ensure completeness

2. **Cross-Reference**
   - Compare with known issues documentation
   - Check against previous diagnostics
   - Verify against project status
   - Align with development priorities

3. **Quality Check**
   - Ensure recommendations are actionable
   - Verify action plan is feasible
   - Check for missing critical areas
   - Validate priority rankings

---

## Execution Commands

```bash
# Run comprehensive diagnostic
./scripts/comprehensive-diagnostic.sh

# Run all individual diagnostics
for i in {1..15}; do
  ./scripts/diagnostics/diagnostic-$i.sh
done

# Validate SSOT and imports
./scripts/validate-ssot.sh
./scripts/validate-imports.sh

# Run security audits
npm audit
cd backend && cargo audit

# Run test coverage
./scripts/test-coverage-audit-enhanced.sh

# Run bundle analysis
./scripts/analyze-bundle-size.sh

# Check compilation
cd backend && cargo check --verbose
cd frontend && npx tsc --noEmit
```

---

## Expected Output

1. **Diagnostic Scores**: Overall and per-category scores (0-100)
2. **Issues List**: Complete catalog of all findings with:
   - Severity (Critical/High/Medium/Low)
   - Category (Backend/Frontend/Security/etc.)
   - Location (file, line numbers)
   - Description
   - Root cause
   - Impact assessment
   - Recommendations

3. **Investigation Results**: Deep analysis of each finding including:
   - Root cause analysis
   - Pattern detection
   - Related issues
   - Historical context
   - Contributing factors

4. **Comprehensive Report**: Complete analysis document with:
   - Executive summary
   - Detailed findings
   - Investigation results
   - Recommendations
   - Action plan
   - Metrics and trends

5. **Action Plan**: Prioritized list of tasks with:
   - Task description
   - Priority
   - Estimated effort
   - Dependencies
   - Risk level

---

## Success Criteria

✅ All diagnostic scripts executed successfully  
✅ All findings investigated and analyzed  
✅ Root causes identified for critical issues  
✅ Comprehensive report generated  
✅ Actionable recommendations provided  
✅ Prioritized action plan created  
✅ All outputs validated and verified  

---

## Notes

- This diagnostic should take 15-30 minutes to complete
- All outputs should be saved to appropriate directories
- Report should be comprehensive but actionable
- Focus on critical and high-priority issues first
- Provide code examples for all findings
- Include both immediate fixes and strategic improvements

---

**Usage**: Copy this prompt and provide it to the AI agent to execute a comprehensive diagnostic and analysis of the codebase.

