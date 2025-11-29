/**
 * Enhanced Calculation Parser
 * Supports complex expressions with +, -, *, /, parentheses, and variable substitution
 */

/**
 * Parse and evaluate a calculation expression
 * Supports: +, -, *, /, parentheses, and metric variable substitution
 * Uses a safe recursive descent parser instead of eval() to comply with CSP
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

    // Evaluate the expression safely using a recursive descent parser
    // This avoids using eval() or Function() constructor for CSP compliance
    const result = parseExpression(processedExpression.trim());
    
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid calculation result');
    }

    return result;
  } catch (error) {
    // Error is handled by returning 0 (safe default)
    // For production, consider integrating with error tracking service
    return 0;
  }
}

/**
 * Safe expression parser using recursive descent
 * Supports: numbers, +, -, *, /, parentheses
 */
function parseExpression(expr: string): number {
  let index = 0;
  
  function skipWhitespace(): void {
    while (index < expr.length && /\s/.test(expr[index])) {
      index++;
    }
  }
  
  function parseNumber(): number {
    skipWhitespace();
    let numStr = '';
    let hasDecimal = false;
    
    // Handle negative sign
    if (index < expr.length && expr[index] === '-') {
      numStr += '-';
      index++;
      skipWhitespace();
    }
    
    // Parse digits
    while (index < expr.length && /[0-9.]/.test(expr[index])) {
      if (expr[index] === '.') {
        if (hasDecimal) break;
        hasDecimal = true;
      }
      numStr += expr[index];
      index++;
    }
    
    const num = parseFloat(numStr);
    if (isNaN(num)) {
      throw new Error(`Invalid number at position ${index}`);
    }
    return num;
  }
  
  function parseExpr(): number {
    let result = parseTerm();
    
    skipWhitespace();
    while (index < expr.length && (expr[index] === '+' || expr[index] === '-')) {
      const op = expr[index];
      index++;
      skipWhitespace();
      
      const right = parseTerm();
      if (op === '+') {
        result += right;
      } else {
        result -= right;
      }
      skipWhitespace();
    }
    
    return result;
  }
  
  function parseTerm(): number {
    let result = parseFactor();
    
    skipWhitespace();
    while (index < expr.length && (expr[index] === '*' || expr[index] === '/')) {
      const op = expr[index];
      index++;
      skipWhitespace();
      
      const right = parseFactor();
      if (op === '*') {
        result *= right;
      } else {
        if (right === 0) {
          throw new Error('Division by zero');
        }
        result /= right;
      }
      skipWhitespace();
    }
    
    return result;
  }
  
  function parseFactor(): number {
    skipWhitespace();
    
    if (index >= expr.length) {
      throw new Error('Unexpected end of expression');
    }
    
    if (expr[index] === '(') {
      index++; // consume '('
      const result = parseExpr();
      skipWhitespace();
      if (index >= expr.length || expr[index] !== ')') {
        throw new Error('Missing closing parenthesis');
      }
      index++; // consume ')'
      return result;
    }
    
    if (expr[index] === '-') {
      index++;
      return -parseFactor();
    }
    
    if (expr[index] === '+') {
      index++;
      return parseFactor();
    }
    
    return parseNumber();
  }
  
  const result = parseExpr();
  skipWhitespace();
  
  if (index < expr.length) {
    throw new Error(`Unexpected character '${expr[index]}' at position ${index}`);
  }
  
  return result;
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

