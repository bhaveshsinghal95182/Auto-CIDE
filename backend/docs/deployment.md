# Deployment Guide

This document provides detailed instructions for deploying the Auto-CIDE backend to various environments, including development, staging, and production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
  - [Docker Deployment](#docker-deployment)
  - [Cloud Deployment](#cloud-deployment)
  - [Manual Deployment](#manual-deployment)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Security Considerations](#security-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Scaling](#scaling)
- [Continuous Integration/Deployment](#continuous-integrationdeployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the Auto-CIDE backend, ensure you have the following:

- Node.js (v16+)
- MongoDB (v4.4+)
- Redis (optional, for enhanced performance)
- Docker and Docker Compose (for containerized deployment)
- SSL certificate (for production)
- Domain name (for production)

## Environment Setup

### Development Environment

For local development:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/auto-cide.git
   cd auto-cide/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. Start MongoDB using Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb --rm mongo
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

### Staging/Production Environment

For staging or production environments, additional setup is required:

1. Set up a production-ready MongoDB instance:
   - Use MongoDB Atlas for cloud-hosted solution
   - Or set up a replica set for self-hosted solution

2. Set up Redis for caching (optional but recommended):
   - Use Redis Cloud for cloud-hosted solution
   - Or set up a Redis cluster for self-hosted solution

3. Configure environment variables for production:
   - Use secure JWT secrets
   - Set up proper MongoDB connection strings
   - Configure CORS settings

4. Set up SSL certificates for HTTPS

## Deployment Options

### Docker Deployment

Deploy using Docker and Docker Compose for containerized deployment:

1. Create a `Dockerfile` in the backend directory:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

2. Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/auto-cide
      - JWT_SECRET=your_production_secret
    depends_on:
      - mongo
      - redis
    restart: always

  mongo:
    image: mongo:4.4
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: always

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: always

volumes:
  mongo-data:
  redis-data:
```

3. Build and start the containers:

```bash
docker-compose up -d
```

### Cloud Deployment

#### AWS Deployment

1. **Elastic Beanstalk**:
   - Create a new Elastic Beanstalk application
   - Choose Node.js platform
   - Upload your application as a ZIP file
   - Configure environment variables in the Elastic Beanstalk console

2. **EC2 with Docker**:
   - Launch an EC2 instance
   - Install Docker and Docker Compose
   - Clone your repository
   - Run with Docker Compose as described above

#### Google Cloud Platform

1. **App Engine**:
   - Create an `app.yaml` file:
     ```yaml
     runtime: nodejs16
     env: standard
     instance_class: F2

     env_variables:
       NODE_ENV: "production"
       PORT: "8080"
       MONGODB_URI: "your_mongodb_uri"
       JWT_SECRET: "your_jwt_secret"
     ```
   - Deploy with gcloud:
     ```bash
     gcloud app deploy
     ```

2. **Cloud Run**:
   - Build and push your Docker image to Google Container Registry
   - Deploy to Cloud Run with environment variables

#### Heroku

1. Create a `Procfile` in the root directory:
   ```
   web: node server.js
   ```

2. Deploy to Heroku:
   ```bash
   heroku create
   git push heroku main
   ```

3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set MONGODB_URI=your_mongodb_uri
   ```

### Manual Deployment

For manual deployment on a VPS or dedicated server:

1. Set up a server with Node.js installed
2. Clone your repository
3. Install dependencies with `npm install --production`
4. Set up environment variables
5. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "auto-cide-backend"
   pm2 save
   pm2 startup
   ```

6. Set up Nginx as a reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. Set up SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

## Database Setup

### MongoDB Setup

1. **Development**: Use Docker container as described above

2. **Production**: Set up MongoDB Atlas or a self-hosted replica set
   - Create a new cluster in MongoDB Atlas
   - Set up network access and database users
   - Get the connection string and add it to your environment variables

3. **Database Initialization**:
   - The application will automatically create collections as needed
   - For initial data, you can create a seed script:
     ```javascript
     // scripts/seed.js
     import mongoose from 'mongoose';
     import User from '../models/user.model.js';
     import dotenv from 'dotenv';

     dotenv.config();

     const seedDatabase = async () => {
       try {
         await mongoose.connect(process.env.MONGODB_URI);
         console.log('Connected to MongoDB');

         // Clear existing data
         await User.deleteMany({});

         // Create admin user
         await User.create({
           email: 'admin@example.com',
           password: 'securepassword' // Will be hashed by pre-save hook
         });

         console.log('Database seeded successfully');
         process.exit(0);
       } catch (error) {
         console.error('Error seeding database:', error);
         process.exit(1);
       }
     };

     seedDatabase();
     ```

### Redis Setup (Optional)

1. **Development**: Use Docker container

2. **Production**: Set up Redis Cloud or a self-hosted Redis instance
   - Get the connection details and add them to your environment variables

## Environment Variables

Create a `.env` file with the following variables:

```
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://username:password@host:port/database

# Authentication
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRY=7d

# Redis Configuration (Optional)
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password

# Google AI API
GOOGLE_API_KEY=your_google_api_key

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
```

## Security Considerations

1. **Use HTTPS**: Always use HTTPS in production
2. **Secure JWT**: Use a strong, unique JWT secret
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Input Validation**: Validate all user inputs
5. **Dependency Security**: Regularly update dependencies
6. **Environment Variables**: Never commit sensitive environment variables
7. **Database Security**: Use strong passwords and restrict network access
8. **API Keys**: Protect API keys with proper access controls

## Monitoring and Logging

### Logging

1. Set up application logging:
   ```javascript
   // Add to server.js
   import winston from 'winston';

   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     defaultMeta: { service: 'auto-cide-backend' },
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });

   if (process.env.NODE_ENV !== 'production') {
     logger.add(new winston.transports.Console({
       format: winston.format.simple()
     }));
   }

   // Use logger throughout the application
   logger.info('Server started');
   ```

2. For production, consider using a logging service like:
   - AWS CloudWatch
   - Google Cloud Logging
   - Loggly
   - Papertrail

### Monitoring

1. **Health Checks**: Add a health check endpoint:
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).json({ status: 'ok' });
   });
   ```

2. **Performance Monitoring**:
   - Use New Relic or Datadog for application performance monitoring
   - Set up MongoDB monitoring
   - Monitor server resources (CPU, memory, disk)

3. **Uptime Monitoring**:
   - Use services like Uptime Robot or Pingdom
   - Set up alerts for downtime

## Scaling

### Horizontal Scaling

1. **Load Balancing**:
   - Use Nginx or HAProxy as a load balancer
   - For cloud deployments, use the platform's load balancing service

2. **Stateless Design**:
   - Ensure the application is stateless
   - Use Redis for session storage
   - Store file uploads in a service like S3

3. **Database Scaling**:
   - Use MongoDB replica sets for high availability
   - Consider sharding for very large datasets

### Vertical Scaling

1. **Increase Resources**:
   - Upgrade server CPU and memory
   - Optimize database performance

2. **Caching**:
   - Implement Redis caching for frequently accessed data
   - Use response caching for API endpoints

## Continuous Integration/Deployment

### GitHub Actions

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Deploy to production
        if: success()
        run: |
          # Add deployment commands here
          # For example, deploy to Heroku:
          # heroku container:push web -a your-app-name
          # heroku container:release web -a your-app-name
```

### Jenkins

Create a `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'npm run build'
                // Add deployment steps
            }
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Check MongoDB connection string
   - Verify network connectivity
   - Check firewall settings

2. **Authentication Problems**:
   - Verify JWT secret is correctly set
   - Check token expiration settings
   - Ensure cookies are being set correctly

3. **Performance Issues**:
   - Check database indexes
   - Monitor query performance
   - Implement caching for slow endpoints

### Debugging

1. **Enable Debug Logs**:
   ```bash
   DEBUG=* node server.js
   ```

2. **Check Application Logs**:
   ```bash
   tail -f combined.log
   ```

3. **Monitor Server Resources**:
   ```bash
   htop
   ```

4. **Check MongoDB Logs**:
   ```bash
   tail -f /var/log/mongodb/mongod.log
   ``` 