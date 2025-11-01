// ============================================================================
// TYPESCRIPT CONFIGURATION OPTIMIZATION - SINGLE SOURCE OF TRUTH
// ============================================================================

// ============================================================================
// TYPESCRIPT CONFIG
// ============================================================================

export const typescriptConfig = {
  compilerOptions: {
    // Language and Environment
    target: 'ES2020',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    moduleResolution: 'node',
    
    // Modules
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    
    // Emit
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    removeComments: false,
    importHelpers: true,
    
    // Interop Constraints
    allowJs: true,
    checkJs: false,
    skipLibCheck: true,
    
    // Type Checking
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedIndexedAccess: true,
    noImplicitOverride: true,
    noPropertyAccessFromIndexSignature: true,
    
    // Completeness
    skipDefaultLibCheck: true,
    skipLibCheck: true,
    
    // Advanced
    exactOptionalPropertyTypes: true,
    noImplicitThis: true,
    useUnknownInCatchVariables: true,
  },
  
  include: [
    'src/**/*',
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx',
  ],
  
  exclude: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
  ],
  
  'ts-node': {
    esm: true,
    experimentalSpecifierResolution: 'node',
  },
}

// ============================================================================
// TYPE DEFINITION OPTIMIZATION
// ============================================================================

export const typeOptimizationConfig = {
  // Path mapping for cleaner imports
  paths: {
    '@/*': ['src/*'],
    '@/components/*': ['src/components/*'],
    '@/pages/*': ['src/pages/*'],
    '@/hooks/*': ['src/hooks/*'],
    '@/services/*': ['src/services/*'],
    '@/store/*': ['src/store/*'],
    '@/types/*': ['src/types/*'],
    '@/utils/*': ['src/utils/*'],
    '@/assets/*': ['src/assets/*'],
    '@/styles/*': ['src/styles/*'],
  },
  
  // Base URL for module resolution
  baseUrl: '.',
  
  // Type definitions to include
  types: [
    'node',
    'react',
    'react-dom',
    'jest',
    '@testing-library/jest-dom',
  ],
}

// ============================================================================
// TYPE GENERATION CONFIGURATION
// ============================================================================

export const typeGenerationConfig = {
  // API types generation
  apiTypes: {
    enabled: true,
    source: 'backend/schema',
    output: 'src/types/api.ts',
    format: 'typescript',
  },
  
  // GraphQL types generation
  graphqlTypes: {
    enabled: false,
    schema: 'schema.graphql',
    output: 'src/types/graphql.ts',
    plugins: ['typescript', 'typescript-operations'],
  },
  
  // OpenAPI types generation
  openApiTypes: {
    enabled: false,
    source: 'api-spec.yaml',
    output: 'src/types/openapi.ts',
    format: 'typescript',
  },
}

// ============================================================================
// TYPE VALIDATION RULES
// ============================================================================

export const typeValidationRules = {
  // Component props validation
  componentProps: {
    requireExplicitTypes: true,
    forbidAny: true,
    requireReadonlyProps: true,
    requireOptionalProps: true,
  },
  
  // Hook return types
  hookReturns: {
    requireExplicitReturnTypes: true,
    forbidImplicitAny: true,
    requireReadonlyReturns: true,
  },
  
  // API response types
  apiResponses: {
    requireGenericTypes: true,
    forbidAny: true,
    requireErrorHandling: true,
  },
  
  // State management types
  stateTypes: {
    requireImmutableTypes: true,
    forbidMutableState: true,
    requireActionTypes: true,
  },
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

// Utility types for common patterns
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
export type NonNullable<T> = T extends null | undefined ? never : T
export type ValueOf<T> = T[keyof T]
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

// Component prop utilities
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never
export type ComponentRef<T> = T extends React.ComponentType<any> 
  ? React.ComponentRef<T> 
  : never

// API utilities
export type ApiEndpoint<T = any> = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  params?: Record<string, any>
  body?: T
  response: any
}

export type ApiError = {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Form utilities
export type FormField<T = any> = {
  name: keyof T
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'date'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: any; label: string }>
  validation?: (value: any) => string | null
  defaultValue?: any
}

export type FormState<T = any> = {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
}

// Redux utilities
export type ReduxAction<T = any> = {
  type: string
  payload?: T
  meta?: any
  error?: boolean
}

export type ReduxState = {
  [key: string]: any
}

export type ReduxSelector<T = any> = (state: ReduxState) => T

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const typeGuards = {
  // Check if value is a string
  isString: (value: any): value is string => typeof value === 'string',
  
  // Check if value is a number
  isNumber: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  
  // Check if value is a boolean
  isBoolean: (value: any): value is boolean => typeof value === 'boolean',
  
  // Check if value is an object
  isObject: (value: any): value is object => typeof value === 'object' && value !== null,
  
  // Check if value is an array
  isArray: (value: any): value is any[] => Array.isArray(value),
  
  // Check if value is a function
  isFunction: (value: any): value is Function => typeof value === 'function',
  
  // Check if value is null or undefined
  isNullish: (value: any): value is null | undefined => value == null,
  
  // Check if value is not null or undefined
  isNotNullish: <T>(value: T | null | undefined): value is T => value != null,
}

// ============================================================================
// TYPE ASSERTIONS
// ============================================================================

export const typeAssertions = {
  // Assert that value is not null or undefined
  assertNotNull: <T>(value: T | null | undefined, message?: string): T => {
    if (value == null) {
      throw new Error(message || 'Value is null or undefined')
    }
    return value
  },
  
  // Assert that value is a string
  assertString: (value: any, message?: string): string => {
    if (typeof value !== 'string') {
      throw new Error(message || 'Value is not a string')
    }
    return value
  },
  
  // Assert that value is a number
  assertNumber: (value: any, message?: string): number => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(message || 'Value is not a number')
    }
    return value
  },
  
  // Assert that value is an object
  assertObject: (value: any, message?: string): object => {
    if (typeof value !== 'object' || value === null) {
      throw new Error(message || 'Value is not an object')
    }
    return value
  },
  
  // Assert that value is an array
  assertArray: (value: any, message?: string): any[] => {
    if (!Array.isArray(value)) {
      throw new Error(message || 'Value is not an array')
    }
    return value
  },
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export default {
  typescriptConfig,
  typeOptimizationConfig,
  typeGenerationConfig,
  typeValidationRules,
  typeGuards,
  typeAssertions,
}
