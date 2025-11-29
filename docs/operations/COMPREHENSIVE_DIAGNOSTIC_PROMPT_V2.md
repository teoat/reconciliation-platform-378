# Comprehensive Deep Diagnostic & Analysis Prompt V2

**Purpose**: Run a complete, multi-layered diagnostic of the entire codebase with automated remediation, historical tracking, predictive analysis, and comprehensive reporting.

**Version**: 2.0  
**Last Updated**: 2025-01-16  
**Status**: Active

---

## Overview

This comprehensive diagnostic workflow combines deep analysis (V1) with automated remediation, predictive insights, and team collaboration (V2). It provides a complete quality engineering platform for maintaining code quality, reducing technical debt, and improving team productivity.

---

## Complete Workflow

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
   - Calculate risk scores

4. **Dependency Analysis**
   - Identify dependencies between issues
   - Check if fixing one issue affects others
   - Determine fix order/priority
   - Identify blocking issues

### Phase 2.5: Automated Remediation (V2 NEW)

**Purpose**: Automatically fix common issues with approval workflow

1. **Identify Auto-Fixable Issues**
   - Categorize issues into:
     - **Safe Fixes**: Apply automatically (formatting, import sorting, unused imports)
     - **Review Required**: Show diff and request approval (dependency updates, code refactoring)
     - **Manual Fixes**: Provide detailed fix instructions (architectural changes, breaking changes)

2. **Apply Safe Fixes Automatically**
   - Fix linting errors (ESLint auto-fix, clippy suggestions)
   - Auto-format code (prettier, rustfmt)
   - Fix import path issues (SSOT violations)
   - Remove unused imports/variables
   - Fix simple type errors

3. **Generate Fix Patches for Review**
   - Create diff for review-required fixes
   - Show before/after code with explanations
   - Provide multiple fix options where applicable
   - Explain why each fix is recommended

4. **Fix Validation**
   - Verify fixes don't break compilation
   - Run tests after fixes
   - Check for regression
   - Validate fix completeness
   - Run linter/type checker to confirm

5. **Generate Fix Report**
   - List all fixes applied
   - Document fixes requiring approval
   - Track fix success rate
   - Note any issues encountered

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
   - **Risk Scores**: Calculated risk for each module/component

3. **Investigation Results**
   - Deep dive into each critical/high severity issue
   - Code examples showing the problem
   - Related issues found
   - Historical context (when introduced, why)
   - Contributing factors
   - Fix recommendations with code examples

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

6. **Metrics & Trends** (Enhanced in V2)
   - Comparison with previous diagnostics
   - Trend analysis (improving/degrading)
   - Benchmark comparisons
   - Progress tracking recommendations
   - Velocity metrics (fix rate, issue introduction rate)

### Phase 4: Advanced Code Analysis (V2 Enhanced)

1. **Architecture Review**
   - SSOT compliance check
   - Code organization assessment
   - Module boundaries review
   - Dependency graph analysis
   - Detect circular dependencies
   - Identify tight coupling
   - Recommend architectural improvements

2. **Code Patterns Review**
   - Identify anti-patterns
   - Check for best practice violations
   - Review error handling patterns
   - Assess type safety
   - Detect code smells (long methods, god classes, etc.)
   - Find duplicate code patterns
   - Detect complexity hotspots

3. **Security Review**
   - OWASP Top 10 compliance check
   - Authentication/authorization review
   - Input validation assessment
   - Secrets management review
   - Static Application Security Testing (SAST)
   - Detect security anti-patterns
   - Identify sensitive data exposure
   - Check compliance (GDPR, SOC2, etc.)

4. **Performance Review**
   - Database query optimization opportunities
   - API endpoint performance analysis
   - Frontend bundle optimization
   - Caching strategy review
   - Identify performance bottlenecks
   - Analyze database query patterns
   - Detect N+1 query problems
   - Recommend caching opportunities

5. **API Analysis** (V2 NEW)
   - Validate API contracts
   - Check API consistency
   - Detect breaking changes
   - Analyze API usage patterns
   - Verify OpenAPI/Swagger documentation

6. **Generate Architecture Diagrams** (V2 NEW)
   - Dependency graphs
   - Module relationship diagrams
   - Code flow diagrams
   - System architecture visualization

### Phase 5: Enhanced Reporting & Visualization (V2 Enhanced)

Create comprehensive reports with multiple formats:

1. **Interactive HTML Report** (V2 NEW)
   - Clickable navigation
   - Expandable sections
   - Searchable findings
   - Filterable by category/severity
   - Health score gauges
   - Trend charts
   - Issue distribution pie charts
   - Dependency graphs
   - Code heatmaps

