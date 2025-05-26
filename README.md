# Multi-Tenant Task Management Platform

A full-stack MERN application implementing a multi-tenant task management system with role-based authentication and automated task expiry management.

## Features

### Application Workflow

1.  **User Registration:** New users can register to create an account.
2.  **Organization Creation:** Upon registration, the user can create a new organization.
3.  **Invitation Process:** To invite users to an organization:
    - An admin can generate an invitation link.
    - Users with the same organization cannot register unless they are invited.
    - The invitation is sent via email using Resend.
    - Due to the limitations of the Resend free tier plan, emails can only be sent to verified accounts.
    - To access the invite link, check the console logs for the email content.
4.  **Tasks and Roles:**
    - Tasks can be created, assigned, and managed within the organization.
    - Role-based access control (RBAC) is implemented to manage permissions.
    - Available roles: Admin, Manager, Member.

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

### Key Technical Implementations

1. **Multi-tenant Architecture**

   - Organization-based data isolation
   - Secure data separation between organizations
   - Organization-specific settings and configurations
   - Middleware-enforced data access control
   - Organization-scoped API endpoints

2. **Task Expiry System**

   - Automated background jobs using node-cron
   - Hourly task status checks
   - Automatic task expiration handling
   - Email notifications for expired tasks
   - Task reminder system (24h before due date)
   - Status history tracking

3. **Role-Based Access Control (RBAC)**
   - Three-tier role system (Admin, Manager, Member)
   - Role hierarchy with permission inheritance
   - Granular access control for tasks and organizations
   - Protected routes and API endpoints
   - Frontend route protection
   - Task-specific permission checks

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

Render will handle backend deployments automatically

1.  Sign up for a Render account at [https://render.com](https://render.com).
2.  Connect your GitHub repository to Render.
3.  Render automatically builds and deploys your application.

Live link: [https://multi-tenant-assignment.onrender.com/api](https://multi-tenant-assignment.onrender.com/api)

## Deployment to Netlify

1.  Sign up for a Netlify account at [https://www.netlify.com](https://www.netlify.com).
2.  Connect your GitHub repository to Netlify.
3.  Configure the build settings:
    - Build command: `npm run build`
    - Publish directory: `dist` (or the directory where your built frontend files are located)
4.  Netlify automatically builds and deploys your application.

Live link: [https://beamish-sprite-716ffb.netlify.app/](https://beamish-sprite-716ffb.netlify.app/)

## CI/CD Pipeline with GitHub Actions

The project uses GitHub Actions for continuous integration and continuous deployment (CI/CD). The workflow is defined in `.github/workflows/main.yml`.

The following environment variables are used in the GitHub Actions workflow:

- `NETLIFY_SITE_ID`: The ID of your Netlify site.
- `NETLIFY_AUTH_TOKEN`: Your Netlify authentication token.
- `VITE_API_URL`: The API URL for the frontend application.

These environment variables need to be configured in your GitHub repository settings (Settings -> Secrets -> Actions).

## License

MIT

## Email Service Limitation

The application uses Resend's free tier for sending emails, which has the following limitation:

- Emails can only be sent to the account that Resend was created with

### Development Workaround

During development, when inviting new members:

1. The invite link will be logged to the console
2. You can find the invite link in the following format:
   ```
   === Invitation Link ===
   Email: [invitee's email]
   Role: [assigned role]
   Link: [invite link]
   =====================
   ```
3. Use this link to test the invitation flow

### Production Considerations

For production deployment:

1. Upgrade to a paid Resend plan, or
2. Switch to a different email service provider that supports sending to any email address

## Deployment Documentation

### Prerequisites

#### Server Requirements

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Git
- PM2 (for process management)
- Nginx (for reverse proxy)

#### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/multi-tenant-assignment.git
cd multi-tenant-assignment
```

2. Install dependencies for both frontend and backend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

#### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=your_mongodb_uri

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password

# Frontend URL (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env.production)

```env
VITE_API_URL=https://your-backend-domain.com/api
```

### CI/CD Pipeline Configuration

#### GitHub Actions Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy Application

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install Dependencies
        run: |
          cd backend
          npm install
          cd ../frontend
          npm install

      - name: Build Frontend
        run: |
          cd frontend
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}

      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/multi-tenant-assignment
            git pull
            cd backend
            npm install
            pm2 restart backend
            cd ../frontend
            npm install
            npm run build
```

### Server Setup Guide

1. **Install Node.js and MongoDB**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

2. **Install PM2**

```bash
npm install -g pm2
```

3. **Configure Nginx**

```nginx
# /etc/nginx/sites-available/multi-tenant-assignment
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/multi-tenant-assignment/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Enable the Nginx site**

```bash
sudo ln -s /etc/nginx/sites-available/multi-tenant-assignment /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. **Start the Application**

```bash
# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Start the backend with PM2
cd /var/www/multi-tenant-assignment/backend
pm2 start src/index.js --name "backend"
pm2 save
pm2 startup
```

### SSL Configuration

1. **Install Certbot**

```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. **Obtain SSL Certificate**

```bash
sudo certbot --nginx -d your-domain.com
```

### Monitoring and Maintenance

1. **View Application Logs**

```bash
# Backend logs
pm2 logs backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

2. **Monitor Application Status**

```bash
pm2 status
pm2 monit
```

3. **Database Backup**

```bash
# Create backup script
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/backup_$TIMESTAMP
```

### Troubleshooting

1. **Application Not Starting**

- Check PM2 logs: `pm2 logs backend`
- Verify environment variables
- Check MongoDB connection
- Ensure all dependencies are installed

2. **Nginx Issues**

- Check Nginx configuration: `sudo nginx -t`
- View error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify SSL certificate status: `sudo certbot certificates`

3. **Database Connection Issues**

- Verify MongoDB service status: `sudo systemctl status mongod`
- Check MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`
- Verify connection string in environment variables

### Security Considerations

1. **Firewall Configuration**

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

2. **Regular Updates**

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade

# Update Node.js dependencies
cd /var/www/multi-tenant-assignment/backend
npm audit fix
cd ../frontend
npm audit fix
```

3. **Backup Strategy**

- Daily database backups
- Weekly full system backups
- Monthly backup verification
