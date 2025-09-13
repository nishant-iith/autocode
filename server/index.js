import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import fileRoutes from './routes/files.js';
import projectRoutes from './routes/projects.js';
import templateRoutes from './routes/templates.js';
import { swaggerSpec, swaggerUi, swaggerUiOptions } from './config/swagger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const WORKSPACES_DIR = path.join(__dirname, 'workspaces');
fs.ensureDirSync(WORKSPACES_DIR);

app.use((req, res, next) => {
  req.workspacesDir = WORKSPACES_DIR;
  req.io = io;
  next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// API Documentation JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Documentation landing page
app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'api-docs.html'));
});

// Redirect root API to documentation
app.get('/api', (req, res) => {
  res.redirect('/docs');
});

// API Routes
app.use('/api/files', fileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/templates', templateRoutes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API server
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-15T10:30:00.000Z
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-workspace', (workspaceId) => {
    socket.join(`workspace-${workspaceId}`);
    console.log(`Client ${socket.id} joined workspace ${workspaceId}`);
  });
  
  socket.on('file-change', (data) => {
    socket.to(`workspace-${data.workspaceId}`).emit('file-changed', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`AutoCode server running on port ${PORT}`);
  console.log(`Workspaces directory: ${WORKSPACES_DIR}`);
});