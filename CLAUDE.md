# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Systemd Service Monitor** - a web-based monitoring application for Linux systemd services. It provides a FastAPI backend with Next.js frontend to monitor, control, and manage systemd services on Linux systems.

## Tech Stack

- **Backend**: FastAPI (Python), SQLite, JWT authentication
- **Frontend**: Next.js 16.0.3, React 19.2.0, TypeScript, Tailwind CSS, shadcn/ui
- **Package Manager**: pnpm (frontend), pip (backend)
- **Server**: Uvicorn (ASGI)

## Development Commands

### Frontend Development
```bash
cd frontend
pnpm install          # Install dependencies
pnpm dev             # Start development server (port 3000)
pnpm build           # Build for production
pnpm lint            # Run ESLint
pnpm start           # Start production server
```

### Backend Development
```bash
# Create virtual environment (if not exists)
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic starlette

# Run development server
.venv/bin/python -m uvicorn routers.main:app --host 0.0.0.0 --port 6996 --reload
```

### Deployment
```bash
# Deploy to production (ports: backend 6996, frontend 6997)
./scripts/deploy.sh prod

# Deploy to formal environment (ports: backend 6994, frontend 6995)
./scripts/deploy.sh formal

# Stop all services
./scripts/stop.sh
```

## Architecture

### Backend Structure
- `routers/main.py`: Main FastAPI application with all API endpoints
- Authentication: JWT-based with role-based access (admin/user)
- Default users: admin/admin123 (admin), test/test123 (user)
- Service data stored in `monitored_services.json`
- User data stored in `users.db` (SQLite)

### Frontend Structure
- `frontend/app/`: Next.js app directory with pages
- `frontend/components/`: Reusable React components (shadcn/ui based)
- `frontend/lib/`: Utility functions and API client
- `frontend/hooks/`: Custom React hooks

### Key API Endpoints
- **Auth**: `/auth/token` (login), `/auth/me` (user info)
- **Services**: `/scan-services`, `/available-services`, `/service-status/{name}`
- **Monitoring**: `/monitored-services` (CRUD), `/monitored-status`
- **Control**: `/service-control/{service}/{action}` (admin only)
- **Logs**: `/service-logs/{service}`

### Authentication Flow
1. User logs in via `/auth/token` with username/password
2. JWT token returned (7-day expiration)
3. Token used in `Authorization: Bearer <token>` header for all requests
4. Role-based permissions: admin can control services, users can only view

## Development Guidelines

### Working with Systemd Services
- Service names can be provided with or without `.service` suffix
- Backend automatically handles `.service` suffix completion
- Service control operations require admin privileges
- All service operations use `sudo systemctl` commands

### Frontend API Integration
- API client in `frontend/lib/api.ts`
- Base URL configured via `NEXT_PUBLIC_API_URL` environment variable
- Authentication token stored in localStorage
- Auto-refresh logic for service status monitoring

### Error Handling
- 401: Authentication required/expired
- 403: Insufficient permissions (admin required)
- 404: Service or resource not found
- 408: Log retrieval timeout
- 500: Server error

### Security Considerations
- JWT secret should be set via `JWT_SECRET` environment variable in production
- Default secret "dev-secret" should never be used in production
- All service control operations require sudo privileges
- CORS is enabled for all origins in development