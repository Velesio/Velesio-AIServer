# VelesAI-Server Development Guide

## Build, Lint, Test Commands
- **Frontend**:
  - `cd shared/frontend && npm run dev` - Run development server
  - `cd shared/frontend && npm run build` - Build for production
  - `cd shared/frontend && npm run lint` - Run ESLint
  - `cd shared/frontend && npm run preview` - Preview production build

- **Backend**:
  - `cd shared/backend && uvicorn main:app --reload` - Run development server

## Code Style Guidelines
- **TypeScript/React**:
  - Use TypeScript for type safety
  - Follow React Hooks linting rules
  - Use functional components with hooks
  - Follow ESLint recommended configurations
  - Naming: camelCase for variables/functions, PascalCase for components

- **Python**:
  - Follow PEP 8 style guidelines
  - Use Python 3 type hints
  - Error handling: Use try/except with specific exceptions
  - Document functions with docstrings

- **General**:
  - Line length < 100 characters
  - Use consistent error logging patterns
  - Organize imports alphabetically