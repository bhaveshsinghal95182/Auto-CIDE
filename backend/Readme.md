# Auto-CIDE Backend

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

A powerful backend service for the Auto-CIDE application, providing user authentication, project management, AI assistance, and real-time collaboration features.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Documentation](#documentation)
- [Project Structure](#project-structure)
- [Database](#database)
- [WebSocket](#websocket)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **User Authentication**: Secure registration and login with JWT
- **Project Management**: Create, read, update, and delete projects
- **AI Integration**: Generative AI assistance for coding tasks
- **Real-time Collaboration**: Socket.IO based real-time updates
- **File Tree Management**: Manage project file structures
- **Redis Caching**: Improved performance with Redis caching

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.IO
- **AI Integration**: Google Generative AI
- **Validation**: Express Validator
- **Logging**: Morgan

## 📋 Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- MongoDB (via Docker or local installation)
- Redis (optional, for enhanced performance)

## 🚀 Installation

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

3. Start MongoDB using Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb --rm mongo
   ```
   Note: The `--rm` flag will delete the container when it stops.

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://0.0.0.0/auto-cide
JWT_SECRET=your_jwt_secret
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
GOOGLE_API_KEY=your_google_api_key
```

## 💻 Development

Start the development server with hot-reloading:

```bash
npm run dev
# or
pnpm dev
```

This command will:
1. Start MongoDB in Docker if not already running
2. Start the Node.js server with nodemon for hot-reloading

## 📚 Documentation

Comprehensive documentation is available in the `docs` directory:

- [API Reference](./docs/api-reference.md) - Detailed API endpoints documentation
- [Database Documentation](./docs/database.md) - MongoDB schema and design
- [WebSocket Documentation](./docs/websocket.md) - Real-time communication features
- [Deployment Guide](./docs/deployment.md) - Instructions for deploying to various environments

For a complete overview, see the [Documentation Index](./docs/index.md).

## 📁 Project Structure

```
backend/
├── controllers/       # Request handlers
├── db/                # Database connection and configuration
├── middleware/        # Express middleware
├── models/            # Mongoose models
├── routes/            # API routes
├── services/          # Business logic
├── docs/              # Comprehensive documentation
├── app.js             # Express app setup
├── server.js          # Server entry point
└── .env               # Environment variables
```

## 💾 Database

The application uses MongoDB for data storage. The database connection is configured in `db/db.js`.

### Models

- **User**: User authentication and profile data
- **Project**: Project management and metadata

For detailed database documentation, see [Database Documentation](./docs/database.md).

## 🔌 WebSocket

Real-time features are implemented using Socket.IO. The WebSocket server is configured in `server.js`.

### Events

- **connection**: Client connected to the server
- **disconnect**: Client disconnected from the server
- **project:update**: Project data updated
- **ai:generate**: AI generation in progress/completed

For detailed WebSocket documentation, see [WebSocket Documentation](./docs/websocket.md).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.
