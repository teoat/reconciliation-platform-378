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
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/explicit-module-boundary-types": [
        "error",
        {
          "allowArgumentsExplicitlyTypedAsAny": false,
          "allowDirectConstAssertionInArrowFunctions": true,
          "allowHigherOrderFunctions": true,
          "allowTypedFunctionExpressions": true
        }
      ],
      "prefer-const": "error",
      "no-console": [
        "error",
        {
          "allow": ["warn", "error"]
        }
      ],
      "complexity": ["warn", 10],
      "import/no-duplicates": "error",
      "no-shadow": "error"
    }
  }
];