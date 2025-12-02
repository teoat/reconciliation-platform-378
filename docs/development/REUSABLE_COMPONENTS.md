# Reusable Components Guide

## Overview

This guide documents the reusable components available in the Reconciliation Platform, designed for modularity and ease of use across different parts of the application.

## Frontend Components

### Component Library Structure

```
frontend/src/components/
├── common/                    # Shared components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Modal/
│   ├── Table/
│   ├── Form/
│   └── ...
├── features/                  # Feature-specific components
│   ├── reconciliation/
│   ├── projects/
│   └── dashboard/
└── layouts/                   # Layout components
    ├── MainLayout/
    ├── AuthLayout/
    └── DashboardLayout/
```

### Common UI Components

#### Button

```tsx
import { Button } from '@/components/common/Button';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button loading>Loading</Button>
<Button disabled>Disabled</Button>

// With icons
<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>
```

#### Modal

```tsx
import { Modal, useModal } from '@/components/common/Modal';

function MyComponent() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <Button onClick={open}>Open Modal</Button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={close}
        title="Confirm Action"
        size="md"
      >
        <Modal.Body>
          Are you sure you want to proceed?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

#### DataTable

```tsx
import { DataTable } from '@/components/common/Table';

const columns = [
  { key: 'id', header: 'ID', sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status', render: StatusBadge },
  { key: 'actions', header: '', render: ActionsMenu },
];

<DataTable
  columns={columns}
  data={reconciliations}
  loading={isLoading}
  pagination={{
    page: 1,
    pageSize: 25,
    total: 100,
    onPageChange: handlePageChange,
  }}
  sorting={{
    field: 'createdAt',
    direction: 'desc',
    onSort: handleSort,
  }}
  selection={{
    selected: selectedIds,
    onSelect: handleSelect,
  }}
  emptyState={<EmptyReconciliations />}
/>
```

#### Form Components

```tsx
import { Form, Input, Select, DatePicker, Checkbox } from '@/components/common/Form';

<Form onSubmit={handleSubmit} validationSchema={schema}>
  <Form.Field name="name" label="Name" required>
    <Input placeholder="Enter name" />
  </Form.Field>
  
  <Form.Field name="status" label="Status">
    <Select options={statusOptions} />
  </Form.Field>
  
  <Form.Field name="dateRange" label="Date Range">
    <DatePicker range />
  </Form.Field>
  
  <Form.Field name="active" label="">
    <Checkbox label="Active" />
  </Form.Field>
  
  <Form.Actions>
    <Button type="submit">Submit</Button>
  </Form.Actions>
</Form>
```

### Feature Components

#### ReconciliationCard

```tsx
import { ReconciliationCard } from '@/components/features/reconciliation';

<ReconciliationCard
  reconciliation={recon}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onRun={handleRun}
  showActions
  compact={false}
/>
```

#### MatchingRuleBuilder

```tsx
import { MatchingRuleBuilder } from '@/components/features/reconciliation';

<MatchingRuleBuilder
  initialRules={rules}
  sourceFields={sourceFields}
  targetFields={targetFields}
  onChange={handleRulesChange}
  onValidate={handleValidate}
/>
```

### Hooks

#### useAsync

```tsx
import { useAsync } from '@/hooks/useAsync';

function MyComponent() {
  const { data, loading, error, execute } = useAsync(
    () => api.getReconciliations(),
    { immediate: true }
  );

  return loading ? <Spinner /> : <ReconciliationList data={data} />;
}
```

#### usePagination

```tsx
import { usePagination } from '@/hooks/usePagination';

function MyComponent() {
  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    paginatedData,
    totalPages,
  } = usePagination(data, { initialPageSize: 25 });

  return (
    <>
      <List data={paginatedData} />
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </>
  );
}
```

#### useDebounce

```tsx
import { useDebounce } from '@/hooks/useDebounce';

function SearchInput() {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (debouncedValue) {
      search(debouncedValue);
    }
  }, [debouncedValue]);

  return <Input value={value} onChange={e => setValue(e.target.value)} />;
}
```

## Backend Components

### Service Pattern

```rust
// Reusable service trait
#[async_trait]
pub trait CrudService<T, CreateInput, UpdateInput> {
    async fn create(&self, input: CreateInput) -> Result<T>;
    async fn get(&self, id: Uuid) -> Result<Option<T>>;
    async fn list(&self, params: ListParams) -> Result<Vec<T>>;
    async fn update(&self, id: Uuid, input: UpdateInput) -> Result<T>;
    async fn delete(&self, id: Uuid) -> Result<()>;
}

