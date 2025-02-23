In this web based code editor, what I want is: 
- Able to store and access a folder on the pc
- Able to add files or folders directly from this interface, without having to navigate through file explorers or browse for locations.
- Have some kind of cache memory that automatically opens a reference of the last opened files
- Have a system for rooms like to be able to share the room key and make a video call with pair programming...with each other, allowing seamless collaboration on code projects, even from remote locations.
- Add a panel at the side for AI integration for getting results...such as code suggestions, bug fixes, and even entire code snippets that can be easily imported into your project, further enhancing the collaborative experience and streamlining development.

### Tech Stack for Your Project:

1. **Frontend:** 
    - **Framework:** React with Next.js (for SSR and responsiveness).
    - **Styling:** Tailwind CSS (for rapid, responsive design).
    - **State Management:** React Context API or Zustand.
    - **Animations:** Framer Motion or React Spring.
2. **File System Access:**
    - **API:** File System Access API (client-side file operations).
3. **Real-Time Collaboration:**
    - **Protocol:** WebRTC (peer-to-peer video calls and pair programming).
    - **Signaling Server:** PeerJS or SimpleWebRTC (optional).
4. **AI Integration:**
    - **Service:** Gemini API (or Hugging Face for NLP tasks).
    - **Integration:** Direct API calls from the Next.js API routes.
5. **Caching:**
    - **Local Storage:** IndexedDB or localStorage (for recent files and sessions).
6. **Hosting:**
    - **Platform:** Vercel (free tier, optimized for Next.js).

### Optional (If Needed Later):

- **Backend:** Lightweight Node.js server or serverless functions for WebRTC signaling or AI API middleware.
- **Database:** Redis (for caching) or Firebase (for authentication/real-time collaboration).

---


Sheriyans Coding School has somewhat similar video:- [How to create online collaborative code editor](https://www.youtube.com/watch?v=v9MtwYmSXuw&t=953s)

So, we start off by creating a backend folder in which we have an `app.js` where we initialize `express.js` backend and set up a dummy route `'/'` this means whenever we hit the local host we will get the response on this route. Then we create a `server.js` file where we take the express app and create an http server out of it.

App.js
```javascript app.js
import express from 'express';
import morgan from 'morgan';
import connect from './db/db.js';
  
const app = express();
  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
  
app.get('/', (req, res) => {
  res.send('Hello World');
});
  
export default app;
```

Server.js
```javascript
import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import app from './app.js';
  
const port = process.env.PORT || 3000;
  
const server = http.createServer(app);
  
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

Next thing we create a `db/db.js` file which initiates a connection with mongodb using a given mongodb URI and use it in app.js

db.js
```javascript
import mongoose from "mongoose";
  
function connect() {
  return mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("Successfully connected to MongoDB");
    })
    .catch((err) => {
      console.error(err);
    });
}
  
export default connect;
```

---
# User Register and Login
I kinda fucked up here tho not gonna lie.

Well we first create a model for users here, it somewhat looks like this and is stored in `user.model.js` file.
```javascript
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: [6,"Email must be at least 6 characters long"],
        maxLength: [100,"Email must be at most 100 characters long"]
    },
    password:{
        type: String,
        select: false,
    }
});

userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
}

userSchema.methods.isValidPassword = async function(password) {
    console.log(password, this.password);
    return await bcrypt.compare(password, this.password);
}
  
userSchema.methods.generateJWT = async function() {
    return await jwt.sign({email: this.email}, process.env.JWT_SECRET);
}
  
const User = mongoose.model("User", userSchema);

export default User;
```

^36de58

**Explanation**:
[[MongoDB#Use Schema and Model]]

After this is done, we will create a `user.service.js`
```javascript
import userModel from "../models/user.model.js";

export const createUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  
  const hashedPassword = await userModel.hashPassword(password);
  
  const user = await userModel.create({
    email,
    password: hashedPassword,
  });
  
  return user;
};
```

Here we create a user service to create a new user, which is basically me telling the mongoDB to create a new user using `userModel` and in that new user we save the password as `hashedPassword`

After this we will create the controllers, there are basically 2 types of controllers here
	1. loginUser - In this type of controller, we make a DB query based on the email user uploads and then checks whether the hash version of password user put in is the same as the hash of stored version in the DB. After we login, we create a jwt token which will hold the info for session.
	2. createUser - In this type of controller, user creates a controller which then adds the email and query in the DB.

```javascript
import userModel from "../models/user.model.js";
import * as userService from "../services/user.service.js";
import { validationResult } from "express-validator";
  
