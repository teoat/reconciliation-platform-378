# Frenly AI Meta Agent System Documentation

## Overview

Frenly AI is a comprehensive meta agent integration that provides intelligent, contextual guidance throughout the reconciliation platform. It offers personalized assistance, progress tracking, and dynamic interactions to enhance user experience.

## Architecture

### Core Components

#### 1. **FrenlyProvider** (`frontend/src/components/frenly/FrenlyProvider.tsx`)
- **Purpose**: Central state management for Frenly AI
- **Features**:
  - Context-based state management
  - Progress tracking
  - Message management
  - Page navigation awareness
  - Preference management

**Key Functions**:
```typescript
- updateProgress(step: string): void
- showMessage(message: FrenlyMessage): void
- hideMessage(): void
- updatePage(page: string): void
- toggleVisibility(): void
- toggleMinimize(): void
- updatePreferences(preferences: Partial<Preferences>): void
```

#### 2. **FrenlyAI Component** (`frontend/src/components/FrenlyAI.tsx`)
- **Purpose**: Main visual interface for the AI assistant
- **Features**:
  - Animated avatar with dynamic expressions
  - Contextual speech bubbles
  - Progress indicator
  - Quick action buttons
  - Minimize/maximize controls

**Visual Elements**:
- Character avatar with eyes, mouth, and accessories
- Speech bubble with contextual messages
- Progress bar showing user completion
- Control panel with quick actions

#### 3. **FrenlyGuidance** (`frontend/src/components/frenly/FrenlyGuidance.tsx`)
- **Purpose**: Step-by-step guidance system
- **Features**:
  - Interactive step list
  - Progress tracking with percentages
  - Celebration animations
  - Contextual encouragement messages
  - Tutorial system

#### 4. **Type Definitions** (`frontend/src/types/frenly.ts`)
- Complete TypeScript type system
- Type-safe state management
- Message interface definitions
- Animation and expression types

## State Management

### FrenlyState Structure
```typescript
{
  isVisible: boolean           // UI visibility
  isMinimized: boolean        // UI minimize state
  currentPage: string         // Active page path
  userProgress: {
    completedSteps: string[]  // Array of completed step IDs
    currentStep: string       // Current active step
    totalSteps: number        // Total steps in workflow
  }
  personality: {
    mood: string              // Current emotional state
    energy: string            // Energy level (low/medium/high)
    helpfulness: number       // Helpfulness score (0-100)
  }
  preferences: {
    showTips: boolean         // Display contextual tips
    showCelebrations: boolean // Show celebration messages
    showWarnings: boolean     // Display warning messages
    voiceEnabled: boolean     // Voice interaction enabled
    animationSpeed: string    // Animation speed preference
  }
  conversationHistory: FrenlyMessage[]  // Message history
  activeMessage?: FrenlyMessage         // Currently displayed message
}
```

### Message System

#### Message Types
- **greeting**: Welcome messages for new pages
- **tip**: Helpful tips and suggestions
- **warning**: Important warnings and alerts
- **celebration**: Success and milestone celebrations
- **encouragement**: Motivational messages
- **instruction**: Step-by-step instructions
- **help**: Help and support messages
- **error**: Error notifications

#### Message Structure
```typescript
{
  id: string
  type: MessageType
  content: string
  timestamp: Date
  page: string
  priority: 'low' | 'medium' | 'high'
  dismissible: boolean
  autoHide?: number  // Auto-hide delay in ms
  action?: {
    text: string
    onClick: () => void
  }
}
```

## Page Integration

### Supported Pages
Frenly AI provides contextual guidance for all major workflow pages:

1. **Authentication** (`/auth`)
   - Login guidance
   - Security tips
   - Welcome messages

2. **Projects** (`/projects`)
   - Project creation tips
   - Template suggestions
   - Collaboration guidance

3. **Ingestion** (`/ingestion`)
   - File upload instructions
   - Data format tips
   - Processing guidance

4. **Reconciliation** (`/reconciliation`)
   - Matching rule configuration
   - Algorithm suggestions
   - Result interpretation

5. **Cashflow Evaluation** (`/cashflow-evaluation`)
   - Analysis guidance
   - Pattern recognition tips
   - Decision support

6. **Adjudication** (`/adjudication`)
   - Discrepancy resolution guidance
   - Priority management
   - Documentation tips

7. **Visualization** (`/visualization`)
   - Chart selection guidance
   - Data interpretation
   - Export options

8. **Presummary** (`/presummary`)
   - Review checklist
   - Quality assurance tips
   - Final verification

9. **Summary/Export** (`/summary`)
   - Report generation guidance
   - Export format selection
   - Completion celebration

### Contextual Message Generation

Messages are automatically generated based on:
- Current page
- User progress (0-100%)
- Completed steps
- User actions
- Time on page

**Message Selection Logic**:
```typescript
if (progress === 0) → greeting
if (progress === 100) → celebration
if (progress < 30) → instruction/tip
if (progress > 70) → encouragement
```

## Personality System

### Dynamic Expressions

The Frenly AI avatar displays different expressions based on context:

**Eyes**:
- happy, excited, calm, concerned, sleepy, surprised, wink, normal