// Implementation
impl CrudService<Reconciliation, CreateReconciliationInput, UpdateReconciliationInput> 
    for ReconciliationService 
{
    // ...
}
```

### Repository Pattern

```rust
// Generic repository
pub struct Repository<T> {
    pool: PgPool,
    _marker: PhantomData<T>,
}

impl<T: Model> Repository<T> {
    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<T>> {
        sqlx::query_as::<_, T>(&format!(
            "SELECT * FROM {} WHERE id = $1",
            T::table_name()
        ))
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(Into::into)
    }

    pub async fn find_all(&self, params: QueryParams) -> Result<Vec<T>> {
        // Implementation with filtering, sorting, pagination
    }
}
```

### Middleware Components

```rust
// Authentication middleware
pub async fn auth_middleware<B>(
    State(state): State<AppState>,
    request: Request<B>,
    next: Next<B>,
) -> Result<Response, AuthError> {
    let token = extract_token(&request)?;
    let claims = validate_token(&state.jwt_secret, &token)?;
    
    // Add user to request extensions
    request.extensions_mut().insert(claims);
    
    Ok(next.run(request).await)
}

// Rate limiting middleware
pub fn rate_limiter(limit: u32, window: Duration) -> RateLimiter {
    RateLimiter::new(limit, window)
}

// Request logging middleware
pub fn request_logger() -> tower_http::trace::TraceLayer<...> {
    tower_http::trace::TraceLayer::new_for_http()
        .make_span_with(|request: &Request<_>| {
            tracing::info_span!(
                "http_request",
                method = %request.method(),
                path = %request.uri().path(),
            )
        })
}
```

### Error Handling

```rust
// Unified error type
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Unauthorized")]
    Unauthorized,
    
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::NotFound(_) => (StatusCode::NOT_FOUND, self.to_string()),
            AppError::Validation(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, self.to_string()),
            AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error".into()),
        };
        
        (status, Json(ErrorResponse { error: message })).into_response()
    }
}
```

### Validation Components

```rust
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateReconciliationInput {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    
    #[validate(email)]
    pub owner_email: String,
    
    #[validate(range(min = 1, max = 1000000))]
    pub batch_size: u32,
}

// Validation middleware
pub async fn validate_body<T: Validate + DeserializeOwned>(
    Json(body): Json<T>,
) -> Result<Json<T>, ValidationError> {
    body.validate()?;
    Ok(Json(body))
}
```

## Shared Utilities

### Date/Time Utilities

```typescript
// frontend/src/utils/date.ts
export const formatDate = (date: Date, format: string): string => {...};
export const parseDate = (dateString: string): Date => {...};
export const getRelativeTime = (date: Date): string => {...};
export const isWithinRange = (date: Date, start: Date, end: Date): boolean => {...};
```

```rust
// backend/src/utils/date.rs
pub fn format_date(date: DateTime<Utc>, format: &str) -> String {...}
pub fn parse_date(date_str: &str) -> Result<DateTime<Utc>> {...}
pub fn get_date_range(period: Period) -> (DateTime<Utc>, DateTime<Utc>) {...}
```

### Validation Utilities

```typescript
// frontend/src/utils/validation.ts
export const isValidEmail = (email: string): boolean => {...};
export const isValidUrl = (url: string): boolean => {...};
export const sanitizeInput = (input: string): string => {...};
export const validateRequired = (value: unknown): boolean => {...};
```

### API Client

```typescript
// frontend/src/services/api.ts
import { ApiClient } from '@/utils/apiClient';

export const reconciliationApi = {
  list: (params: ListParams) => ApiClient.get('/reconciliations', { params }),
  get: (id: string) => ApiClient.get(`/reconciliations/${id}`),
  create: (data: CreateInput) => ApiClient.post('/reconciliations', data),
  update: (id: string, data: UpdateInput) => ApiClient.put(`/reconciliations/${id}`, data),
  delete: (id: string) => ApiClient.delete(`/reconciliations/${id}`),
};
```

## Best Practices

1. **Single Responsibility**: Each component does one thing well
2. **Composition over Inheritance**: Build complex UIs from simple components
3. **Props over State**: Prefer controlled components
4. **Type Safety**: Use TypeScript/Rust types everywhere
5. **Documentation**: Include JSDoc/rustdoc for all public APIs
6. **Testing**: Every component has tests
7. **Accessibility**: Follow WCAG guidelines
8. **Performance**: Memoize expensive operations
