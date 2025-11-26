/**
 * Enhanced ESLint Configuration for Safe Refactoring
 * 
 * This configuration adds stricter rules to prevent regressions during refactoring.
 * Use this config when refactoring files to ensure no breaking changes.
 */

import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/backend/**",
      "**/frontend/node_modules/**",
      "**/frontend/.next/**",
      "**/frontend/dist/**",
      "**/frontend/build/**",
      "**/.git/**",
      "**/jest.config.js",
      "**/playwright.config.ts"
    ]
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // ============================================================================
      // REFACTORING SAFETY RULES
      // ============================================================================
      
      // Prevent removing used exports
      "@typescript-eslint/no-unused-exports": [
        "error",
        {
          "unusedEnums": true,
          "unusedTypedefs": true,
          "unusedVars": false // Handled by no-unused-vars
        }
      ],

      // Prevent circular dependencies
      "import/no-cycle": [
        "error",
        {
          "maxDepth": 3,
          "ignoreExternal": true
        }
      ],

      // Prevent importing from refactored internals
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["**/*.internal", "**/*.private", "**/internal/**"],
              "message": "Do not import from internal/private modules. Use public API instead."
            }
          ]
        }
      ],

      // Ensure explicit module boundary types
      "@typescript-eslint/explicit-module-boundary-types": [
        "warn",
        {
          "allowArgumentsExplicitlyTypedAsAny": false,
          "allowDirectConstAssertionInArrowFunctions": true,
          "allowHigherOrderFunctions": true,
          "allowTypedFunctionExpressions": true
        }
      ],

      // Prevent any types
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          "fixToUnknown": true,
          "ignoreRestArgs": false
        }
      ],

      // Prevent unused variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_"
        }
      ],

      // Prevent empty object types
      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          "allowInterfaces": "always"
        }
      ],

      // Prevent require imports
      "@typescript-eslint/no-require-imports": "error",

      // Prevent unsafe function types
      "@typescript-eslint/no-unsafe-function-type": "error",

      // Prevent unused expressions
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          "allowShortCircuit": true,
          "allowTernary": true,
          "allowTaggedTemplates": true
        }
      ],

      // ============================================================================
      // CODE QUALITY RULES
      // ============================================================================

      // Prefer const
      "prefer-const": "error",

      // No console (use logger)
      "no-console": [
        "warn",
        {
          "allow": ["warn", "error"]
        }
      ],

      // No debugger
      "no-debugger": "error",

      // No alert
      "no-alert": "error",

      // No empty functions
      "@typescript-eslint/no-empty-function": [
        "warn",
        {
          "allow": ["arrowFunctions", "functions", "methods"]
        }
      ],

      // Consistent return
      "consistent-return": [
        "error",
        {
          "treatUndefinedAsUnspecified": true
        }
      ],

      // ============================================================================
      // TYPE SAFETY RULES
      // ============================================================================

      // Prefer nullish coalescing
      "@typescript-eslint/prefer-nullish-coalescing": "warn",

      // Prefer optional chain
      "@typescript-eslint/prefer-optional-chain": "error",

      // No non-null assertion
      "@typescript-eslint/no-non-null-assertion": "warn",

      // No unnecessary type assertion
      "@typescript-eslint/no-unnecessary-type-assertion": "error",

      // ============================================================================
      // IMPORT RULES
      // ============================================================================

      // No duplicate imports
      "no-duplicate-imports": "error",

      // Import order
      "import/order": [
        "warn",
        {
          "groups": [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "newlines-between": "always",
          "alphabetize": {
            "order": "asc",
            "caseInsensitive": true
          }
        }
      ],

      // No default export (prefer named exports for refactoring safety)
      "import/no-default-export": "off", // Keep default exports for components

      // ============================================================================
      // REACT RULES
      // ============================================================================

      // React hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React prop types
      "react/prop-types": "off", // Using TypeScript

      // ============================================================================
      // ACCESSIBILITY RULES
      // ============================================================================

      // JSX accessibility
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error"
    }
  },
  // ============================================================================
  // REFACTORING-SPECIFIC OVERRIDES
  // ============================================================================
  {
    files: ["**/*.refactor.{ts,tsx}", "**/refactoring/**/*.{ts,tsx}"],
    rules: {
      // Even stricter rules for refactoring files
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "import/no-cycle": ["error", { "maxDepth": 2 }]
    }
  }
];


