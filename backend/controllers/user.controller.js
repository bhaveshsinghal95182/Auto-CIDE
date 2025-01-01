import userModel from "../models/user.model";
import * as userService from "../services/user.service";
import { validationResult } from "express-validator";

export const createUserController = async (req, res) => {
  // Validate the request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Call the service to create a user
    const user = await userService.createUser(req.body);

    // Generate a token 
    const token = await user.generateToken();

    // Return the user and token in the response
    return res.status(201).json({ user, token });
  } catch (error) {
    console.error("Error in createUserController:", error);
    return res.status(500).json({ error: error.message });
  }
};
