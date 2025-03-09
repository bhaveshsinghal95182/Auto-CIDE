# API Reference Documentation

This document provides detailed information about the Auto-CIDE backend API endpoints, including request parameters, response formats, authentication requirements, and example usage.

## Table of Contents

- [Authentication](#authentication)
  - [Register User](#register-user)
  - [Login User](#login-user)
  - [Get User Profile](#get-user-profile)
  - [Logout User](#logout-user)
  - [Get All Users](#get-all-users)
- [Projects](#projects)
  - [Get All Projects](#get-all-projects)
  - [Create Project](#create-project)
  - [Get Project by ID](#get-project-by-id)
  - [Update Project](#update-project)
  - [Delete Project](#delete-project)
- [AI Integration](#ai-integration)
  - [Generate AI Response](#generate-ai-response)
- [File Tree](#file-tree)
  - [Get File Tree](#get-file-tree)
  - [Update File Tree](#update-file-tree)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:5000
```

For production environments, replace with your domain.

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Register User

Creates a new user account.

- **URL**: `/users/register`
- **Method**: `POST`
- **Authentication**: None
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

- **Validation**:
  - Email must be a valid email address
  - Password must be at least 6 characters long

- **Success Response**:
  - **Code**: 201 Created
  - **Content**:

```json
{
  "success": true,
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Email already exists
    - Validation errors
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X POST http://localhost:5000/users/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword"}'
```

### Login User

Authenticates a user and returns a JWT token.

- **URL**: `/users/login`
- **Method**: `POST`
- **Authentication**: None
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Invalid credentials
    - Validation errors
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X POST http://localhost:5000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword"}'
```

### Get User Profile

Retrieves the authenticated user's profile information.

- **URL**: `/users/profile`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X GET http://localhost:5000/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Logout User

Invalidates the user's JWT token.

- **URL**: `/users/logout`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X GET http://localhost:5000/users/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get All Users

Retrieves a list of all users (admin only).

- **URL**: `/users/all`
- **Method**: `GET`
- **Authentication**: Required
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "users": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "email": "user1@example.com"
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "email": "user2@example.com"
    }
  ]
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 403 Forbidden
    - Not authorized as admin
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X GET http://localhost:5000/users/all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Projects

### Get All Projects

Retrieves all projects for the authenticated user.

- **URL**: `/projects`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `limit` (optional): Number of projects to return (default: 10)
  - `page` (optional): Page number for pagination (default: 1)

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "count": 2,
  "projects": [
    {
      "_id": "60d21b4667d0d8992e610c87",
      "name": "Project 1",
      "description": "Description for Project 1",
      "owner": "60d21b4667d0d8992e610c85",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c88",
      "name": "Project 2",
      "description": "Description for Project 2",
      "owner": "60d21b4667d0d8992e610c85",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X GET http://localhost:5000/projects?limit=5&page=1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create Project

Creates a new project for the authenticated user.

- **URL**: `/projects`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:

```json
{
  "name": "New Project",
  "description": "Description for the new project"
}
```

- **Success Response**:
  - **Code**: 201 Created
  - **Content**:

```json
{
  "success": true,
  "project": {
    "_id": "60d21b4667d0d8992e610c89",
    "name": "New Project",
    "description": "Description for the new project",
    "owner": "60d21b4667d0d8992e610c85",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Validation errors
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X POST http://localhost:5000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"name": "New Project", "description": "Description for the new project"}'
```

### Get Project by ID

Retrieves a specific project by its ID.

- **URL**: `/projects/:id`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**:
  - `id`: Project ID

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "project": {
    "_id": "60d21b4667d0d8992e610c87",
    "name": "Project 1",
    "description": "Description for Project 1",
    "owner": "60d21b4667d0d8992e610c85",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 403 Forbidden
    - Not authorized to access this project
  - **Code**: 404 Not Found
    - Project not found
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X GET http://localhost:5000/projects/60d21b4667d0d8992e610c87 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Update Project

Updates a specific project by its ID.

- **URL**: `/projects/:id`
- **Method**: `PUT`
- **Authentication**: Required
- **URL Parameters**:
  - `id`: Project ID
- **Request Body**:

```json
{
  "name": "Updated Project Name",
  "description": "Updated project description"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "project": {
    "_id": "60d21b4667d0d8992e610c87",
    "name": "Updated Project Name",
    "description": "Updated project description",
    "owner": "60d21b4667d0d8992e610c85",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Validation errors
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 403 Forbidden
    - Not authorized to update this project
  - **Code**: 404 Not Found
    - Project not found
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X PUT http://localhost:5000/projects/60d21b4667d0d8992e610c87 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"name": "Updated Project Name", "description": "Updated project description"}'
```

### Delete Project

Deletes a specific project by its ID.

- **URL**: `/projects/:id`
- **Method**: `DELETE`
- **Authentication**: Required
- **URL Parameters**:
  - `id`: Project ID

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 403 Forbidden
    - Not authorized to delete this project
  - **Code**: 404 Not Found
    - Project not found
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X DELETE http://localhost:5000/projects/60d21b4667d0d8992e610c87 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## AI Integration

### Generate AI Response

Generates AI-powered code suggestions or answers based on the provided prompt.

- **URL**: `/ai/generate`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:

```json
{
  "prompt": "Write a function to calculate the Fibonacci sequence",
  "projectId": "60d21b4667d0d8992e610c87",
  "context": {
    "language": "javascript",
    "codeSnippet": "// Optional code context"
  }
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "response": {
    "text": "Here's a function to calculate the Fibonacci sequence in JavaScript:\n\n```javascript\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n```\n\nThis is a recursive implementation. For better performance with larger numbers, you might want to use an iterative approach:\n\n```javascript\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  \n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    const temp = a + b;\n    a = b;\n    b = temp;\n  }\n  \n  return b;\n}\n```",
    "model": "gemini-pro",
    "promptTokens": 15,
    "completionTokens": 230
  }
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Missing required fields
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 403 Forbidden
    - Not authorized to access this project
  - **Code**: 500 Internal Server Error
    - AI service error

- **Example**:

```bash
curl -X POST http://localhost:5000/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"prompt": "Write a function to calculate the Fibonacci sequence", "projectId": "60d21b4667d0d8992e610c87", "context": {"language": "javascript"}}'
```

## File Tree

### Get File Tree

Retrieves the file tree structure for a specific project.

- **URL**: `/filetree/:projectId`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**:
  - `projectId`: Project ID

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "fileTree": {
    "name": "project-root",
    "type": "directory",
    "children": [
      {
        "name": "src",
        "type": "directory",
        "children": [
          {
            "name": "index.js",
            "type": "file",
            "path": "src/index.js"
          },
          {
            "name": "utils",
            "type": "directory",
            "children": [
              {
                "name": "helpers.js",
                "type": "file",
                "path": "src/utils/helpers.js"
              }
            ]
          }
        ]
      },
      {
        "name": "package.json",
        "type": "file",
        "path": "package.json"
      }
    ]
  }
}
```

- **Error Responses**:
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 403 Forbidden
    - Not authorized to access this project
  - **Code**: 404 Not Found
    - Project not found
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X GET http://localhost:5000/filetree/60d21b4667d0d8992e610c87 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Update File Tree

Updates the file tree structure for a specific project.

- **URL**: `/filetree/:projectId`
- **Method**: `POST`
- **Authentication**: Required
- **URL Parameters**:
  - `projectId`: Project ID
- **Request Body**:

```json
{
  "operation": "create",
  "path": "src/components/Button.js",
  "content": "// Button component code here"
}
```

- **Success Response**:
  - **Code**: 200 OK
  - **Content**:

```json
{
  "success": true,
  "message": "File tree updated successfully"
}
```

- **Error Responses**:
  - **Code**: 400 Bad Request
    - Invalid operation
    - Missing required fields
  - **Code**: 401 Unauthorized
    - No token provided
    - Invalid token
  - **Code**: 403 Forbidden
    - Not authorized to modify this project
  - **Code**: 404 Not Found
    - Project not found
    - File/directory not found
  - **Code**: 500 Internal Server Error

- **Example**:

```bash
curl -X POST http://localhost:5000/filetree/60d21b4667d0d8992e610c87 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"operation": "create", "path": "src/components/Button.js", "content": "// Button component code here"}'
```

## Error Handling

The API uses consistent error response formats:

```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Optional additional error details
}
```

Common HTTP status codes:

- **400 Bad Request**: Invalid request parameters or validation errors
- **401 Unauthorized**: Authentication required or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 100 requests per minute
- **Unauthenticated users**: 20 requests per minute

When rate limit is exceeded, the API returns:

- **Status Code**: 429 Too Many Requests
- **Response**:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 30 // Seconds until rate limit resets
}
``` 