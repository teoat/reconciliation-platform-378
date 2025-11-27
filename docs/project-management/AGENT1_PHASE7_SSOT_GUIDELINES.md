# Agent 1 Phase 7 SSOT Guidelines

**Date**: 2025-11-26  
**Agent**: Agent 1 (SSOT Specialist)  
**Status**: Active Guidelines  
**Phase**: Phase 7 - Production Deployment & Operations

---

## Executive Summary

These guidelines ensure all Phase 7 work (production deployment, monitoring, and operations) maintains SSOT compliance. Follow these guidelines when creating or modifying deployment scripts, monitoring utilities, and operations code.

---

## Core SSOT Principles for Phase 7

### 1. Single Source of Truth for Shell Scripts

**SSOT Location**: `scripts/lib/common-functions.sh`

**All shell scripts MUST**:
- Source the common functions library: `source "$SCRIPT_DIR/lib/common-functions.sh"`
- Use SSOT logging functions: `log_info()`, `log_success()`, `log_error()`, `log_warning()`
- Use SSOT validation functions: `check_command()`, `check_prerequisites()`, `validate_file_exists()`
- Use SSOT health check functions: `health_check()`, `check_endpoint()`
- Use SSOT deployment functions: `verify_deployment()`

**❌ FORBIDDEN**:
- Creating custom logging functions (use SSOT functions)
- Creating duplicate validation functions
- Creating duplicate health check functions
- Creating duplicate deployment utilities

---

## Deployment Scripts SSOT Guidelines

### Required Pattern

```bash
#!/bin/bash
# Script description

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Use SSOT functions
log_info "Starting deployment"
check_prerequisites
verify_deployment "http://localhost:2000/health"
```

### SSOT Functions to Use

1. **Logging**
   - `log_info(message)` - Informational messages
   - `log_success(message)` - Success messages
   - `log_error(message)` - Error messages
   - `log_warning(message)` - Warning messages

2. **Validation**
   - `check_command(cmd)` - Check if command exists
   - `check_prerequisites()` - Check common prerequisites
   - `validate_file_exists(file)` - Validate file exists
   - `validate_directory_exists(dir)` - Validate directory exists
   - `validate_port(port)` - Validate port is available
   - `validate_env_var(var_name)` - Validate environment variable is set

3. **Health Checks**
   - `health_check(url, max_attempts, delay, description)` - Health check with retries
   - `check_endpoint(url, expected_status, timeout)` - Check HTTP endpoint

4. **Deployment**
   - `verify_deployment(health_url, max_attempts)` - Verify deployment health

### Examples

**✅ DO: Use SSOT Functions**
```bash
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Starting deployment"
check_prerequisites
verify_deployment "http://localhost:2000/health"
log_success "Deployment complete"
```

**❌ DON'T: Create Custom Functions**
```bash
#!/bin/bash
# Custom logging (FORBIDDEN)
log() {
    echo "[LOG] $1"
}

error() {
    echo "[ERROR] $1"
    exit 1
}
```

---

## Monitoring Scripts SSOT Guidelines

### Required Pattern

```bash
#!/bin/bash
# Monitoring script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Use SSOT functions
log_info "Starting monitoring"
health_check "http://localhost:2000/health" 10 5 "Backend"
```

### SSOT Functions to Use

1. **Health Monitoring**
   - `health_check()` - Health check with retries
   - `check_endpoint()` - Check HTTP endpoint

2. **Logging**
   - Use SSOT logging functions (see above)

### Examples

**✅ DO: Use SSOT Health Checks**
```bash
health_check "http://localhost:2000/health" 10 5 "Backend Service"
```

**❌ DON'T: Create Custom Health Checks**
```bash
# Custom health check (FORBIDDEN)
check_health() {
    curl -f "$1" || exit 1
}
```

---

## Operations Scripts SSOT Guidelines

### Required Pattern

```bash
#!/bin/bash
# Operations script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Use SSOT functions
log_info "Running operations check"
check_prerequisites
health_check "http://localhost:2000/health"
```

### SSOT Functions to Use

- All SSOT functions from common-functions.sh
- No custom operations utilities

---

## Environment Configuration SSOT Guidelines

### Configuration Files

**SSOT Location**: Environment variables and `.env` files

**Guidelines**:
- Use environment variables for configuration
- Don't hardcode configuration values
- Use SSOT validation: `validate_env_var(var_name)`
- Document required environment variables

### Examples

**✅ DO: Use Environment Variables**
```bash
DATABASE_URL="${DATABASE_URL:-postgresql://localhost:5432/db}"
validate_env_var "DATABASE_URL"
```

**❌ DON'T: Hardcode Values**
```bash
DATABASE_URL="postgresql://localhost:5432/db"  # Hardcoded (FORBIDDEN)
```

---

## Secrets Management SSOT Guidelines

### Secrets Storage

**SSOT Location**: Environment variables or secrets management system

**Guidelines**:
- Never commit secrets to version control
- Use environment variables or secrets management
- Use SSOT validation: `validate_env_var(var_name)`
- Document secrets requirements

