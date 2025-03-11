<p align="center">
  <img src="https://via.placeholder.com/200x200.png?text=Auto-CIDE" alt="Auto-CIDE Logo" width="200" height="200">
</p>

<h1 align="center">Auto-CIDE</h1>

<p align="center">
  <strong>An AI-powered Collaborative Integrated Development Environment</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#prerequisites">Prerequisites</a> •
  <a href="#installation">Installation</a> •
  <a href="#running-the-application">Running the Application</a> •
  <a href="#troubleshooting">Troubleshooting</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/pnpm-supported-blueviolet" alt="PNPM">
</p>

---

## Features

Auto-CIDE is a modern collaborative integrated development environment that combines the power of AI with real-time collaboration features:

- 🤖 **AI-Powered Assistance**: Get intelligent code suggestions and answers to your programming questions
- 👥 **Real-time Collaboration**: Code together with your team in real-time
- 🌐 **WebContainer Support**: Run your code directly in the browser
- 🔄 **Socket.IO Integration**: Enjoy seamless real-time updates across all connected clients
- 🧩 **Monaco Editor**: Professional code editing experience with syntax highlighting and IntelliSense

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [PNPM](https://pnpm.io/) (recommended package manager)
- [Docker](https://www.docker.com/) (for MongoDB container)
- [MongoDB](https://www.mongodb.com/) (automatically set up with Docker)
- [Redis](https://redis.io/) (optional, for enhanced caching)

## Docker Deployment

You can run the entire application (both frontend and backend) using Docker:

### Option 1: One-Command Startup (Easiest)

We've provided a script that handles everything for you:

```bash
./start-app.sh
```

This script will:
- Check if Docker and Docker Compose are installed
- Stop any existing containers
- Build and start all services
- Verify that everything is running correctly
- Display access URLs

### Option 2: Using Docker Compose

This option automatically sets up both the application and MongoDB:

```bash
docker-compose up --build
```

This will:
- Build the application image
- Start the application container
- Start a MongoDB container
- Set up the necessary network between them
- Make the frontend available at `http://localhost:3000`
- Make the backend API available at `http://localhost:5000`

To run it in the background:

```bash
docker-compose up --build -d
```

To stop all services:

```bash
docker-compose down
```

### Option 3: Using Docker Only

If you prefer to manage MongoDB separately:

```bash
docker build -t auto-cide .
docker run -p 3000:3000 -p 5000:5000 auto-cide
```

> **Note**: Make sure you have Docker installed and running on your machine before executing these commands.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/auto-cide.git
cd auto-cide
```

### 2. Set up the backend

```bash
cd backend
pnpm install
```

Create a `.env` file in the backend directory with the following content:

```
PORT=5000
MONGODB_URI=mongodb://0.0.0.0/auto-cide
JWT_SECRET=your_jwt_secret_here
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
GOOGLE_API_KEY=your_google_api_key
```

> **Note**: Replace the placeholder values with your actual credentials. If you don't have Redis, you can remove those variables.

### 3. Set up the frontend

```bash
cd ../frontend
pnpm install
```

Create a `.env` file in the frontend directory with the following content:

```
VITE_API_URL=http://localhost:5000
```

## Running the Application

### 1. Start the MongoDB container and backend server

```bash
cd backend
pnpm dev
```

This command will:
- Start a MongoDB container if it's not already running
- Start the backend server with nodemon for automatic reloading

### 2. Start the frontend development server

#### Standard Development Mode

```bash
cd frontend
pnpm dev
```

#### WebContainer Mode (for browser-based code execution)

```bash
cd frontend
pnpm dev:webcontainer
```

### 3. Building for production

```bash
cd frontend
pnpm build
```

The built files will be in the `frontend/dist` directory, which can be served using any static file server.

## Troubleshooting

### MongoDB Connection Issues

**Problem**: Cannot connect to MongoDB
**Solution**: 
- Ensure Docker is running
- Check if the MongoDB container is running with `docker ps`
- If not, start it manually: `docker start mongodb-container`
- Verify the MongoDB URI in your `.env` file

### WebContainer Compatibility Issues

**Problem**: WebContainer features not working
**Solution**:
- Ensure you're using a compatible browser (Chrome, Edge, or Firefox)
- Make sure you're running the frontend with `pnpm dev:webcontainer`
- Check browser console for COOP/COEP header errors
- Try using a private/incognito window

### Socket.IO Connection Errors

**Problem**: Real-time collaboration not working
**Solution**:
- Verify both frontend and backend servers are running
- Check the CORS settings in `backend/server.js`
- Ensure your JWT token is valid
- Check browser console for WebSocket connection errors

### AI Integration Issues

**Problem**: AI features not responding
**Solution**:
- Verify your Google API key is valid and has access to Generative AI
- Check the backend logs for API rate limiting or quota issues
- Ensure messages with "@ai" are properly formatted

## Common Error Messages and Solutions

### "Invalid project ID"
- Ensure the project ID is a valid MongoDB ObjectId
- Check if the project exists in the database

### "No token provided" or "Invalid token"
- Make sure you're logged in
- Your session might have expired; try logging in again
- Check if the JWT_SECRET in the backend matches what was used to sign the token

### "CORS policy" errors
- Ensure the frontend URL is properly allowed in the backend CORS configuration
- Check if you're using the correct port numbers

### "SharedArrayBuffer is not defined"
- This is related to WebContainer compatibility
- Make sure you're using the WebContainer-specific server with `pnpm dev:webcontainer`
- Verify the COOP and COEP headers are being set correctly

## Contributing

We welcome contributions to Auto-CIDE! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  Made with ❤️ by the Auto-CIDE Team
</p>