export const createUserController = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await userService.createUser(req.body);
  
    const token = await user.generateJWT();
  
    delete user._doc.password;
  
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
  
export const loginController = async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { email, password } = req.body;
  
    const user = await userModel.findOne({ email }).select("+password");
  
    if (!user) {
      return res.status(401).json({
        errors: "Invalid credentials",
      });
    }
  
    const isMatch = await user.isValidPassword(password);
  
    if (!isMatch) {
      return res.status(401).json({
        errors: "Invalid credentials"
      });
    }
  
    const token = await user.generateJWT();
  
    delete user._doc.password;
  
    res.status(200).json({ user, token });
  } catch (err) {
    console.log(err);
  
    res.status(400).send(err.message);
  }
};
```

After this we will create routes using Router in express, they will be post requests for each of the login and create user requests.
```javascript
import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
  
const router = Router();
  
router.post(
  "/register",
  body("email").isEmail().withMessage("Email must be a valid email address"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  userController.createUserController
);
  
router.post(
    "/login",
    body("email").isEmail().withMessage("Email must be a valid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    userController.loginController
)
  
export default router;
```

With this out of the way our Primary user can now easily login and create a user account

# Adding a Middleware to make the client login using jwt 

So, first we create a middleware in the user such that we can either take the jwt token from cookies or from headers (this one is for testing purpose).
`auth.middleware.js`
```javascript
import jwt from "jsonwebtoken";
  
export const authUser = (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
  
    if (!token) {
      return res.status(401).send({ error: "Unauthorized user" });
    }
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "Please authenticate" });
  }
};
```

Now wee will add a controller in the
`user.controller.js`
```javascript
export const profileController = (req, res) => {
  console.log(req.user);
  res.status(200).json({
    user: req.user,
 });
};
```

Now create a route for profile and middleware in the file after importing auth middleware from middleware js file.
`user.routes.js`
```javascript
router.get("/profile",authMiddleware.authUser, userController.profileController);
```

In this point of time, I wasted about a night and a day because I was not able to get this middleware to work. Incidently what i was able to do is simple i noticed when i tried to connect to middleware the controller did not print anything on console, that way i came to the conclusion that controller is not activating, but if thats the case then this means auth is not activating. As soon as i came to this conclusion i was able to infer i was hitting the wrong route with wrong request. So the request for this will go on the route 
`localhost:3000/users/profile`

# Add Redis

Create a service file in `services` folder for connecting to redis
`redis.service.js`
```javascript
import Redis from "ioredis";

const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
});
  
redisClient.on('connect', () => {
    console.log("redis connected");
});
  
export default redisClient;
```

This is just a simple connection that logs whenever a connection is made on redis server and the main thing is we didn't need to call this anywhere this `redisClient` function anywhere, we just imported it in the controller file and that was it. It ran on its own because the import triggers execution and we see the same behaviour in python that's why we use dunder functions there.

# Logout Logic

Handling Logout is easy at this point, its just like any other of the routes. We create a route for logout using a get method and it contains 3 things:- 
1. The actual route where the user will hit 
2. The middleware that will check whether is connection is authorized or not
3. The logout controller in user

So, starting from the middleware, we need to check whether the user access is authorized or not so we will add these two lines in the already existing middleware file
`auth.middleware.js`
```javascript
 const isBlackListed = await redisClient.get(token);
    if (isBlackListed) {
      res.cookie('token', '');
      return res.status(401).send({ error: "Unauthorized access" });
    }
