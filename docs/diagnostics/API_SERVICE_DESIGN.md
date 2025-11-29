# API Service Architecture Design

**Date**: 2025-01-15  
**Status**: Design Phase  
**Purpose**: Design unified API service architecture

---

## Design Goals

1. **Consistency**: All services follow same pattern
2. **Error Handling**: Unified error handling across services
3. **Response Transformation**: Standardized data extraction
4. **Retry Logic**: Automatic retry for transient failures
5. **Caching**: Service-level caching for performance

---

## Base API Service Class

### Architecture

```typescript
abstract class BaseApiService {
  // Error handling
  protected static async handleError<T>(
    error: unknown,
    context: ServiceContext
  ): Promise<ErrorHandlingResult<T>> {
    return handleServiceError(error, {
      component: context.component,
      action: context.action,
      ...context
    });
  }
  
  // Response transformation
  protected static transformResponse<T>(
    response: ApiResponse<T>,
    dataPath?: string
  ): T {
    if (response.error) {
      throw new Error(getErrorMessageFromApiError(response.error));
    }
    
    if (dataPath) {
      return getNestedValue(response.data, dataPath) as T;
    }
    
    return response.data as T;
  }
  
  // Pagination transformation
  protected static transformPaginatedResponse<T>(
    response: ApiResponse<PaginatedResponse<T>>
  ): PaginatedResult<T> {
    const data = this.transformResponse(response);
    return {
      items: data.data || [],
      pagination: data.pagination || this.createDefaultPagination()
    };
  }
  
  // Retry logic
  protected static async withRetry<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    return retryService.execute(operation, options);
  }
  
  // Caching
  protected static async getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    return cacheService.getOrSet(key, fetcher, ttl);
  }
}
```

---

## Service Implementation Pattern

### Example: UsersApiService

```typescript
export class UsersApiService extends BaseApiService {
  static async getUsers(
    params: GetUsersParams = {}
  ): Promise<ErrorHandlingResult<PaginatedResult<User>>> {
    return this.withErrorHandling(
      async () => {
        const cacheKey = `users:${JSON.stringify(params)}`;
        
        return this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.getUsers(
              params.page,
              params.per_page
            );
            
            return this.transformPaginatedResponse<User>(response);
          },
          300000 // 5 minutes TTL
        );
      },
      {
        component: 'UsersApiService',
        action: 'getUsers',
        projectId: params.projectId
      }
    );
  }
  
  static async getUserById(
    userId: string
  ): Promise<ErrorHandlingResult<User>> {
    return this.withErrorHandling(
      async () => {
        const cacheKey = `user:${userId}`;
        
        return this.getCached(
          cacheKey,
          async () => {
            const response = await apiClient.getUserById(userId);
            return this.transformResponse<User>(response);
          },
          600000 // 10 minutes TTL
        );
      },
      {
        component: 'UsersApiService',
        action: 'getUserById',
        userId
      }
    );
  }
}
```

---

## Error Handling Standardization

### Pattern: ErrorHandlingResult

**All services return `ErrorHandlingResult<T>`**:

```typescript
interface ErrorHandlingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  correlationId?: string;
}
```

### Usage

```typescript
const result = await UsersApiService.getUsers();
if (result.success) {
  // Use result.data
  const users = result.data.items;
} else {
  // Handle error
  toast.error(result.error);
  logger.error('Failed to fetch users', {
    errorCode: result.errorCode,
    correlationId: result.correlationId
  });
}
```

---

## Response Transformation

### Standard Data Paths

```typescript
const DATA_PATHS = {
  users: 'items',
  projects: 'data',
  reconciliation: 'data',
  files: 'data'
};
```

### Transformation Logic

```typescript
protected static transformResponse<T>(
  response: ApiResponse<T>,
  dataPath?: string
): T {
  if (response.error) {
    throw new Error(getErrorMessageFromApiError(response.error));
  }
  
  // Use dataPath if provided, otherwise use response.data directly
  if (dataPath && response.data) {
    const data = (response.data as Record<string, unknown>)[dataPath];
    return data as T;
  }
  
  return response.data as T;
}
```

---

## Retry Logic

### Configuration

```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    'ERR_NETWORK',
    'ERR_TIMEOUT',
    'ERR_SERVICE_UNAVAILABLE'
  ]
};
```

### Implementation

```typescript
protected static async withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  return retryService.execute(operation, {
    maxRetries: finalConfig.maxRetries,
    baseDelay: finalConfig.baseDelay,
    maxDelay: finalConfig.maxDelay,
    backoffFactor: finalConfig.backoffFactor,
    retryCondition: (error) => {
      const errorCode = extractErrorCode(error);
      return finalConfig.retryableErrors.includes(errorCode);
    }
  });
}
```

---

## Caching Strategy

### Cache Keys

```typescript
function getCacheKey(service: string, action: string, params: unknown): string {
  const paramsHash = hashObject(params);
  return `${service}:${action}:${paramsHash}`;
}
```

### Cache TTL

```typescript
const CACHE_TTL = {
  users: 300000,        // 5 minutes
  projects: 600000,     // 10 minutes
  reconciliation: 60000, // 1 minute (frequently updated)
  files: 300000         // 5 minutes
};
```

### Cache Invalidation

```typescript
protected static invalidateCache(pattern: string): void {
  cacheService.invalidate(pattern);
}

// Usage
static async updateUser(userId: string, data: UserUpdate): Promise<...> {
  const result = await this.withErrorHandling(...);
  
  // Invalidate user cache
  this.invalidateCache(`user:${userId}`);
  this.invalidateCache('users:*');
  
  return result;
}
```

---

## Migration Plan

### Phase 1: Create Base Class

1. Create `BaseApiService` class
2. Implement error handling methods
3. Implement response transformation
4. Implement retry logic
5. Implement caching

### Phase 2: Migrate Services

1. Update `AuthApiService` (already uses ErrorHandlingResult)
2. Update `UsersApiService`
3. Update `ProjectsApiService`
4. Update `ReconciliationApiService`
5. Update `FilesApiService`

### Phase 3: Standardize Responses

1. Standardize pagination format
2. Standardize error responses
3. Update API client if needed

### Phase 4: Add Features

1. Add retry logic to all services
2. Add caching to GET requests
3. Add cache invalidation to mutations

---

## Implementation Checklist

- [ ] Create BaseApiService class
- [ ] Implement error handling methods
- [ ] Implement response transformation
- [ ] Implement retry logic
- [ ] Implement caching
- [ ] Migrate AuthApiService
- [ ] Migrate UsersApiService
- [ ] Migrate ProjectsApiService
- [ ] Migrate ReconciliationApiService
- [ ] Migrate FilesApiService
- [ ] Add tests
- [ ] Update documentation

---

**Status**: Design complete, ready for implementation

