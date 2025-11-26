#!/bin/bash
# scripts/manage-ssot.sh
# SSOT Management Script with Agent Coordination Integration
# Manages Single Source of Truth files with file locking via agent coordination

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Agent ID for coordination
AGENT_ID="ssot-manager-$(date +%s)"
SSOT_LOCK_FILE="${PROJECT_ROOT}/SSOT_LOCK.yml"
SSOT_REGISTRY="${PROJECT_ROOT}/.ssot-registry.json"

# SSOT File Categories
declare -A SSOT_CATEGORIES=(
    ["passwords"]=".env .env.example"
    ["config"]="docker-compose.yml frontend/src/config/AppConfig.ts backend/src/config/mod.rs"
    ["types"]="frontend/src/types/backend-aligned.ts frontend/src/types/index.ts"
    ["api"]="constants/index.ts frontend/src/config/AppConfig.ts"
    ["docker"]="docker-compose.yml docker-compose.base.yml docker-compose.staging.yml"
    ["documentation"]="docs/architecture/SSOT_GUIDANCE.md SSOT_LOCK.yml"
    ["scripts"]="scripts/lib/common-functions.sh"
)

# Function to check if agent coordination is available
check_agent_coordination() {
    if ! command -v node &> /dev/null; then
        log_warning "Node.js not found. Agent coordination unavailable."
        return 1
    fi
    
    if [ ! -f "${PROJECT_ROOT}/mcp-server/dist/agent-coordination.js" ]; then
        log_warning "Agent coordination MCP server not built. Run: cd mcp-server && npm run build"
        return 1
    fi
    
    return 0
}

# Function to lock SSOT file via agent coordination
lock_ssot_file() {
    local file=$1
    local reason=${2:-"SSOT management operation"}
    
    if ! check_agent_coordination; then
        log_warning "Skipping file lock (agent coordination unavailable)"
        return 0
    fi
    
    # Use MCP agent coordination to lock file
    log_info "Locking SSOT file: $file"
    
    # Check if file is already locked
    local lock_check=$(node -e "
        const { spawn } = require('child_process');
        const proc = spawn('node', ['${PROJECT_ROOT}/mcp-server/dist/agent-coordination.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Send MCP request to check file lock
        const request = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'agent_check_file_lock',
                arguments: {
                    file: '${file}'
                }
            }
        });
        
        proc.stdin.write(request + '\n');
        proc.stdin.end();
        
        let output = '';
        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.stderr.on('data', (data) => { output += data.toString(); });
        
        proc.on('close', (code) => {
            if (code === 0) {
                try {
                    const response = JSON.parse(output);
                    if (response.result && response.result.locked) {
                        process.exit(1); // File is locked
                    }
                } catch (e) {
                    // Assume not locked if we can't parse
                }
            }
        });
    " 2>/dev/null || echo "0")
    
    if [ "$lock_check" = "1" ]; then
        log_error "File $file is already locked by another agent"
        return 1
    fi
    
    # Lock the file
    node -e "
        const { spawn } = require('child_process');
        const proc = spawn('node', ['${PROJECT_ROOT}/mcp-server/dist/agent-coordination.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const request = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'agent_lock_file',
                arguments: {
                    file: '${file}',
                    agentId: '${AGENT_ID}',
                    reason: '${reason}',
                    ttl: 3600
                }
            }
        });
        
        proc.stdin.write(request + '\n');
        proc.stdin.end();
        
        proc.on('close', (code) => {
            process.exit(code);
        });
    " 2>/dev/null || {
        log_warning "Could not lock file via agent coordination (continuing anyway)"
        return 0
    }
    
    log_success "Locked SSOT file: $file"
    return 0
}

# Function to unlock SSOT file
unlock_ssot_file() {
    local file=$1
    
    if ! check_agent_coordination; then
        return 0
    fi
    
    log_info "Unlocking SSOT file: $file"
    
    node -e "
        const { spawn } = require('child_process');
        const proc = spawn('node', ['${PROJECT_ROOT}/mcp-server/dist/agent-coordination.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const request = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'agent_unlock_file',
                arguments: {
                    file: '${file}',
                    agentId: '${AGENT_ID}'
                }
            }
        });
        
        proc.stdin.write(request + '\n');
        proc.stdin.end();
        
        proc.on('close', (code) => {
            process.exit(code);
        });
    " 2>/dev/null || {
        log_warning "Could not unlock file via agent coordination"
    }
    
    log_success "Unlocked SSOT file: $file"
}

