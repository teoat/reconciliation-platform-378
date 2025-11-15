// ============================================================================
// ESLINT SECURITY RULES
// ============================================================================
// Prevents unsafe eval/innerHTML usage and other security issues

module.exports = {
  extends: ['./.eslintrc.cjs'],
  rules: {
    // Prevent eval() usage
    'no-eval': 'error',
    'no-implied-eval': 'error',
    
    // Prevent dangerous innerHTML usage
    'react/no-danger': 'warn',
    
    // Prevent console usage in production code
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error'], // Only allow warn/error in development
      },
    ],
    
    // Security-related rules
    'no-new-func': 'error', // Prevent new Function()
    'no-script-url': 'error', // Prevent javascript: URLs
    
    // Prevent dangerous patterns
    'no-proto': 'error',
    'no-iterator': 'error',
    'no-caller': 'error',
    
    // Enforce secure coding practices
    'no-alert': 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Type safety
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
  },
  overrides: [
    {
      // Allow console in test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // Stricter rules for security-sensitive files
      files: [
        '**/security*.ts',
        '**/auth*.ts',
        '**/apiClient*.ts',
        '**/api*.ts',
      ],
      rules: {
        'no-console': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
};