### Examples

**✅ DO: Use Environment Variables**
```bash
JWT_SECRET="${JWT_SECRET}"
validate_env_var "JWT_SECRET"
```

**❌ DON'T: Hardcode Secrets**
```bash
JWT_SECRET="my-secret-key"  # Hardcoded secret (FORBIDDEN)
```

---

## Logging SSOT Guidelines

### Structured Logging

**SSOT Location**: `scripts/lib/common-functions.sh`

**Guidelines**:
- Always use SSOT logging functions
- Use appropriate log levels
- Include timestamps (automatic with SSOT functions)
- Don't create custom logging functions

### Log Levels

- `log_info()` - Informational messages
- `log_success()` - Success messages
- `log_warning()` - Warning messages
- `log_error()` - Error messages

### Examples

**✅ DO: Use SSOT Logging**
```bash
log_info "Starting deployment"
log_success "Deployment complete"
log_error "Deployment failed"
log_warning "Resource usage high"
```

**❌ DON'T: Create Custom Logging**
```bash
echo "[INFO] Starting deployment"  # Custom logging (FORBIDDEN)
```

---

## Health Checks SSOT Guidelines

### Health Check Functions

**SSOT Location**: `scripts/lib/common-functions.sh`

**Functions**:
- `health_check(url, max_attempts, delay, description)` - Health check with retries
- `check_endpoint(url, expected_status, timeout)` - Check HTTP endpoint

### Examples

**✅ DO: Use SSOT Health Checks**
```bash
health_check "http://localhost:2000/health" 10 5 "Backend Service"
check_endpoint "http://localhost:2000/api/health" 200 5
```

**❌ DON'T: Create Custom Health Checks**
```bash
# Custom health check (FORBIDDEN)
for i in {1..10}; do
    if curl -f "http://localhost:2000/health"; then
        break
    fi
    sleep 5
done
```

---

## Deployment Verification SSOT Guidelines

### Deployment Verification

**SSOT Location**: `scripts/lib/common-functions.sh`

**Function**: `verify_deployment(health_url, max_attempts)`

### Examples

**✅ DO: Use SSOT Verification**
```bash
verify_deployment "http://localhost:2000/health" 10
```

**❌ DON'T: Create Custom Verification**
```bash
# Custom verification (FORBIDDEN)
for i in {1..10}; do
    if curl -f "http://localhost:2000/health"; then
        echo "Deployment verified"
        break
    fi
    sleep 5
done
```

---

## Checklist for New Scripts

Before creating a new Phase 7 script, verify:

- [ ] Script sources `scripts/lib/common-functions.sh`
- [ ] Uses SSOT logging functions (not custom)
- [ ] Uses SSOT validation functions (not custom)
- [ ] Uses SSOT health check functions (not custom)
- [ ] Uses SSOT deployment functions (not custom)
- [ ] No duplicate utilities created
- [ ] Environment variables used (not hardcoded)
- [ ] Secrets not hardcoded
- [ ] Script follows SSOT patterns

---

## Common Violations to Avoid

1. **Custom Logging Functions**
   ```bash
   # ❌ FORBIDDEN
   log() { echo "[LOG] $1"; }
   ```

2. **Custom Health Checks**
   ```bash
   # ❌ FORBIDDEN
   check_health() { curl -f "$1" || exit 1; }
   ```

3. **Hardcoded Values**
   ```bash
   # ❌ FORBIDDEN
   DATABASE_URL="postgresql://localhost:5432/db"
   ```

4. **Duplicate Utilities**
   ```bash
   # ❌ FORBIDDEN - Use SSOT function instead
   verify_deployment_custom() { ... }
   ```

---

## Migration Guide

### Migrating Existing Scripts to SSOT

1. **Add SSOT Source**
   ```bash
   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   source "$SCRIPT_DIR/lib/common-functions.sh"
   ```

2. **Replace Custom Logging**
   ```bash
   # Before
   log "Message"
   
   # After
   log_info "Message"
   ```

3. **Replace Custom Health Checks**
   ```bash
   # Before
   curl -f "$URL" || exit 1
   
   # After
   health_check "$URL" 10 5 "Service"
   ```

4. **Replace Custom Validation**
   ```bash
   # Before
   if [ ! -f "$FILE" ]; then
       echo "File not found"
       exit 1
   fi
   
   # After
   validate_file_exists "$FILE"
   ```

---

## Related Documentation

- [SSOT Best Practices](../development/SSOT_BEST_PRACTICES.md) - General SSOT guidelines
- [SSOT_LOCK.yml](../../SSOT_LOCK.yml) - SSOT definitions
- [Common Functions Library](../../scripts/lib/common-functions.sh) - SSOT functions
- [Phase 7 SSOT Compliance Report](./AGENT1_PHASE7_SSOT_COMPLIANCE_REPORT.md) - Compliance status

---

**Last Updated**: 2025-11-26  
**Status**: Active  
**Next Review**: Weekly during Phase 7