# Function to register agent
register_agent() {
    if ! check_agent_coordination; then
        return 0
    fi
    
    log_info "Registering SSOT manager agent..."
    
    node -e "
        const { spawn } = require('child_process');
        const proc = spawn('node', ['${PROJECT_ROOT}/mcp-server/dist/agent-coordination.js'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        const request = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'agent_register',
                arguments: {
                    agentId: '${AGENT_ID}',
                    capabilities: ['ssot-management', 'file-locking', 'configuration'],
                    currentTask: 'ssot-management'
                }
            }
        });
        
        proc.stdin.write(request + '\n');
        proc.stdin.end();
        
        proc.on('close', (code) => {
            process.exit(code);
        });
    " 2>/dev/null || {
        log_warning "Could not register agent (continuing anyway)"
    }
}

# Function to list all SSOT files
list_ssot_files() {
    log_info "SSOT Files by Category:"
    echo ""
    
    for category in "${!SSOT_CATEGORIES[@]}"; do
        echo -e "${BLUE}${category^}:${NC}"
        for file in ${SSOT_CATEGORIES[$category]}; do
            local full_path="${PROJECT_ROOT}/${file}"
            if [ -f "$full_path" ]; then
                echo -e "  ${GREEN}✓${NC} $file"
            else
                echo -e "  ${RED}✗${NC} $file (not found)"
            fi
        done
        echo ""
    done
}

# Function to check SSOT file consistency
check_consistency() {
    log_info "Checking SSOT file consistency..."
    local errors=0
    
    # Check password consistency
    if [ -f "${PROJECT_ROOT}/.env" ]; then
        source "${PROJECT_ROOT}/.env"
        
        # Check Redis password in docker-compose.yml
        if grep -q "REDIS_PASSWORD.*redis_pass" "${PROJECT_ROOT}/docker-compose.yml" 2>/dev/null && [ "${REDIS_PASSWORD:-}" != "redis_pass" ] && [ -n "${REDIS_PASSWORD:-}" ]; then
            log_warning "Redis password mismatch in docker-compose.yml"
            errors=$((errors + 1))
        fi
    fi
    
    # Check API endpoint consistency
    if [ -f "${PROJECT_ROOT}/constants/index.ts" ] && [ -f "${PROJECT_ROOT}/frontend/src/config/AppConfig.ts" ]; then
        local constants_auth=$(grep -o "AUTH.*LOGIN.*'/api/auth/login'" "${PROJECT_ROOT}/constants/index.ts" 2>/dev/null || echo "")
        local config_auth=$(grep -o "LOGIN.*'/auth/login'" "${PROJECT_ROOT}/frontend/src/config/AppConfig.ts" 2>/dev/null || echo "")
        
        if [ -n "$constants_auth" ] && [ -n "$config_auth" ]; then
            log_warning "API endpoint definitions may be inconsistent between constants/index.ts and AppConfig.ts"
            errors=$((errors + 1))
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "All SSOT files are consistent"
    else
        log_warning "Found $errors inconsistency(ies)"
    fi
    
    return $errors
}

# Function to validate SSOT file
validate_ssot_file() {
    local file=$1
    
    if [ ! -f "$file" ]; then
        log_error "SSOT file not found: $file"
        return 1
    fi
    
    # Lock file before validation
    if ! lock_ssot_file "$file" "SSOT validation"; then
        return 1
    fi
    
    # Perform validation based on file type
    case "$file" in
        *.yml|*.yaml)
            if command -v yamllint &> /dev/null; then
                yamllint "$file" || log_warning "YAML validation issues found"
            fi
            ;;
        *.json)
            if command -v jq &> /dev/null; then
                jq empty "$file" 2>/dev/null || log_error "Invalid JSON: $file"
            fi
            ;;
        *.ts|*.tsx)
            if command -v tsc &> /dev/null; then
                # Basic syntax check
                tsc --noEmit "$file" 2>/dev/null || log_warning "TypeScript validation issues found"
            fi
            ;;
    esac
    
    unlock_ssot_file "$file"
    log_success "Validated SSOT file: $file"
}

