import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getSecurePath } from '../utils/security.js';
import JSZip from 'jszip';
import multer from 'multer';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  }
});

router.post('/create', async (req, res) => {
  try {
    const { name, description } = req.body;
    const workspaceId = uuidv4();
    const workspacePath = path.join(req.workspacesDir, workspaceId);
    
    await fs.ensureDir(workspacePath);
    
    const packageJson = {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: description || 'A Node.js project created with AutoCode',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        dev: 'nodemon index.js',
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: [],
      author: '',
      license: 'ISC'
    };
    
    await fs.writeFile(
      path.join(workspacePath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    await fs.writeFile(
      path.join(workspacePath, 'index.js'),
      `console.log('Hello from ${name}!');\n`
    );
    
    await fs.writeFile(
      path.join(workspacePath, 'README.md'),
      `# ${name}\n\n${description || 'A Node.js project created with AutoCode'}\n`
    );
    
    res.json({
      workspaceId,
      name,
      description,
      path: workspacePath
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.post('/import-zip', upload.single('zipFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ZIP file provided' });
    }
    
    const workspaceId = uuidv4();
    const workspacePath = path.join(req.workspacesDir, workspaceId);
    await fs.ensureDir(workspacePath);
    
    const zip = await JSZip.loadAsync(req.file.buffer);
    
    for (const [filePath, file] of Object.entries(zip.files)) {
      if (!file.dir) {
        const content = await file.async('string');
        const fullPath = path.join(workspacePath, filePath);
        await fs.ensureFile(fullPath);
        await fs.writeFile(fullPath, content);
      } else {
        await fs.ensureDir(path.join(workspacePath, filePath));
      }
    }
    
    let projectName = 'Imported Project';
    const packageJsonPath = path.join(workspacePath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        projectName = packageJson.name || projectName;
      } catch (e) {
        console.log('Could not parse package.json');
      }
    }
    
    res.json({
      workspaceId,
      name: projectName,
      message: 'ZIP file imported successfully'
    });
  } catch (error) {
    console.error('Error importing ZIP:', error);
    res.status(500).json({ error: 'Failed to import ZIP file' });
  }
});

router.post('/import-github', async (req, res) => {
  try {
    const { repoUrl, accessToken } = req.body;
    
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    
    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, '');
    
    const octokit = new Octokit({
      auth: accessToken || process.env.GITHUB_TOKEN,
      request: {
        fetch: fetch,
      }
    });
    
    // Check if repository exists and get basic info
    let repoData;
    try {
      const response = await octokit.rest.repos.get({
        owner,
        repo: repoName
      });
      repoData = response.data;
    } catch (repoError) {
      return res.status(404).json({ 
        error: 'Repository not found or access denied',
        details: 'Please check the repository URL and access token'
      });
    }
    
    const workspaceId = uuidv4();
    const workspacePath = path.join(req.workspacesDir, workspaceId);
    await fs.ensureDir(workspacePath);
    
    // Use archive download for simpler implementation
    const archiveUrl = `https://api.github.com/repos/${owner}/${repoName}/zipball`;
    const headers = {};
    if (accessToken || process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${accessToken || process.env.GITHUB_TOKEN}`;
    }
    
    const response = await fetch(archiveUrl, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download repository: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Extract files, removing the root directory
    const files = Object.keys(zip.files);
    const rootDir = files.length > 0 ? files[0].split('/')[0] : '';
    
    for (const [filePath, file] of Object.entries(zip.files)) {
      if (!file.dir && filePath.startsWith(rootDir)) {
        const relativePath = filePath.substring(rootDir.length + 1);
        if (relativePath) {
          const content = await file.async('string');
          const fullPath = path.join(workspacePath, relativePath);
          await fs.ensureFile(fullPath);
          await fs.writeFile(fullPath, content);
        }
      }
    }
    
    res.json({
      workspaceId,
      name: repoData.name,
      description: repoData.description,
      message: 'GitHub repository imported successfully'
    });
  } catch (error) {
    console.error('Error importing from GitHub:', error);
    res.status(500).json({ 
      error: 'Failed to import GitHub repository',
      details: error.message
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const workspaces = await fs.readdir(req.workspacesDir);
    const projects = [];
    
    for (const workspaceId of workspaces) {
      const workspacePath = path.join(req.workspacesDir, workspaceId);
      const stat = await fs.stat(workspacePath);
      
      if (stat.isDirectory()) {
        let projectName = workspaceId;
        let description = '';
        
        const packageJsonPath = path.join(workspacePath, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
          try {
            const packageJson = await fs.readJson(packageJsonPath);
            projectName = packageJson.name || projectName;
            description = packageJson.description || '';
          } catch (e) {
            console.log('Could not parse package.json for', workspaceId);
          }
        }
        
        projects.push({
          workspaceId,
          name: projectName,
          description,
          created: stat.birthtime,
          modified: stat.mtime
        });
      }
    }
    
    projects.sort((a, b) => b.modified - a.modified);
    res.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

router.delete('/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspacePath = getSecurePath(req.workspacesDir, workspaceId);
    
    if (!workspacePath || !await fs.pathExists(workspacePath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await fs.remove(workspacePath);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;