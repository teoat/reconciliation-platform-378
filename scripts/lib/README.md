# Shared Function Library

This directory contains shared utility functions for shell scripts across the reconciliation platform.

## Usage

Source the common functions library at the top of your script:

```bash
#!/bin/bash

# Get script directory and source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Now you can use shared functions
log_info "Starting deployment"
check_prerequisites
health_check "http://localhost:2000/health"
```

## Available Functions

### Logging Functions
- `log_info(message, [log_file])` - Log info message
- `log_success(message, [log_file])` - Log success message
- `log_warning(message, [log_file])` - Log warning message
- `log_error(message, [log_file])` - Log error message
- `print_status(message, [log_file])` - Alias for log_info
- `print_success(message, [log_file])` - Alias for log_success
- `print_error(message, [log_file])` - Alias for log_error

### Validation Functions
- `check_command(cmd)` - Check if command exists
- `check_docker()` - Check if Docker is running
- `check_docker_compose()` - Check if Docker Compose is available
- `check_prerequisites()` - Check common prerequisites (docker, docker-compose, git)
- `validate_file_exists(file, [description])` - Validate file exists
- `validate_directory_exists(dir, [description])` - Validate directory exists
- `validate_port(port, [service])` - Validate port is available
- `validate_env_var(var_name)` - Validate environment variable is set

### Health Check Functions
- `check_endpoint(url, [expected_status], [timeout])` - Check HTTP endpoint
- `health_check(url, [max_attempts], [delay], [description])` - Health check with retries

### Backup Functions
- `create_backup_dir([backup_dir])` - Create timestamped backup directory
- `backup_postgresql([backup_dir])` - Backup PostgreSQL database
- `list_backups([backup_dir], [pattern])` - List available backups
- `cleanup_old_backups([backup_dir], [retention_days])` - Cleanup old backups

### Deployment Functions
- `verify_deployment([health_url], [max_attempts])` - Verify deployment health

### Utility Functions
- `check_root()` - Check if running as root (should not be)
- `send_notification(status, message, [webhook])` - Send webhook notification
- `get_script_dir()` - Get script directory path

## Examples

### Basic Script Template

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Check prerequisites
check_prerequisites

# Your script logic
log_info "Starting process"
# ... your code ...
log_success "Process completed"
```

### With Logging

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

LOG_FILE="/var/log/my-script.log"
mkdir -p "$(dirname "$LOG_FILE")"

log_info "Starting process" "$LOG_FILE"
# ... your code ...
log_success "Process completed" "$LOG_FILE"
```

### Health Check Example

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Wait for service to be healthy
if health_check "http://localhost:2000/health" 30 10 "Backend Service"; then
    log_success "Service is healthy"
else
    log_error "Service health check failed"
    exit 1
fi
```

## Adding New Functions

If you need to add a new common function:

1. Add function to `common-functions.sh`
2. Export the function: `export -f function_name`
3. Update this README with documentation
4. Ensure function follows existing patterns (logging, error handling)

## Best Practices

1. **Always source the library** - Don't define duplicate functions
2. **Use appropriate log levels** - info, success, warning, error
3. **Handle errors properly** - Use `set -e` and check return codes
4. **Document your script** - Include usage and examples
5. **Follow naming conventions** - Use descriptive function names

## Related Documentation

- [Consolidation Rules](../../.cursor/rules/consolidation.mdc)
- [DUPLICATE_FUNCTIONS_DIAGNOSTIC.md](../../DUPLICATE_FUNCTIONS_DIAGNOSTIC.md)
- [CONSOLIDATION_MAINTENANCE.md](../../docs/operations/CONSOLIDATION_MAINTENANCE.md)

