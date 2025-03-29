# Component Library Requirements

This document outlines the technical requirements for creating a React component library that will be compatible with our main application.

## Core Dependencies

Your component library should use these exact major versions to ensure compatibility:

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "typescript": "^4.9.5"
}
```

## Build System

We use Vite (v5.1.3) as our build tool. Your library should:
- Use `vite` for development
- Configure the library as a package that can be imported
- Export ES modules (use `"type": "module"` in package.json)

## TypeScript Configuration

Match these TypeScript configurations:
- Target ES Modules
- React 18 types: `@types/react`: "^18.2.0"
- Strict mode enabled

## UI Framework

We use Material-UI with these versions:
```json
{
  "@mui/material": "^5.11.16",
  "@mui/icons-material": "^5.11.16",
  "@emotion/react": "^11.10.6",
  "@emotion/styled": "^11.10.6"
}
```

If your components need Material-UI, use these exact versions to avoid duplicate installations.

## Testing Setup

Our testing stack includes:
```json
{
  "@testing-library/react": "^14.2.1",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.5.2",
  "vitest": "^1.2.2"
}
```

## Component Library Setup Recommendations

1. Initialize your project with:
```bash
npm create vite@latest my-component-lib -- --template react-ts
```

2. Configure your package.json:
```json
{
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

3. Export your components through an index.ts file:
```typescript
export { ComponentA } from './components/ComponentA';
export { ComponentB } from './components/ComponentB';
// ... other exports
```

4. Build Configuration:
Create a `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
```

## Development Workflow

1. Develop your components in isolation
2. Build your library: `npm run build`
3. Test integration by linking:
   ```bash
   cd your-component-lib
   npm link
   cd ../main-project
   npm link your-component-lib
   ```

## Notes

- Ensure all component props are properly typed with TypeScript
- Follow React 18 best practices
- Use named exports for components
- Avoid using React.FC (prefer regular function declarations)
- Include proper prop-types for runtime checking
- Document your components using JSDoc comments

## Known Issues or Gotchas

1. The main application uses IndexedDB (idb v8.0.2) - if your components need to interact with storage, coordinate with the main team
2. We use strict TypeScript settings - ensure your code compiles under strict mode
3. Material-UI components should be imported from @mui/material to ensure singleton usage
