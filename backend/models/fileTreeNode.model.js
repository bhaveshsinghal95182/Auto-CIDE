import mongoose from "mongoose";

const fileTreeNodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['file', 'directory'],
    required: true
  },
  path: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  }
});

const FileTreeNode = mongoose.model('FileTreeNode', fileTreeNodeSchema);

export default FileTreeNode; 