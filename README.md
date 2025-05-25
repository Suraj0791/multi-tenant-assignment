# Multi-Tenant Task Management Platform

A full-stack MERN application implementing a multi-tenant task management system with role-based authentication and automated task expiry management.

## Features

### Core Features

1. **Multi-Tenant User Management**
   - Organization-based data isolation
   - Role-based authentication (Admin, Manager, Member)
   - User registration with organization creation/joining
   - Email invitation system
   - JWT-based authentication with RBAC

2. **Task Management**
   - CRUD operations for tasks
   - Task assignment system
   - Categories and priorities
   - Automated task expiry management
   - Overdue notifications

3. **Organization Management**
   - Statistical dashboard
   - Member management
   - Organization settings

## Tech Stack

- **Frontend**: React + Vite, Redux Toolkit, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Task Scheduling**: node-cron
- **Containerization**: Docker

## Project Structure

```
.
├── frontend/           # React + Vite frontend
├── backend/           # Node.js + Express backend
└── docker/            # Docker configuration files
```

## Prerequisites

- Node.js >= 16
- MongoDB >= 5.0
- Docker & Docker Compose
- npm or yarn

## Getting Started

1. Clone the repository
2. Setup environment variables (see .env.example files in both frontend and backend)
3. Run with Docker:
   ```bash
   docker-compose up
   ```

Or run locally:

1. Backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables

### Backend
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-secret-key
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

### Frontend
```
VITE_API_URL=http://localhost:5000
```

## API Documentation

Detailed API documentation can be found in the [backend/docs](./backend/docs) directory.

## Testing

Run tests using:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## License

MIT
