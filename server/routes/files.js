import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/tree/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspacePath = path.join(req.workspacesDir, workspaceId);
    
    if (!await fs.pathExists(workspacePath)) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const buildTree = async (dirPath, relativePath = '') => {
      const items = await fs.readdir(dirPath);
      const tree = [];

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemRelativePath = path.join(relativePath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          tree.push({
            id: uuidv4(),
            name: item,
            type: 'folder',
            path: itemRelativePath,
            children: await buildTree(itemPath, itemRelativePath)
          });
        } else {
          tree.push({
            id: uuidv4(),
            name: item,
            type: 'file',
            path: itemRelativePath,
            size: stat.size,
            modified: stat.mtime
          });
        }
      }

      return tree.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });
    };

    const tree = await buildTree(workspacePath);
    res.json(tree);
  } catch (error) {
    console.error('Error building file tree:', error);
    res.status(500).json({ error: 'Failed to build file tree' });
  }
});

router.get('/content/:workspaceId/*', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];
    const fullPath = path.join(req.workspacesDir, workspaceId, filePath);
    
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = await fs.readFile(fullPath, 'utf8');
    const stat = await fs.stat(fullPath);
    
    res.json({
      content,
      path: filePath,
      size: stat.size,
      modified: stat.mtime
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

router.put('/content/:workspaceId/*', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];
    const { content } = req.body;
    const fullPath = path.join(req.workspacesDir, workspaceId, filePath);
    
    await fs.ensureFile(fullPath);
    await fs.writeFile(fullPath, content, 'utf8');
    
    req.io.to(`workspace-${workspaceId}`).emit('file-changed', {
      path: filePath,
      type: 'modified'
    });
    
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

router.post('/create/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { path: filePath, type, name } = req.body;
    
    const fullPath = path.join(req.workspacesDir, workspaceId, filePath, name);
    
    if (type === 'folder') {
      await fs.ensureDir(fullPath);
    } else {
      await fs.ensureFile(fullPath);
    }
    
    req.io.to(`workspace-${workspaceId}`).emit('file-changed', {
      path: path.join(filePath, name),
      type: 'created'
    });
    
    res.json({ success: true, path: path.join(filePath, name) });
  } catch (error) {
    console.error('Error creating file/folder:', error);
    res.status(500).json({ error: 'Failed to create file/folder' });
  }
});

router.delete('/:workspaceId/*', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const filePath = req.params[0];
    const fullPath = path.join(req.workspacesDir, workspaceId, filePath);
    
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await fs.remove(fullPath);
    
    req.io.to(`workspace-${workspaceId}`).emit('file-changed', {
      path: filePath,
      type: 'deleted'
    });
    
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

router.post('/rename/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { oldPath, newPath } = req.body;
    
    const oldFullPath = path.join(req.workspacesDir, workspaceId, oldPath);
    const newFullPath = path.join(req.workspacesDir, workspaceId, newPath);
    
    if (!await fs.pathExists(oldFullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await fs.move(oldFullPath, newFullPath);
    
    req.io.to(`workspace-${workspaceId}`).emit('file-changed', {
      oldPath,
      newPath,
      type: 'renamed'
    });
    
    res.json({ success: true, oldPath, newPath });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

export default router;