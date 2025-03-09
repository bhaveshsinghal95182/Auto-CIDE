# Database Documentation

This document provides detailed information about the Auto-CIDE backend database structure, including schemas, relationships, indexes, and best practices.

## Table of Contents

- [Overview](#overview)
- [Connection](#connection)
- [Schemas](#schemas)
  - [User Schema](#user-schema)
  - [Project Schema](#project-schema)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Data Validation](#data-validation)
- [Best Practices](#best-practices)

## Overview

Auto-CIDE uses MongoDB as its primary database. MongoDB is a document-oriented NoSQL database that provides high performance, high availability, and easy scalability.

## Connection

The database connection is configured in `db/db.js`. The application connects to MongoDB using Mongoose, an Object Data Modeling (ODM) library for MongoDB and Node.js.

```javascript
// db/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connect;
```

## Schemas

### User Schema

The User schema defines the structure for user accounts in the application.

**File**: `models/user.model.js`

```javascript
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
      }
    ]
  },
  {
    timestamps: true
  }
);
```

**Fields**:

- `email`: User's email address (unique, required)
- `password`: Hashed password (required, min 6 characters)
- `projects`: Array of project IDs associated with the user
- `timestamps`: Automatically adds `createdAt` and `updatedAt` fields

**Hooks**:

- Pre-save hook to hash passwords before storing them
- Methods for password comparison

### Project Schema

The Project schema defines the structure for projects created by users.

**File**: `models/project.model.js`

```javascript
const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project owner is required']
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    fileTree: {
      type: Object,
      default: {
        name: 'project-root',
        type: 'directory',
        children: []
      }
    }
  },
  {
    timestamps: true
  }
);
```

**Fields**:

- `name`: Project name (required)
- `description`: Project description
- `owner`: Reference to the User who created the project
- `collaborators`: Array of User IDs who have access to the project
- `fileTree`: Object representing the project's file structure
- `timestamps`: Automatically adds `createdAt` and `updatedAt` fields

## Relationships

The Auto-CIDE database uses document references to establish relationships between collections:

1. **User to Projects (One-to-Many)**:
   - A User can have multiple Projects
   - Each Project belongs to one User (owner)

2. **Project to Collaborators (Many-to-Many)**:
   - A Project can have multiple collaborators (Users)
   - A User can collaborate on multiple Projects

## Indexes

Indexes are used to improve query performance:

### User Collection Indexes

```javascript
// Unique index on email field
UserSchema.index({ email: 1 }, { unique: true });
```

### Project Collection Indexes

```javascript
// Index on owner field for faster queries
ProjectSchema.index({ owner: 1 });

// Compound index on name and owner
ProjectSchema.index({ name: 1, owner: 1 });
```

## Data Validation

Mongoose schemas include validation rules to ensure data integrity:

1. **Required Fields**: Fields marked as required must be present
2. **String Length**: Minimum and maximum length constraints
3. **Email Format**: Regex validation for email addresses
4. **Custom Validators**: Functions that validate field values

Example of custom validation:

```javascript
validate: {
  validator: function(v) {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
  },
  message: props => `${props.value} is not a valid email address!`
}
```

## Best Practices

1. **Use Mongoose Middleware**:
   - Pre-save hooks for password hashing
   - Post-save hooks for related document updates

2. **Implement Proper Error Handling**:
   - Try-catch blocks for async operations
   - Specific error messages for different error types

3. **Optimize Queries**:
   - Use projection to select only needed fields
   - Use lean() for read-only operations
   - Limit results when appropriate

4. **Data Security**:
   - Never store plain-text passwords
   - Sanitize user inputs
   - Implement proper access control

5. **Connection Management**:
   - Handle connection errors gracefully
   - Implement connection pooling
   - Set appropriate timeouts

Example of optimized query:

```javascript
// Get projects with only necessary fields
const projects = await Project.find({ owner: userId })
  .select('name description createdAt')
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();
``` 