import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = req.cookies.token || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!token) {
      return res.status(401).send({ error: "Unauthorized user" });
    }

    // Check if token is blacklisted in Redis
    const isBlackListed = await redisClient.get(token);
    if (isBlackListed) {
      res.cookie("token", "", { httpOnly: true, expires: new Date(0) }); // Clear cookie
      return res.status(401).send({ error: "Unauthorized access" });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    
    // More specific error messages for debugging
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send({ error: "Invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).send({ error: "Token expired, please log in again" });
    } else {
      return res.status(401).send({ error: "Please authenticate" });
    }
  }
};