2. **Markdown Report** (V1 + Enhanced)
   ```markdown
   # Comprehensive Diagnostic & Analysis Report
   
   ## Executive Summary
   - Overall Health Score: X/100
   - Critical Issues: X
   - High Priority Issues: X
   - Recommendations: X
   - Auto-fixes Applied: X
   
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
   
   ## Automated Fixes Applied
   ### Safe Fixes (Auto-applied)
   ### Review-Required Fixes (Pending Approval)
   ### Manual Fixes (Instructions Provided)
   
   ## Recommendations & Action Plan
   ### Immediate Actions
   ### Short-term Improvements
   ### Medium-term Enhancements
   ### Long-term Strategic Changes
   
   ## Metrics & Trends
   ## Historical Analysis
   ## Predictive Insights
   ## Code Review Findings
   ## Conclusion
   ```

3. **JSON Summary** (V1 + Enhanced)
   - All diagnostic scores and metrics
   - Complete findings with metadata
   - Fix history
   - Trend data
   - Risk scores

4. **Export Options** (V2 NEW)
   - PDF reports
   - Excel spreadsheets
   - CSV data exports
   - JSON API format

5. **Report Customization** (V2 NEW)
   - Custom report templates
   - Filter by team/module
   - Focus on specific areas
   - Compare reports

### Phase 6: Historical Analysis & Trend Tracking (V2 NEW)

1. **Load Historical Data**
   - Retrieve previous diagnostic results from time-series database
   - Load issue lifecycle data (introduced → fixed → regression)
   - Get code quality trends per module/file

2. **Calculate Trend Metrics**
   - Identify improving/degrading areas
   - Detect regression patterns
   - Calculate velocity metrics (fix rate, issue introduction rate)
   - Track quality trends per category

3. **Generate Trend Visualizations**
   - Health scores over time (line charts)
   - Issue heatmaps (problem areas)
   - Fix velocity graphs
   - Quality trend lines per category
   - Regression detection charts

4. **Benchmarking**
   - Compare against industry standards
   - Track against project goals
   - Measure improvement velocity
   - Set quality gates based on trends

5. **Regression Detection**
   - Identify issues that were fixed but reappeared
   - Detect quality degradation patterns
   - Alert on significant regressions
   - Track fix effectiveness

### Phase 7: Predictive Analysis & Risk Assessment (V2 NEW)

1. **Predictive Modeling**
   - Predict which files/modules will have issues next
   - Identify technical debt accumulation patterns
   - Forecast security vulnerabilities
   - Predict performance degradation
   - Use ML/AI for pattern recognition

2. **Risk Scoring**
   - Calculate risk scores for each module/component
   - Identify high-risk areas requiring attention
   - Prioritize based on risk + impact

3. **Technical Debt Quantification**
   - Calculate technical debt in hours/days
   - Estimate cost of fixing vs. maintaining
   - Identify debt hotspots
   - Track debt accumulation rate
   - Calculate ROI of debt reduction

4. **Dependency Risk Analysis**
   - Identify vulnerable dependency chains
   - Assess impact of dependency updates
   - Predict breaking changes
   - Recommend dependency strategies

5. **Generate Predictive Insights**
   - List files/modules at risk
   - Forecast issue introduction rate
   - Predict maintenance costs
   - Recommend preventive actions

### Phase 8: Interactive Remediation Workflow (V2 NEW)

1. **Present Fixable Issues Interactively**
   - Show fixable issues with context
   - Display code before/after with explanations
   - Provide multiple fix options
   - Explain why each fix is recommended
   - Show related fixes

2. **Fix Preview & Approval**
   - Generate fix previews
   - Request approval for risky fixes
   - Batch approval for similar fixes
   - Rollback capability
   - Fix history tracking

3. **Apply Fixes with Validation**
   - Apply approved fixes
   - Validate fixes in real-time
   - Run tests after each fix
   - Check for compilation errors
   - Verify fix completeness

4. **Progress Tracking**
   - Track fix progress
   - Show completion percentage
   - Display remaining fixes
   - Update status in real-time

5. **Collaboration Features**
   - Share findings with team
   - Request code review for fixes
   - Track fix assignments
   - Comment on findings
   - Team notifications

### Phase 9: Team Workflow & Collaboration (V2 NEW)

1. **Issue Assignment**
   - Assign findings to team members
   - Track fix progress
   - Set due dates
   - Prioritize by assignee
   - Track ownership

2. **Team Metrics**
   - Track team performance
   - Measure fix velocity
   - Identify bottlenecks
   - Recognize improvements
   - Generate team reports

3. **Project Management Integration**
   - Create tickets from findings
   - Link to Jira/GitHub Issues
   - Track in project boards
   - Update status automatically
   - Sync with project management tools

4. **Code Review Integration**
   - Pre-commit quality checks
   - PR quality analysis
   - Review comment suggestions
   - Automated review feedback
   - Quality gate enforcement

### Phase 10: Validation & Verification (Enhanced)

1. **Verify Findings**
   - Confirm all issues are real (not false positives)
   - Validate severity classifications
   - Check for duplicate findings
   - Ensure completeness
   - Verify fix effectiveness

