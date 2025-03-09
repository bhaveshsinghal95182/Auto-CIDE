import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: [true, "Project name must be unique"],
    lowercase: true,
  },
  users:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  fileTree: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileTreeNode'
  }]
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
