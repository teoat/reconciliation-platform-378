/**
 * Enhanced Calculation Parser
 * Supports complex expressions with +, -, *, /, parentheses, and variable substitution
 */

/**
 * Parse and evaluate a calculation expression
 * Supports: +, -, *, /, parentheses, and metric variable substitution
 */
export function evaluateCalculation(
  expression: string,
  variables: Record<string, number>
): number {
  try {
    // Replace variable names with their values
    let processedExpression = expression;
    for (const [varName, value] of Object.entries(variables)) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      processedExpression = processedExpression.replace(regex, String(value));
    }

    // Validate expression contains only safe characters
    if (!/^[0-9+\-*/().\s]+$/.test(processedExpression)) {
      throw new Error('Invalid characters in expression');
    }

    // Evaluate the expression safely
    // Note: In production, use a proper expression parser library
    // For now, we'll use Function constructor with validation
    const result = Function(`"use strict"; return (${processedExpression})`)();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid calculation result');
    }

    return result;
  } catch (error) {
    console.error('Error evaluating calculation:', error);
    return 0;
  }
}

/**
 * Validate calculation expression syntax
 */
export function validateCalculation(expression: string): { valid: boolean; error?: string } {
  if (!expression || expression.trim().length === 0) {
    return { valid: false, error: 'Expression is empty' };
  }

  // Check for balanced parentheses
  let depth = 0;
  for (const char of expression) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (depth < 0) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }
  }
  if (depth !== 0) {
    return { valid: false, error: 'Unbalanced parentheses' };
  }

  // Check for valid characters
  if (!/^[a-zA-Z0-9+\-*/().\s/]+$/.test(expression)) {
    return { valid: false, error: 'Invalid characters in expression' };
  }

  return { valid: true };
}