```

This will check for the existing  json web token on redis client cache and if its blacklisted, it will end up with an unauthorized error.

Next we need to add the controller for logout and we can do that in the `model.controller.js` file
```javascript
export const logoutController = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
    redisClient.set(token, "logout", "EX", 60 * 60 * 24);
    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
};
```

in this we check the cookies for token and then check for a request to recieve the token if we dont recive any token in any way we just give an error of status 400 and if we do recieve those tokens then we set out that token to be expired or blacklisted for the next 24 hrs

the logout routes looks something like this
`user.routes.js`
```javascript
router.get("/logout", authMiddleware.authUser, userController.logoutController);
```


# Creating a Frontend

For this frontend we are using vite as the bundeler, So like we executed the basic commands for this 
```bash
pnpm create vite
```

after creating the app we install tailwind along with some other of its dependencies 
```bash
#go to project directory
cd frontend

pnpm install -D tailwindcss postcss autoprefixer
pnpx tailwindcss init -p
```

After this basic installation, we create routes using react router dom.
`routes/AppRoutes.jsx`
```jsx
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '../screens/login'
import Register from '../screens/register'
import Home from '../screens/home'
  
const AppRoutes = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register/>} />
        </Routes>
    </BrowserRouter>
  )
}
  
export default AppRoutes
```

After this is done, we will create all those elements that are above in the routes. We need a total of 3 elements for now:-
1. Home
2. Login
3. Register

For Login and Register components i just prompted copilot to create a simple page, so I am not gonna put that code here and for now there is nothing in the home component so that too is not gonna be here.

# Creating Axios Instance 
Now that our login and register screens are all done, we need to create an axios instance in `src/config/axios.js`
```js
import axios from 'axios';
  
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});
  
export default axiosInstance;
```

this will give me an easy access to axios commands.
A Login form will probably have 2 fields: Email and Password, so lets make the logic to actually send the requests from frontend to backend using axios and post method.
We will add this code on the Login form. The state management and handle submit function will go inside main login component so it refreshes each time user makes some changes.
```js
import axios from '../config/axios';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate()
  
  function handleSubmit(e) {

    e.preventDefault()
  
    axios.post('/login', {
      email, password
    }).then((res) => {
      console.log(res.data)
      navigate('/')
    }).catch((err) => {
      console.log(err.response.data)
    })
  }
```

then we add the exact same code to register form because it also has exactly 2 fields. Dont forget to change the state of password and email using `onChange` attribute in respective input tags and the handle input buttons as well.

# Setting up user context
The first thing that needed to be changed was the password was still stored inside the dom so i added `delete user._doc.password;` in user login controller to delete the password as soon as the valid password check is passed.
`src/context/user.context.js`
```js
import { createContext, useState } from "react";
  
// Create the UserContext
const UserContext = createContext();
  
// Define the provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
  
export default UserContext;
```

So, we use createContext function to create a context which will be passed on to each component that is wrapped inside `<UserProvider>`, `{children}` ensures that the props are destructured.

Now, instead of using `useContext` hook each time, we will make a hook for user specially `useUser`.
```js
import { useContext } from "react";
import UserContext from "./UserContext";
  
const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  
  return context;
};
  
export default useUser;
```

# Creating a new project endpoint
We will create a project model to save the information about any project, the model will look something like this.
```js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  users:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});


const Project = mongoose.model('Project', projectSchema);

export default Project;
```

Now we will create services to create a new project project.
```js
import projectModel from "../models/project.model.js";
import mongoose from "mongoose";

export const createProject = async ({ name, userId }) => {
  if (!name) {
    throw new Error("Name is required");
  }
  if (!userId) {
    throw new Error("UserId is required");
  }

  let project;
  try {
    project = await projectModel.create({
      name,
      users: [userId],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Project name already exists");
    }
    throw error;
  }

  return project;
};

```

Now in the project controller, we will create a new project controller.
```js
import projectModel from "../models/project.model.js";
import * as projectService from "../services/project.service.js";
import userModel from "../models/user.model.js";
import { validationResult } from "express-validator";

export const createProject = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const userId = loggedInUser._id;

    const newProject = await projectService.createProject({ name, userId });

    res.status(201).json(newProject);
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
};

```

Now we will setup the project routes
```js
import { Router } from "express";
import { body } from "express-validator";
import * as projectController from "../controllers/project.controller.js";
import * as authMiddleWare from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/create",
  authMiddleWare.authUser,
  body("name").isString().withMessage("Name is required"),
  projectController.createProject
);

