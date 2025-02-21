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

export const getAllProjectsByUserID = async (UserID) => {
  if (!UserID) throw new "UserID is required"();

  const allUserProjects = await projectModel.find({
    users: UserID,
  });

  return allUserProjects;
};

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
