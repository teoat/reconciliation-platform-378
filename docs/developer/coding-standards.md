# Coding Standards

**Last Updated**: January 2025  
**Status**: Active

---

## TypeScript/React Standards

### Component Structure

```typescript
// ✅ DO: Functional components with hooks
export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<StateType>(initialState);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return <div>{/* JSX */}</div>;
};

// ❌ DON'T: Class components (unless necessary)
class MyComponent extends React.Component { }
```

### Type Safety

```typescript
// ✅ DO: Strong typing
interface User {
  id: number;
  email: string;
  name: string;
}

function getUser(id: number): Promise<User> { }

// ❌ DON'T: Any types
function getUser(id: any): any { }
```

### File Organization

- One component per file
- Co-locate related files (component + types + styles)
- Use absolute imports: `@/components/Button`
- Group imports: external → internal → types

---

## Rust Standards

### Error Handling

```rust
// ✅ DO: Use AppResult
pub fn process_data() -> AppResult<Data> {
    let result = some_operation()?;
    Ok(result)
}

// ❌ DON'T: Generic Result
pub fn process_data() -> Result<Data, Box<dyn std::error::Error>> { }
```

### Function Signatures

```rust
// ✅ DO: Proper closing parenthesis
pub fn example_function(param: String) -> AppResult<()> {
    // ...
}

// ❌ DON'T: Mismatched delimiters
pub fn example_function(param: String}) -> AppResult<()> { }
```

### Code Organization

- One responsibility per module
- Use `mod.rs` for module organization
- Group related functions together

---

## Naming Conventions

### TypeScript
- Components: `PascalCase` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase` starting with `use` (e.g., `useUserData.ts`)
- Utilities: `camelCase` (e.g., `formatDate.ts`)
- Types/Interfaces: `PascalCase` (e.g., `UserProfileProps`)

### Rust
- Modules: `snake_case.rs`
- Types: `PascalCase`
- Functions: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

---

## Code Quality

### File Size
- Target: <500 lines per file
- Maximum: 1000 lines (with justification)

### Complexity
- Cyclomatic complexity: <10 per function
- Maximum nesting: 4 levels

### Documentation
- Public functions: JSDoc/RustDoc required
- Complex logic: Inline comments explaining "why"
- TODO comments: Must include ticket reference

---

## Testing

### Coverage Targets
- Unit tests: 80%+ coverage
- Integration tests: Critical paths
- E2E tests: User journeys

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## Git Workflow

### Commit Messages
```bash
# ✅ DO: Conventional commits
git commit -s -m "feat(auth): Add JWT token refresh"
git commit -s -m "fix(api): Handle null response"

# ❌ DON'T: Vague messages
git commit -m "fix stuff"
```

### Branch Naming
- Features: `feature/description`
- Fixes: `fix/description`
- Hotfixes: `hotfix/description`

---

## Security

- Never commit secrets
- Validate all user input
- Use parameterized queries
- Mask PII in logs
- See [Security Guide](../security/) for details

---

## Performance

- Use `React.memo` for expensive components
- Lazy load routes and heavy components
- Optimize database queries
- Cache frequently accessed data

---

**Questions?** See [Troubleshooting Guide](./troubleshooting.md) or ask in team chat.

