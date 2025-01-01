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