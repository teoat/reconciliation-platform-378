// ============================================================================
// EXAMPLE: Inline Comments for Complex Logic
// ============================================================================
// This file demonstrates how to add inline comments for complex logic
// Apply these patterns to other services with complex algorithms
// ============================================================================

/**
 * Example: Complex retry logic with inline comments
 * 
 * The retry mechanism uses exponential backoff with jitter to prevent
 * thundering herd problems when multiple clients retry simultaneously.
 * 
 * Algorithm:
 * 1. Calculate base delay: baseDelay * (backoffMultiplier ^ attempt)
 * 2. Cap at maxDelay to prevent excessive wait times
 * 3. Add jitter (random 0.5-1.0 multiplier) to spread out retries
 * 4. Floor to integer milliseconds for setTimeout
 */
function calculateDelayWithComments(attempt: number, config: RetryConfig): number {
  // Step 1: Calculate exponential backoff
  // Formula: delay = baseDelay * (multiplier ^ (attempt - 1))
  // Example: attempt 1 = 1000ms, attempt 2 = 2000ms, attempt 3 = 4000ms
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  
  // Step 2: Cap delay at maximum to prevent infinite wait times
  // This ensures we don't wait too long even after many retries
  delay = Math.min(delay, config.maxDelay);
  
  // Step 3: Add jitter to prevent synchronized retries
  // Jitter randomizes delay by 50-100% to spread out client retries
  // This prevents all clients from retrying at exactly the same time
  // (thundering herd problem)
  if (config.jitter) {
    // Random multiplier between 0.5 and 1.0
    // This means delay can be 50-100% of calculated value
    const jitterMultiplier = 0.5 + Math.random() * 0.5;
    delay = delay * jitterMultiplier;
  }
  
  // Step 4: Convert to integer milliseconds
  // setTimeout requires integer, so we floor the result
  return Math.floor(delay);
}

/**
 * Circuit Breaker Pattern Explanation:
 * 
 * The circuit breaker prevents cascading failures by "opening" the circuit
 * when too many failures occur, stopping requests temporarily.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are blocked immediately
 * - HALF-OPEN: Testing if service recovered, allows limited requests
 * 
 * Transition Logic:
 * CLOSED -> OPEN: When failure count >= threshold
 * OPEN -> HALF-OPEN: After recovery timeout expires
 * HALF-OPEN -> CLOSED: On successful request
 * HALF-OPEN -> OPEN: On failed request
 */
function circuitBreakerLogicWithComments(
  state: CircuitBreakerState,
  config: CircuitBreakerConfig,
  success: boolean
): CircuitBreakerState {
  if (state.state === 'closed') {
    // Normal operation - track failures
    if (!success) {
      state.failureCount++;
      
      // Check if we should open the circuit
      // This prevents overwhelming a failing service
      if (state.failureCount >= config.failureThreshold) {
        state.state = 'open';
        // Set recovery time - try again after timeout
        state.nextAttemptTime = new Date(
          Date.now() + config.recoveryTimeout
        );
      }
    } else {
      // Success - reset failure count
      // This allows the circuit to stay closed on intermittent failures
      state.failureCount = 0;
    }
  } else if (state.state === 'open') {
    // Circuit is open - check if recovery timeout expired
    // This allows us to test if the service has recovered
    if (state.nextAttemptTime && new Date() >= state.nextAttemptTime) {
      state.state = 'half-open';
      // Clear timeout - we're testing now
      state.nextAttemptTime = undefined;
    }
  } else if (state.state === 'half-open') {
    // Testing state - one request allowed
    if (success) {
      // Service recovered - close circuit
      state.state = 'closed';
      state.failureCount = 0;
    } else {
      // Still failing - open circuit again
      state.state = 'open';
      state.nextAttemptTime = new Date(
        Date.now() + config.recoveryTimeout
      );
    }
  }
  
  return state;
}

