# Job Timeout Implementation
**Date**: 2025-01-22  
**Status**: ✅ Implemented

## Overview

Implemented comprehensive timeout mechanisms to prevent reconciliation jobs from getting stuck indefinitely.

## Features Implemented

### 1. ✅ Job Timeout Configuration
- **Default Timeout**: 2 hours (7200 seconds)
- **Configurable**: Via `RECONCILIATION_JOB_TIMEOUT_SECONDS` environment variable
- **Location**: `backend/src/services/reconciliation/job_management.rs`

### 2. ✅ Timeout Monitoring
- **Background Monitor**: Runs every 60 seconds
- **Stuck Job Detection**: Checks jobs that exceed timeout duration
- **Automatic Cleanup**: Forces timeout on stuck jobs
- **Location**: `backend/src/services/reconciliation/mod.rs::start_timeout_monitor()`

### 3. ✅ Processing Timeout Wrapper
- **Timeout Protection**: Wraps job processing with `tokio::time::timeout`
- **Error Handling**: Returns clear error message when timeout exceeded
- **Location**: `backend/src/services/reconciliation/processing.rs`

### 4. ✅ Heartbeat Mechanism
- **Last Heartbeat Tracking**: Added `last_heartbeat` field to `JobStatus`
- **Automatic Updates**: Heartbeat updated during chunk processing
- **Location**: `backend/src/services/reconciliation/job_management.rs`

### 5. ✅ Job Start Timeout Monitor
- **Per-Job Monitor**: Each job gets its own timeout monitor task
- **Automatic Cleanup**: Monitors job and forces timeout if exceeded
- **Location**: `backend/src/services/reconciliation/service.rs::start_reconciliation_job()`

## Implementation Details

### JobProcessor Enhancements

```rust
pub struct JobProcessor {
    pub max_concurrent_jobs: usize,
    pub chunk_size: usize,
    pub job_timeout_seconds: u64,  // NEW: Timeout configuration
    pub active_jobs: Arc<RwLock<HashMap<Uuid, JobStatus>>>,
    pub job_queue: Arc<RwLock<Vec<Uuid>>>,
}
```

### New Methods

1. **`check_stuck_jobs()`**: Identifies jobs that have exceeded timeout
2. **`timeout_job()`**: Forces timeout on a stuck job
3. **`get_timeout_duration()`**: Returns timeout duration
4. **`heartbeat()`**: Updates job heartbeat timestamp

### JobStatus Enhancements

```rust
pub struct JobStatus {
    // ... existing fields ...
    pub last_heartbeat: Option<DateTime<Utc>>,  // NEW: Heartbeat tracking
}
```

## Configuration

### Environment Variable

```bash
# Set custom timeout (in seconds)
RECONCILIATION_JOB_TIMEOUT_SECONDS=3600  # 1 hour
```

### Default Behavior

- **Default Timeout**: 7200 seconds (2 hours)
- **Monitor Interval**: 60 seconds
- **Check Frequency**: Every minute

## Usage

### Automatic Timeout

Jobs automatically timeout if they exceed the configured duration:

```rust
// Job will timeout after 2 hours (default) or configured duration
let job_handle = service.job_processor.start_job(job_id).await;
// Background monitor will detect and timeout stuck jobs
```

### Manual Timeout Check

```rust
// Check for stuck jobs
let stuck_jobs = processor.check_stuck_jobs().await;

// Force timeout a specific job
processor.timeout_job(job_id).await?;
```

## Benefits

1. **Prevents Resource Leaks**: Stuck jobs are automatically cleaned up
2. **Better Monitoring**: Heartbeat tracking shows job activity
3. **Configurable**: Timeout can be adjusted per environment
4. **Automatic Recovery**: Background monitor handles stuck jobs automatically
5. **Clear Error Messages**: Timeout errors provide clear information

## Monitoring

The system logs timeout events:

```
WARN: Found 1 stuck job(s), forcing timeout
INFO: Successfully timed out stuck job <job_id>
ERROR: Failed to timeout stuck job <job_id>: <error>
```

## Testing

To test timeout behavior:

1. Set a short timeout: `RECONCILIATION_JOB_TIMEOUT_SECONDS=60`
2. Start a job that will take longer than 60 seconds
3. Monitor logs for timeout detection
4. Verify job is automatically timed out

## Related Files

- `backend/src/services/reconciliation/job_management.rs` - Core timeout logic
- `backend/src/services/reconciliation/mod.rs` - Background monitor
- `backend/src/services/reconciliation/service.rs` - Job start with timeout
- `backend/src/services/reconciliation/processing.rs` - Processing timeout wrapper

## Future Enhancements

- [ ] Configurable monitor interval
- [ ] Per-job timeout configuration
- [ ] Timeout notification system
- [ ] Metrics for timeout events
- [ ] Timeout retry mechanism


