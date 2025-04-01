# VelesAI-Server Development Guide

## Build & Development Commands
- Start frontend dev server: `cd shared/frontend && npm run dev`
- Build frontend: `cd shared/frontend && npm run build`
- Lint frontend: `cd shared/frontend && npm run lint`
- Preview frontend build: `cd shared/frontend && npm run preview`
- Start backend server: `cd shared/backend && uvicorn main:app --reload`

## Code Style Guidelines
### Frontend
- Use TypeScript for type safety
- Components use functional style with React hooks
- State management with useState/useEffect
- Naming: PascalCase for components, camelCase for variables/functions
- Error handling: try/catch blocks with specific error messages
- Prefer explicit typing over 'any'
- Import order: React, external libraries, internal components/utils

### Backend
- Python FastAPI REST architecture
- Use async/await for endpoint handlers
- Error handling: raise HTTPException with status codes
- Logging: Use built-in logger with appropriate levels
- API response structure: {status, data/message}
- Use type hints when defining functions

### Project Organization
- Frontend: React with TypeScript in /shared/frontend
- Backend: Python FastAPI in /shared/backend
- Docker-based deployment with docker-compose