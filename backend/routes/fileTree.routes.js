import express from 'express';
import { fileTreeService } from '../services/fileTree.service.js';
import * as authMiddleWare from "../middleware/auth.middleware.js";

const router = express.Router();

// Get file tree for a project
router.get('/:projectId', authMiddleWare.authUser, async (req, res) => {
  try {
    const fileTree = await fileTreeService.getFileTree(req.params.projectId);
    res.json(fileTree);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Add a new file or directory
router.post('/:projectId', authMiddleWare.authUser, async (req, res) => {
  try {
    const newNode = await fileTreeService.addNode(req.params.projectId, req.body);
    res.status(201).json(newNode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a file or directory
router.put('/:projectId/:nodeId', authMiddleWare.authUser, async (req, res) => {
  try {
    const updatedNode = await fileTreeService.updateNode(
      req.params.projectId,
      req.params.nodeId,
      req.body
    );
    res.json(updatedNode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a file or directory
router.delete('/:projectId/:nodeId', authMiddleWare.authUser, async (req, res) => {
  try {
    const result = await fileTreeService.deleteNode(
      req.params.projectId,
      req.params.nodeId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Move a file or directory
router.patch('/:projectId/:nodeId/move', authMiddleWare.authUser, async (req, res) => {
  try {
    const movedNode = await fileTreeService.moveNode(
      req.params.projectId,
      req.params.nodeId,
      req.body.newPath
    );
    res.json(movedNode);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 