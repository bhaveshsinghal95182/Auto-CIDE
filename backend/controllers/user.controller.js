import * as userService from "../services/user.service.js";
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

export const loginController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await user.isValidPassword(password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = await user.generateToken();

    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Error in loginController:", error);
    return res.status(500).json({ error: error.message });
  }
};
