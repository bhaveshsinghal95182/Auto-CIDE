import Project from '../models/project.model.js';
import FileTreeNode from '../models/fileTreeNode.model.js';

export const fileTreeService = {
  // Get file tree for a project
  async getFileTree(projectId) {
    const project = await Project.findById(projectId).populate('fileTree');
    if (!project) {
      throw new Error('Project not found');
    }
    return project.fileTree;
  },

  // Add a new file or directory to the project
  async addNode(projectId, nodeData) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check if a file with the same path already exists
    const existingNode = await FileTreeNode.findOne({ 
      projectId: projectId,
      path: nodeData.path 
    });
    
    if (existingNode) {
      // Update existing node
      Object.assign(existingNode, nodeData);
      await existingNode.save();
      return existingNode;
    } else {
      // Add new node
      const newNode = new FileTreeNode({
        ...nodeData,
        projectId: projectId
      });
      await newNode.save();
      
      // Add reference to project
      project.fileTree.push(newNode._id);
      await project.save();
      
      return newNode;
    }
  },

  // Update a file or directory
  async updateNode(projectId, nodeId, updateData) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Find the node
    const node = await FileTreeNode.findById(nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    // Verify node belongs to this project
    if (node.projectId.toString() !== projectId) {
      throw new Error('Node does not belong to this project');
    }

    // Update the node
    Object.assign(node, updateData);
    await node.save();

    return node;
  },

  // Delete a file or directory
  async deleteNode(projectId, nodeId) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Find the node
    const node = await FileTreeNode.findById(nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    // Verify node belongs to this project
    if (node.projectId.toString() !== projectId) {
      throw new Error('Node does not belong to this project');
    }

    // Remove reference from project
    project.fileTree = project.fileTree.filter(id => id.toString() !== nodeId);
    await project.save();

    // Delete the node
    await FileTreeNode.findByIdAndDelete(nodeId);

    return { message: 'Node deleted successfully' };
  },

  // Move a file or directory
  async moveNode(projectId, nodeId, newPath) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Find the node
    const node = await FileTreeNode.findById(nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    // Verify node belongs to this project
    if (node.projectId.toString() !== projectId) {
      throw new Error('Node does not belong to this project');
    }

    // Update the path
    node.path = newPath;
    await node.save();

    return node;
  }
}; 