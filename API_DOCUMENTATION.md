# 📚 AutoCode API Documentation

[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0.0-green.svg)](http://localhost:5000/api-docs.json)
[![Swagger UI](https://img.shields.io/badge/Swagger-UI-orange.svg)](http://localhost:5000/api-docs)
[![API Status](https://img.shields.io/badge/API-Live-blue.svg)](http://localhost:5000/api/health)

Complete REST API documentation for AutoCode - an online VS Code for Node.js development.

## 🚀 Quick Access

| Resource | URL | Description |
|----------|-----|-------------|
| **📖 Interactive Docs** | [http://localhost:5000/api-docs](http://localhost:5000/api-docs) | Full Swagger UI with try-it-out functionality |
| **🏠 Documentation Home** | [http://localhost:5000/docs](http://localhost:5000/docs) | Beautiful API overview and quick start |
| **📄 OpenAPI Spec** | [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json) | Machine-readable API specification |
| **💓 Health Check** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | API server status |

## 🎯 API Overview

The AutoCode API provides comprehensive backend services for building online code editors and development environments. It features:

### 🏗️ **Project Management**
- Create, list, and delete Node.js projects
- Workspace isolation and metadata management
- Project templates and scaffolding

### 📁 **File System Operations**
- Complete CRUD operations for files and folders
- Real-time file tree synchronization
- Path-based file access and manipulation

### ⚡ **Templates & Scaffolding**
- Pre-built Node.js project templates
- Express.js, REST API, and CLI tool starters
- Customizable project initialization

### 📦 **Import & Export**
- Import from ZIP files with automatic extraction
- GitHub repository integration with authentication
- Intelligent project structure detection

## 🔗 Base URLs

| Environment | Base URL | Status |
|-------------|----------|---------|
| **Development** | `http://localhost:5000/api` | ✅ Active |
| **Production** | `https://autocode.app/api` | 🚧 Coming Soon |

## 📋 Endpoint Categories

### 🏥 Health & Status
```bash
GET /api/health          # Server health check
```

### 🏗️ Projects
```bash
GET    /api/projects/list              # List all projects
POST   /api/projects/create            # Create new project
DELETE /api/projects/{workspaceId}     # Delete project
POST   /api/projects/import-zip        # Import from ZIP
POST   /api/projects/import-github     # Import from GitHub
```

### 📁 File Operations
```bash
GET    /api/files/tree/{workspaceId}             # Get file tree
GET    /api/files/content/{workspaceId}/{path}   # Get file content
PUT    /api/files/content/{workspaceId}/{path}   # Save file content
POST   /api/files/create/{workspaceId}           # Create file/folder
DELETE /api/files/{workspaceId}/{path}           # Delete file/folder
POST   /api/files/rename/{workspaceId}           # Rename/move file
```

### ⚡ Templates
```bash
GET  /api/templates/list                    # List available templates
POST /api/templates/create/{templateId}     # Create from template
```

## 📊 Response Formats

All API responses follow consistent JSON formatting:

### ✅ Success Response
```json
{
  "workspaceId": "uuid",
  "name": "project-name",
  "message": "Operation completed successfully"
}
```

### ❌ Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## 🔐 Authentication

Most endpoints are **public** and don't require authentication. However:

- **GitHub Import**: Requires personal access token for private repositories
- **File Operations**: Scoped to workspace isolation

### GitHub Token Usage
```bash
# For private repositories
curl -X POST http://localhost:5000/api/projects/import-github \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/user/private-repo",
    "accessToken": "ghp_your_token_here"
  }'
```

## 🛠️ Common Use Cases

### 1. **Create a New Project**
```bash
curl -X POST http://localhost:5000/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-awesome-project",
    "description": "A new Node.js project"
  }'
```

### 2. **Import from GitHub**
```bash
curl -X POST http://localhost:5000/api/projects/import-github \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/user/repo",
    "accessToken": "optional_token_for_private_repos"
  }'
```

### 3. **Create from Template**
```bash
curl -X POST http://localhost:5000/api/templates/create/express-basic \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-express-app"
  }'
```

### 4. **Get File Tree**
```bash
curl http://localhost:5000/api/files/tree/{workspaceId}
```

### 5. **Save File Content**
```bash
curl -X PUT http://localhost:5000/api/files/content/{workspaceId}/index.js \
  -H "Content-Type: application/json" \
  -d '{
    "content": "console.log(\"Hello, AutoCode!\");"
  }'
```

## 📝 Available Templates

| Template ID | Name | Description |
|-------------|------|-------------|
| `express-basic` | **Express.js Basic** | Simple Express server with routing |
| `express-api` | **Express.js REST API** | Complete REST API with middleware |
| `nodejs-cli` | **Node.js CLI Tool** | Command-line tool with argument parsing |

## 🔄 Real-time Features

The API supports **WebSocket connections** for real-time file synchronization:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:5000');

// Join workspace for real-time updates
socket.emit('join-workspace', workspaceId);

// Listen for file changes
socket.on('file-changed', (data) => {
  console.log('File changed:', data);
});
```

## 📈 Rate Limiting & Limits

| Resource | Limit | Period |
|----------|--------|--------|
| **API Requests** | 1000 req | per hour |
| **File Upload** | 100 MB | per file |
| **GitHub Import** | 50 repos | per hour |
| **Project Creation** | 10 projects | per hour |

## 🧪 Testing the API

### Using cURL
```bash
# Health check
curl http://localhost:5000/api/health

# List projects
curl http://localhost:5000/api/projects/list

# List templates
curl http://localhost:5000/api/templates/list
```

### Using Swagger UI
1. Open [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
2. Browse available endpoints
3. Click "Try it out" on any endpoint
4. Fill in parameters and execute requests
5. View real responses and examples

## 🐛 Error Handling

### Common HTTP Status Codes

| Code | Status | Description |
|------|---------|-------------|
| `200` | **OK** | Request successful |
| `400` | **Bad Request** | Invalid request parameters |
| `404` | **Not Found** | Resource not found |
| `500` | **Internal Error** | Server error |

### Error Response Structure
```json
{
  "error": "Validation failed",
  "details": "Project name is required and must be at least 3 characters"
}
```

## 🔧 Development

### Running the API Server
```bash
# Install dependencies
npm run install:all

# Start development server
npm run dev

# Access API at http://localhost:5000
```

### Environment Variables
```bash
PORT=5000                    # Server port
NODE_ENV=development         # Environment
GITHUB_TOKEN=your_token      # GitHub access token (optional)
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Add** your endpoint to the OpenAPI spec
4. **Test** with Swagger UI
5. **Submit** a pull request

### Adding New Endpoints

1. **Add route** in `server/routes/`
2. **Update** `server/docs/swagger.yaml`
3. **Test** via Swagger UI
4. **Document** usage examples

## 📞 Support & Feedback

- 📧 **Email**: support@autocode.dev
- 🐛 **Issues**: [GitHub Issues](https://github.com/autocode/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/autocode/discussions)
- 📖 **Docs**: [http://localhost:5000/docs](http://localhost:5000/docs)

## 📄 License

This API documentation is licensed under [MIT License](../LICENSE).

---

**🚀 Ready to start building with AutoCode API?**  
[**Launch Swagger UI →**](http://localhost:5000/api-docs)