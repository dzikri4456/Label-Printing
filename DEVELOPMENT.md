# Development Guidelines

## Code Organization

### File Structure
- Keep files under 300 lines
- One component per file
- Co-locate tests with source files
- Use index.ts for public exports

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Types**: PascalCase (e.g., `UserProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

## TypeScript Guidelines

### Strict Mode
- Always use strict mode
- Avoid `any` - use `unknown` if type is truly unknown
- Use proper type guards for narrowing
- Prefer interfaces for object shapes
- Use type aliases for unions/intersections

### Example:
```typescript
// ❌ Bad
function process(data: any) {
  return data.value;
}

// ✅ Good
interface ProcessData {
  value: string;
}

function process(data: ProcessData): string {
  return data.value;
}
```

## React Guidelines

### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { useCustomHook } from './hooks';

// 2. Types
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({ title, onSubmit }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleClick = () => {};
  
  // 6. Effects
  useEffect(() => {}, []);
  
  // 7. Render
  return <div>{title}</div>;
};
```

### Hooks Rules
- Only call hooks at the top level
- Use custom hooks for reusable logic
- Keep hooks focused and single-purpose
- Add proper dependencies to useEffect

## Error Handling

### Always handle errors explicitly:
```typescript
try {
  await riskyOperation();
} catch (error) {
  Logger.error('Operation failed', error);
  // Handle gracefully
}
```

### Use Error Boundaries for React errors
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <MyComponent />
</ErrorBoundary>
```

## Testing Guidelines

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' };
    
    // Act
    render(<Component {...props} />);
    
    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### What to Test
- ✅ User interactions
- ✅ Edge cases
- ✅ Error scenarios
- ✅ Business logic
- ❌ Implementation details
- ❌ Third-party libraries

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation

### Commit Messages
Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

### Pull Requests
- Keep PRs focused and small
- Write descriptive titles
- Add context in description
- Link related issues
- Request reviews from team

## Performance

### Optimization Tips
- Use React.memo for expensive components
- Implement proper key props in lists
- Avoid inline function definitions in render
- Use lazy loading for routes
- Optimize images and assets

## Security

### Best Practices
- Never commit secrets
- Validate all user input
- Sanitize data before rendering
- Use environment variables for config
- Keep dependencies updated

## Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] No console.logs in production code
- [ ] Error handling is implemented
- [ ] Types are properly defined
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