**Mouth**:
- smile, big-smile, open, frown, neutral, laugh

**Accessories**:
- party-hat (celebrations)
- lightbulb (tips)
- star (encouragement)

### Mood Management

Mood changes based on:
- Message type
- User progress
- Time of day
- Interaction frequency

## User Interactions

### Visibility Controls
- **Toggle Visibility**: Show/hide the entire component
- **Minimize**: Collapse to avatar only
- **Expand**: Show full control panel

### Actions
- **Get Help**: Request contextual assistance
- **Toggle Tips**: Enable/disable tip display
- **Update Progress**: Mark steps as complete
- **Navigate Pages**: Move between workflow stages

## Integration Patterns

### Basic Integration
```typescript
import { FrenlyProvider } from './components/frenly/FrenlyProvider'
import FrenlyAI from './components/FrenlyAI'

function App() {
  return (
    <FrenlyProvider>
      <YourApp />
      <FrenlyAI 
        currentPage="/projects"
        userProgress={{
          completedSteps: [],
          currentStep: 'init',
          totalSteps: 8
        }}
      />
    </FrenlyProvider>
  )
}
```

### Using the Context
```typescript
import { useFrenly } from './components/frenly/FrenlyProvider'

function MyComponent() {
  const { state, updateProgress, showMessage } = useFrenly()
  
  const handleComplete = () => {
    updateProgress('step_completed')
    showMessage({
      id: 'success',
      type: 'celebration',
      content: 'Great job! Step completed!',
      timestamp: new Date(),
      page: '/current',
      priority: 'high',
      dismissible: true,
      autoHide: 3000
    })
  }
  
  return <button onClick={handleComplete}>Complete Step</button>
}
```

## Performance Optimizations

### Lazy Loading
Frenly AI components support lazy loading for optimal performance:
```typescript
import { LazyFrenlyAI, LazyFrenlyGuidance } from './utils/lazyLoading'
```

### Auto-hide Messages
Messages can auto-hide after a specified delay to avoid UI clutter:
```typescript
{
  autoHide: 5000  // Hide after 5 seconds
}
```

### Memoization
Components use React hooks for optimal re-rendering:
- `useCallback` for function memoization
- `useMemo` for computed values
- `useEffect` for side effects

## Accessibility

### ARIA Support
- All interactive elements have `aria-label` attributes
- Buttons have descriptive titles
- Focus management for keyboard navigation

### Keyboard Navigation
- Tab navigation support
- Enter/Space for button activation
- Escape to dismiss messages

## Testing

### Test Coverage
- Component rendering tests
- State management tests
- Integration tests
- Message system tests
- Personality system tests
- Error handling tests

### Running Tests
```bash
npm test -- --testPathPattern=frenly-ai
```

### Diagnostic Tool
```bash
node scripts/diagnose-frenly-ai.js
```

## Customization

### Theme Customization
Frenly AI uses Tailwind CSS classes for styling:
- Primary gradient: `from-purple-500 to-pink-500`
- Success color: `green-500`
- Warning color: `orange-500`
- Error color: `red-500`

### Message Customization
Add new page guidance by editing the `pageGuidance` object in `FrenlyAI.tsx`:
```typescript
const pageGuidance = {
  '/your-page': {
    greeting: "Welcome to your page!",
    tip: "Here's a helpful tip",
    warning: "Watch out for this",
    celebration: "You did it!"
  }
}
```

## Troubleshooting

### Common Issues

**1. Context not available**
- Error: "useFrenly must be used within a FrenlyProvider"
- Solution: Wrap your app with `<FrenlyProvider>`

**2. Messages not showing**
- Check if `isVisible` is true
- Verify message has valid content
- Check browser console for errors

**3. State not updating**
- Ensure Provider is at correct level in component tree
- Verify functions are being called correctly
- Check React DevTools for state changes

### Debug Mode
Enable debug logging:
```typescript
localStorage.setItem('frenly_debug', 'true')
```

## Best Practices

### 1. Message Timing
- Use `autoHide` for non-critical messages
- Keep celebrations visible longer (5s+)
- Make warnings dismissible but not auto-hide

### 2. Progress Tracking
- Update progress at meaningful milestones
- Keep totalSteps realistic (7-10 steps)
- Provide clear step names

### 3. Performance
- Use lazy loading for large apps
- Minimize state updates
- Memoize expensive computations

### 4. User Experience
- Match personality to user progress
- Provide contextual, not generic, guidance
- Allow users to control visibility

## Future Enhancements

### Planned Features
- [ ] Voice interaction support
- [ ] Multi-language support
- [ ] Advanced analytics integration
- [ ] Custom personality profiles
- [ ] AI-powered suggestions
- [ ] Integration with backend AI services

### Roadmap
- **Q1**: Voice interaction
- **Q2**: Multi-language support
- **Q3**: Advanced analytics
- **Q4**: AI backend integration

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Check existing documentation
- Run diagnostic tool for automated checks

## License

This component is part of the 378 Reconciliation Platform and follows the same license terms.

---

**Version**: 1.0.0
**Last Updated**: 2024-11-06
**Maintained By**: Development Team