2. **Cross-Reference**
   - Compare with known issues documentation
   - Check against previous diagnostics
   - Verify against project status
   - Align with development priorities
   - Validate against historical data

3. **Quality Check**
   - Ensure recommendations are actionable
   - Verify action plan is feasible
   - Check for missing critical areas
   - Validate priority rankings

4. **Continuous Monitoring Setup** (V2 NEW)
   - Configure quality gates
   - Set up alerts
   - Integrate with CI/CD
   - Enable real-time monitoring
   - Configure dashboard

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

# Auto-fix safe issues (V2)
npm run lint -- --fix
cargo clippy --fix --allow-dirty
prettier --write "**/*.{ts,tsx,js,jsx,json,css,md}"
rustfmt --edition 2021 backend/src/**/*.rs
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
   - Risk score (V2)
   - Fix category (Safe/Review/Manual) (V2)

3. **Automated Fixes Report** (V2):
   - List of fixes applied automatically
   - Fixes pending approval
   - Fix validation results
   - Fix success rate

4. **Investigation Results**: Deep analysis of each finding including:
   - Root cause analysis
   - Pattern detection
   - Related issues
   - Historical context
   - Contributing factors
   - Predictive insights (V2)

5. **Comprehensive Reports**: Multiple formats including:
   - Interactive HTML report (V2)
   - Markdown report
   - JSON summary
   - PDF/Excel exports (V2)

6. **Historical Analysis** (V2):
   - Trend charts
   - Regression detection
   - Benchmark comparisons
   - Velocity metrics

7. **Predictive Insights** (V2):
   - Risk scores
   - Technical debt quantification
   - Future issue predictions
   - Preventive recommendations

8. **Action Plan**: Prioritized list of tasks with:
   - Task description
   - Priority
   - Estimated effort
   - Dependencies
   - Risk level

9. **Team Workflow** (V2):
   - Issue assignments
   - Team metrics
   - Project management integration
   - Progress tracking

---

## Success Criteria

✅ All diagnostic scripts executed successfully  
✅ All findings investigated and analyzed  
✅ Root causes identified for critical issues  
✅ Automated fixes applied where safe (V2)  
✅ Comprehensive reports generated in multiple formats  
✅ Actionable recommendations provided  
✅ Prioritized action plan created  
✅ Historical trends analyzed (V2)  
✅ Predictive insights generated (V2)  
✅ Risk scores calculated (V2)  
✅ Team workflow configured (V2)  
✅ All outputs validated and verified  
✅ Continuous monitoring set up (V2)  

---

## V2 Features Summary

### New Capabilities
- 🤖 **Automated Remediation**: Auto-fix 70%+ of issues safely
- 📊 **Historical Tracking**: Time-series database with trend analysis
- 🔮 **Predictive Analysis**: ML-based issue prediction and risk scoring
- 🎯 **Interactive Workflow**: Step-by-step fix wizard with approvals
- 🔍 **Advanced Analysis**: Code smells, architecture, performance profiling
- 📈 **Real-time Monitoring**: Continuous quality monitoring with alerts
- 📋 **Enhanced Reporting**: Interactive HTML reports with visualizations
- 👥 **Team Collaboration**: Issue assignment, metrics, PM integration
- ⚙️ **Custom Rules**: Extensible framework with custom checks

### Enhanced Features
- Deeper code analysis with ML/AI insights
- Rich visualizations and interactive reports
- Historical trend analysis and benchmarking
- Predictive risk assessment
- Team-based workflow

---

## Notes

- **Execution Time**: 15-30 minutes for full diagnostic (V1), 20-40 minutes with V2 features
- **Output Location**: 
  - Reports: `docs/analysis/COMPREHENSIVE_DIAGNOSTIC_REPORT_[TIMESTAMP].md`
  - JSON: `diagnostic-results/comprehensive_analysis_[TIMESTAMP].json`
  - HTML: `diagnostic-results/comprehensive_analysis_[TIMESTAMP].html` (V2)
  - Historical Data: `diagnostic-results/history/` (V2)
- **Focus**: Critical and high-priority issues first
- **Code Examples**: Provided for all findings
- **Both Immediate and Strategic**: Include both quick fixes and long-term improvements
- **Automation**: Safe fixes applied automatically, risky fixes require approval
- **Continuous**: Set up monitoring for ongoing quality tracking

---

## Usage

**For Quick Diagnostic (V1 features only)**:
Use the original V1 prompt focusing on Phases 1-5 and 11.

**For Complete Diagnostic (V1 + V2)**:
Use this combined prompt to execute all phases including automated remediation, historical analysis, predictive insights, and team collaboration.

**For Continuous Monitoring**:
Configure Phase 11 continuous monitoring setup and run diagnostics on commits/PRs automatically.

---

**Version**: 2.0  
**Last Updated**: 2025-01-16  
**Status**: Active - Combined V1 + V2