# Function to edit SSOT file with locking
edit_ssot_file() {
    local file=$1
    local editor=${2:-${EDITOR:-nano}}
    
    if [ ! -f "$file" ]; then
        log_error "SSOT file not found: $file"
        return 1
    fi
    
    # Register agent
    register_agent
    
    # Lock file
    if ! lock_ssot_file "$file" "SSOT file editing"; then
        return 1
    fi
    
    # Edit file
    log_info "Opening $file in $editor..."
    $editor "$file"
    
    # Validate after editing
    validate_ssot_file "$file"
    
    # Unlock file
    unlock_ssot_file "$file"
    
    log_success "Completed editing SSOT file: $file"
}

# Function to create SSOT registry
create_registry() {
    log_info "Creating SSOT registry..."
    
    cat > "$SSOT_REGISTRY" << EOF
{
  "version": "1.0.0",
  "generated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "agentId": "${AGENT_ID}",
  "categories": {
$(for category in "${!SSOT_CATEGORIES[@]}"; do
    echo "    \"$category\": ["
    for file in ${SSOT_CATEGORIES[$category]}; do
        local full_path="${PROJECT_ROOT}/${file}"
        local exists="false"
        local size="0"
        local modified=""
        
        if [ -f "$full_path" ]; then
            exists="true"
            size=$(stat -f%z "$full_path" 2>/dev/null || stat -c%s "$full_path" 2>/dev/null || echo "0")
            modified=$(stat -f%Sm -t "%Y-%m-%dT%H:%M:%SZ" "$full_path" 2>/dev/null || stat -c%y "$full_path" 2>/dev/null | cut -d' ' -f1-2 || echo "")
        fi
        
        echo "      {"
        echo "        \"file\": \"$file\","
        echo "        \"exists\": $exists,"
        echo "        \"size\": $size,"
        echo "        \"modified\": \"$modified\""
        echo "      }$(if [ "$file" != "$(echo ${SSOT_CATEGORIES[$category]} | awk '{print $NF}')" ]; then echo ","; fi)"
    done
    echo "    ]$(if [ "$category" != "$(echo ${!SSOT_CATEGORIES[@]} | awk '{print $NF}')" ]; then echo ","; fi)"
done)
  }
}
EOF
    
    log_success "SSOT registry created: $SSOT_REGISTRY"
}

# Main command handler
case "${1:-}" in
    list)
        list_ssot_files
        ;;
    check)
        check_consistency
        ;;
    validate)
        if [ -z "$2" ]; then
            log_error "Usage: $0 validate <SSOT_FILE>"
            exit 1
        fi
        validate_ssot_file "$2"
        ;;
    edit)
        if [ -z "$2" ]; then
            log_error "Usage: $0 edit <SSOT_FILE> [EDITOR]"
            exit 1
        fi
        edit_ssot_file "$2" "${3:-}"
        ;;
    lock)
        if [ -z "$2" ]; then
            log_error "Usage: $0 lock <SSOT_FILE> [REASON]"
            exit 1
        fi
        register_agent
        lock_ssot_file "$2" "${3:-SSOT management}"
        ;;
    unlock)
        if [ -z "$2" ]; then
            log_error "Usage: $0 unlock <SSOT_FILE>"
            exit 1
        fi
        unlock_ssot_file "$2"
        ;;
    registry)
        create_registry
        ;;
    *)
        echo "SSOT Management Script with Agent Coordination"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  list              List all SSOT files by category"
        echo "  check             Check SSOT file consistency"
        echo "  validate <file>   Validate SSOT file syntax"
        echo "  edit <file>       Edit SSOT file with locking"
        echo "  lock <file>       Lock SSOT file via agent coordination"
        echo "  unlock <file>     Unlock SSOT file"
        echo "  registry          Create SSOT registry JSON"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 check"
        echo "  $0 edit .env"
        echo "  $0 lock SSOT_LOCK.yml 'Updating SSOT definitions'"
        echo "  $0 registry"
        exit 1
        ;;
esac

