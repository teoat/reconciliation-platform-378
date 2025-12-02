# lib-features

Feature flag management library for the Reconciliation Platform.

## Installation

```bash
npm install @reconciliation-platform/lib-features
```

## Usage

### Basic Usage

```tsx
import { isFeatureEnabled, initializeFeatureFlags } from '@reconciliation-platform/lib-features';

// Initialize with user context
initializeFeatureFlags({
  userId: 'user-123',
  email: 'user@example.com',
  role: 'admin',
  environment: 'production'
});

// Check if a feature is enabled
if (isFeatureEnabled('experimental_dashboard_v2')) {
  // Show new dashboard
}
```

### React Hooks

```tsx
import { 
  useFeatureFlag, 
  Feature,
  FeatureFlagProviderComponent 
} from '@reconciliation-platform/lib-features';

// Wrap your app with the provider
function App() {
  return (
    <FeatureFlagProviderComponent 
      context={{ userId: 'user-123', role: 'admin' }}
    >
      <Dashboard />
    </FeatureFlagProviderComponent>
  );
}

// Use the hook in components
function Dashboard() {
  const isDarkModeEnabled = useFeatureFlag('experimental_dark_mode');
  
  return (
    <div className={isDarkModeEnabled ? 'dark' : 'light'}>
      {/* Conditional rendering with Feature component */}
      <Feature flag="experimental_advanced_filters">
        <AdvancedFilters />
      </Feature>
    </div>
  );
}
```

### Override Flags for Testing

```tsx
import { useFeatureFlagOverrides } from '@reconciliation-platform/lib-features';

function FeatureDebugPanel() {
  const { overrides, setOverride, clearOverrides } = useFeatureFlagOverrides();
  
  return (
    <div>
      <button onClick={() => setOverride('experimental_dark_mode', true)}>
        Enable Dark Mode
      </button>
      <button onClick={clearOverrides}>Clear All Overrides</button>
    </div>
  );
}
```

## Available Feature Flags

### UI Features
- `experimental_dashboard_v2` - New dashboard layout
- `experimental_dark_mode` - Dark mode theme
- `experimental_advanced_filters` - Advanced filtering options

### Performance Features
- `enable_query_caching` - Query result caching
- `enable_lazy_loading` - Lazy loading for data sets
- `enable_virtual_scrolling` - Virtual scrolling for lists

### Backend Features
- `enable_async_reconciliation` - Async job processing
- `enable_batch_processing` - Batch file processing
- `enable_webhook_notifications` - Webhook notifications

### Security Features
- `enable_mfa` - Multi-factor authentication
- `enable_audit_logging` - Audit logging
- `enable_ip_whitelisting` - IP whitelisting

### Beta Features
- `beta_api_v3` - API v3 endpoints
- `beta_real_time_sync` - Real-time synchronization

## Configuration

```tsx
import { FeatureFlagProviderComponent } from '@reconciliation-platform/lib-features';

<FeatureFlagProviderComponent
  config={{
    sdkKey: 'your-optimizely-sdk-key',
    pollingInterval: 60,
    enableCache: true,
    cacheTTL: 300,
    debug: true
  }}
  context={{
    userId: 'user-123',
    role: 'admin'
  }}
>
  <App />
</FeatureFlagProviderComponent>
```

## Adding New Feature Flags

1. Add the flag definition in `src/flags.ts`:

```typescript
export const FEATURE_FLAGS = {
  // ... existing flags
  
  MY_NEW_FEATURE: {
    key: 'my_new_feature',
    name: 'My New Feature',
    description: 'Description of what this feature does',
    defaultValue: false,
    category: 'experimental',
    experimental: true,
    rolloutPercentage: 25
  }
};
```

2. Use it in your code:

```tsx
const isEnabled = useFeatureFlag('my_new_feature');
```

## License

MIT
