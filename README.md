# Multi-Tenant Task Management Platform

A full-stack MERN application implementing a multi-tenant task management system with role-based authentication and automated task expiry management.

## Features

### Application Workflow

1.  **User Registration:** New users can register to create an account.
2.  **Organization Creation:** Upon registration, the user can create a new organization.
3.  **Invitation Process:** To invite users to an organization:
    *   An admin can generate an invitation link.
    *   Users with the same organization cannot register unless they are invited.
    *   The invitation is sent via email using Resend.
    *   Due to the limitations of the Resend free tier plan, emails can only be sent to verified accounts.
    *   To access the invite link, check the console logs for the email content.
4.  **Tasks and Roles:**
    *   Tasks can be created, assigned, and managed within the organization.
    *   Role-based access control (RBAC) is implemented to manage permissions.
    *   Available roles: Admin, Manager, Member.


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
RESEND_API_KEY=


NODE_ENV=production
FRONTEND_URL=
```

### Frontend
```
VITE_API_URL=
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

## Deployment to Render

1.  Sign up for a Render account at [https://render.com](https://render.com).
2.  Connect your GitHub repository to Render.
3.  Render automatically builds and deploys your application.

   Live link: [https://multi-tenant-assignment.onrender.com/api](https://multi-tenant-assignment.onrender.com/api)

## Deployment to Netlify

1.  Sign up for a Netlify account at [https://www.netlify.com](https://www.netlify.com).
2.  Connect your GitHub repository to Netlify.
3.  Configure the build settings:
    *   Build command: `npm run build`
    *   Publish directory: `dist` (or the directory where your built frontend files are located)
4.  Netlify automatically builds and deploys your application.

   Live link: [https://beamish-sprite-716ffb.netlify.app/](https://beamish-sprite-716ffb.netlify.app/)

## CI/CD Pipeline with GitHub Actions

The project uses GitHub Actions for continuous integration and continuous deployment (CI/CD). The workflow is defined in `.github/workflows/main.yml`.

The following environment variables are used in the GitHub Actions workflow:

*   `NETLIFY_SITE_ID`: The ID of your Netlify site.
*   `NETLIFY_AUTH_TOKEN`: Your Netlify authentication token.
*   `VITE_API_URL`: The API URL for the frontend application.

These environment variables need to be configured in your GitHub repository settings (Settings -> Secrets -> Actions).

## License

MIT