export default router;
```

# Home page UI
So creating the ui was super simple thanks to cursor, what we did here is create a component, one part was the new project button, the other part is the modal which opens when we click on new project button. Then I configured a submit handler that sends the data to `/project/create` route. basically we are sending the project names that are bound to a particular user. 

`home.jsx`
```jsx
import React, { useContext, useState } from "react";
import UserContext from "../context/user.context";
import axios from "../config/axios";

const Home = () => {
  const user = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  function handleModalOpen() {
    setIsModalOpen(true);
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    const response = await axios.post("/projects/create", {
      name: projectName,
    }).then((res) => {
      console.log(res);
    })
      .catch((err) => console.log(err));

    setIsModalOpen(false);
    setProjectName("");
  }

  return (
    <main className="p-4">
      <div className="projects">
        <button
          onClick={handleModalOpen}
          className="project p-4 border border-slate-300 rounded-md"
        >
          New Project
          <i className="ri-link ml-2"></i>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>

            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
```

Then there was an error in console where it said unauthorized access, but that was due to the authorization token not being sent with the data. The solution to this was simple enough. We added jwt tokens inside the axios instance we created earlier [[Online Code editor#Creating Axios Instance]]

```js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export default axiosInstance;
```

# Creating controllers and services for adding users in project

First of all we will create a controller to get all the projects that are associated with a particular user.
`project.controller.js`
```js
export const getAllProjects = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({
      email: req.user.email
    })

    const allUserProjects = await projectService.getAllProjectsByUserID({
      userId: loggedInUser._id
    })

    return res.status(200).json({
      projects: allUserProjects
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({error: err.message})
  }
}
```

Note: (From future me, the `getAllProjectsByUserID` method expects a single user id, not a json object, that's why it was giving a 400, bad request error, possible fixes are instead of a json object just pass on `loggedinuser` id)

And a service to get all the projects name from the data base. This line needs it 
```js
const allUserProjects = await projectService.getAllProjectsByUserID({
      userId: loggedInUser._id
    })
```
`project.service.js`
```js
export const getAllProjectsByUserID = async (UserID) => {
  if (!UserID) throw new "UserID is required"();

  const allUserProjects = await projectModel.find({
    users: UserID,
  });

  return allUserProjects;
};
```


Now, we will create a controller to add a user to project
```js
export const addUserToProject = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { users, projectId } = req.body;
    const loggedInUser = await userModel.findOne({ email: req.user.email });
    const userId = loggedInUser._id;

    const project = await projectService.addUserToProject({
      projectId,
      users,
      userId
    });

    return res.status(200).json({project});
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
}
```

In order for this controller to work, we need to make a service that will interact with the database and make so many fucking checks like crazy.
`project.service.js`
```js
export const addUserToProject = async ({ projectId, users, userId }) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  if (!users || users.length < 1) {
    throw new Error("Users must be an array with at least one user");
  }
  if (!users.every((user) => mongoose.Types.ObjectId.isValid(user))) {
    throw new Error("Each user must be a valid user ID");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Project ID must be a valid mongoose ID");
  }
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("User ID must be a valid mongoose ID");
  }

  const project = await projectModel.findOne({
    _id: projectId,
    users: userId,
  });

  if (!project) {
    throw new Error("User doesnt belong to this project");
  }

  project.users = [...new Set([...project.users.map(String), ...users])];

  await project.save();

  return project;
};
```

These are so many fucking checks, and these at the end just do one thing, add the user to be added into the array while using the set method to check if we are not adding the same user multiple times.

Now we just need to connect both of these to respective routes.
`project.routes.js`
```js
router.get(
  "/all",
  authMiddleWare.authUser,
  projectController.getAllProjects
)

