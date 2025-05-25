# Deployment Guide

## Quick Start with Netlify (Recommended)

The easiest way to deploy this application is using Netlify for the frontend and Railway for the backend, with MongoDB Atlas for the database.

### Frontend Deployment (Netlify)
1. Create a Netlify account at https://www.netlify.com
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Copy from `.env.example`

### Backend Deployment (Railway)
1. Create a Railway account at https://railway.app
2. Connect your GitHub repository
3. Add MongoDB service
4. Configure environment variables from `.env.example`
5. Deploy the backend service

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas account
2. Create a new cluster (free tier available)
3. Configure network access and database user
4. Get connection string and update backend environment variables

## Manual Deployment

### Prerequisites
- Node.js 18 or later
- Docker and Docker Compose
- MongoDB 4.4 or later
- Nginx (for production server)
- SSL certificate (recommended: Let's Encrypt)

### Server Setup
1. Update and install dependencies:
```bash
sudo apt update
sudo apt upgrade
sudo apt install -y docker.io docker-compose nginx certbot
```

2. Clone the repository:
```bash
git clone <repository-url>
cd multi-tenant-assignment
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your production values
```

4. Start the application:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### SSL Configuration
```bash
sudo certbot --nginx -d yourdomain.com
```

## Environment Variables

### Backend Variables
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| NODE_ENV | Environment | Yes | development | production |
| PORT | Server port | No | 5000 | 5000 |
| MONGODB_URI | Database URL | Yes | - | mongodb://user:pass@host:27017/db |
| JWT_SECRET | JWT signing key | Yes | - | your-secret-key |
| EMAIL_USER | SMTP username | Yes | - | user@example.com |
| EMAIL_PASS | SMTP password | Yes | - | your-password |
| MONGO_ROOT_USERNAME | MongoDB username | Yes | - | admin |
| MONGO_ROOT_PASSWORD | MongoDB password | Yes | - | secure_password |

### Frontend Variables
| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| VITE_API_URL | Backend API URL | Yes | - | https://api.yourdomain.com |

## Database Migrations

Create a new file `backend/src/migrations/setup.js`:
```javascript
import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';

export const up = async () => {
  // Create default roles
  await User.createIndexes();
  await Organization.createIndexes();
  
  // Create indexes for tasks
  await mongoose.connection.collection('tasks').createIndexes([
    { key: { organization: 1 } },
    { key: { assignedTo: 1 } },
    { key: { status: 1 } },
    { key: { dueDate: 1 } }
  ]);
};

export const down = async () => {
  await User.collection.dropIndexes();
  await Organization.collection.dropIndexes();
  await mongoose.connection.collection('tasks').dropIndexes();
};
```

To run migrations:
```bash
# From the backend directory
node src/migrations/setup.js
```

## CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/main.yml`:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install Dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci
      - name: Run Tests
        run: |
          cd frontend && npm test
          cd ../backend && npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        uses: railway/cli-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './frontend/dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Monitoring and Logging

### Application Monitoring
1. Set up MongoDB Atlas monitoring
2. Configure Railway logging
3. Set up Netlify monitoring

### Error Tracking
1. Add Sentry integration for error tracking
2. Configure error notifications

### Performance Monitoring
1. Set up performance monitoring in Railway
2. Configure Netlify analytics

## Backup and Recovery

### Database Backups
1. MongoDB Atlas automatic backups
2. Manual backup script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="./backups/backup_$DATE"
```

### Recovery Procedures
1. Restore from MongoDB Atlas backup
2. Manual restore:
```bash
mongorestore --uri="$MONGODB_URI" --dir="./backups/backup_$DATE"
```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use secrets management in CI/CD
   - Rotate secrets regularly

2. **API Security**
   - Rate limiting enabled
   - CORS configured properly
   - JWT tokens with expiration

3. **Database Security**
   - Strong passwords
   - Network access restrictions
   - Regular security updates

4. **Infrastructure Security**
   - Regular Docker image updates
   - Security group configurations
   - SSL/TLS certificates