router.put(
  "/add-user",
  authMiddleWare.authUser,
  body("projectId").isString().withMessage("Project ID is required"),
  body("users").isArray({ min: 1 }).withMessage("Users must be an array with at least one user").bail()
    .custom((users) => users.every(user => typeof user === 'string')).withMessage("Each user must be a string"),
  projectController.addUserToProject
)
```

# Route to get all users
Now we are creating a route to get all users and we can do that following the same pattern that we have been following for the past few routes. This will be created to find out all the users that the current user can add into project and will make this easy for them as well as for us

Tasks: 
1. Router 
2. controller 
3. Service

`product.routes.js`
```js
router.get(
  "/all",
  authMiddleware.authUser,
  userController.allUsersController
)
```

`project.controller.js`
```js
export const allUsersController = async (req, res) => {
  try {
    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });

    if (!loggedInUser) {
      return res.status(404).send("User not found");
    }

    const allUsers = await userService.getAllUsers(loggedInUser._id);
    res.status(200).json(allUsers);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

```

`project.service.js`
```js
export const getALlUser = async (userId) => {
  const users = await userModel.find({
    _id: { $ne: userId },
  });
  return users;
}
```

So in this service particularily, we are returning all the users except the loggedIn user.

# Route to get information on a particular project
Again with the steps,
1. route
2. controller
3. service

`project.route.js`
```js
router.get(
  "/get-project/:projectId",
  authMiddleWare.authUser,
  projectController.getProjectById
)
```

`project.controller.js`
```js
export const getProjectById = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await projectService.getProjectById(projectId);
    return res.status(200).json({ project });
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
};
```

`project.service.js`
```js
export const getProjectById = async (projectId) => {
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Project ID must be a valid mongoose ID");
  }
  const project = await projectModel.findOne({
    _id: projectId,
  }).populate("users");

  return project;
}
```
We are just going to find out the users. First find the particular project then create an object of all users and product id, and return it.

Note: After this i encountered an error while making a call from frontend to backend. That was because the get all projects controller was sending an object to the service, but that was not how it should have send the data, it just needed the id and i figured that out using chatgpt.


# Creating UI for Projects 
First of all add the project component to App Router, so that each request at /projects is sent to that route. 

`AppRoutes.jsx`
```jsx
<Route path="/project" element={<Project />} />
```

`screen/Project.jsx`
```jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Project = () => {
  const location = useLocation();
  console.log(location.state);
  const [sidePanel, setSidePanel] = useState(false);

  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-full w-1/5 bg-slate-700">
        {/* Project Header */}
        <header className="flex items-center justify-between p-4 w-full bg-slate-200">
          <h1 className="text-2xl font-bold">{location.state.name}</h1>
          <button
            className="text-2xl font-bold"
            onClick={() => setSidePanel(!sidePanel)}
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        {/* Conversation Area */}
        <div className="conversation-area flex-grow overflow-y-auto flex flex-col">
          <div className="message-box flex-grow overflow-y-auto p-2">
            <div className="incoming flex flex-col p-2 bg-slate-50 w-fit rounded-xl">
              <small className="opacity-65 text-xs">example@gmail.com</small>
              <p className="p-2">Lorem ipsum dolor sit amet.</p>
            </div>
            <div className="outgoing ml-auto flex flex-col p-2 bg-slate-50 w-fit rounded-xl">
              <small className="opacity-65 text-xs">example@gmail.com</small>
              <p className="p-2">Lorem ipsum dolor sit amet.</p>
            </div>
          </div>
          <div className="input-field w-full flex items-center justify-between bg-white p-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="px-4 p-2 rounded-full outline-none bg-white w-full mr-2"
            />
            <button className="send-button bg-[#25D366] text-white p-2 px-4 rounded-[1vw] hover:bg-[#128C7E]">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div
          className={`side-panel w-full h-full bg-slate-300 flex flex-col transition-all duration-3000 absolute top-0 left-[-100%] ${
            sidePanel ? "left-0" : ""
          }`}
        >
          <header className="flex items-center justify-between p-4 w-full bg-slate-200">
            <h1 className="text-2xl font-bold">Project Details</h1>
            <button
              className="text-2xl font-bold"
              onClick={() => setSidePanel(!sidePanel)}
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>

          <div className="users flex flex-col gap-2">
            <div className="user flex items-center gap-2 cursor-pointer hover:bg-slate-400 p-2 rounded-xl">
              <div className="aspect-square rounded-full p-2 bg-slate-400">
                <i className="ri-user-fill "></i>
              </div>
              <h1 className="font-semibold text-lg font-sans">username</h1>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Project;
```