# AutoCode - Online Code Editor (Stable Release)

AutoCode is a powerful, browser-based code editor built with React and Node.js, featuring an integrated AI assistant (AutoChat) powered by OpenRouter. It provides a professional development environment similar to VS Code but accessible from anywhere.

## 🚀 Features

### **Core Editor**
- **Monaco Editor Integration** - Full-featured code editor with syntax highlighting
- **Multi-tab Interface** - Work with multiple files simultaneously  
- **File Tree Explorer** - Navigate and manage project files with collapsible sidebar
- **Resizable Sidebar** - VS Code-like sidebar with drag-to-resize functionality
- **Auto-save** - Never lose your work with intelligent auto-saving
- **Syntax Highlighting** - Support for 20+ programming languages
- **Command Palette** - Quick access to all commands (Ctrl+Shift+P)

### **Project Management**
- **Create Projects** - Start new Node.js projects instantly
- **Import from ZIP** - Upload and extract project archives
- **Git Repository Import** - Clone projects directly from GitHub
- **Workspace Management** - Isolated environments for each project

### **AI Assistant (AutoChat)**
- **Separate Panel Design** - Independent right-side panel like Bolt.new and Lovable
- **Resizable Interface** - Drag to resize from 300px to 800px width
- **OpenRouter Integration** - Access to multiple AI models
- **Context-Aware Conversations** - Maintains chat history
- **Code Assistance** - Get help with debugging, optimization, and learning
- **Streaming Responses** - Real-time AI responses
- **Syntax-Highlighted Code Blocks** - Beautiful code formatting in responses

### **Professional UI/UX**
- **VS Code Theme** - Familiar dark theme with proper syntax colors
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Keyboard Shortcuts** - Full hotkey support for power users
- **Status Bar** - Real-time feedback and indicators
- **Modal System** - Clean, accessible dialogs and settings

## 🛠️ Technical Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Zustand** for state management  
- **Monaco Editor** (@monaco-editor/react)
- **React Markdown** with syntax highlighting
- **Radix UI** for accessible components

### **Backend**
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **Swagger/OpenAPI** documentation
- **File system operations** with fs-extra
- **UUID** for secure identifiers
- **CORS** and security headers

### **Security Features**
- **Path Traversal Protection** - Secure file access validation
- **Input Sanitization** - XSS and injection prevention  
- **File Type Validation** - Only allowed extensions
- **Size Limits** - Prevent resource exhaustion
- **Security Headers** - XSS, CSRF, and clickjacking protection

## 📦 Installation

### **Prerequisites**
- Node.js 16+ and npm
- Git (for repository imports)

### **Quick Start**
```bash
# Clone the repository
git clone <repository-url>
cd autocode

# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

### **Individual Services**
```bash
# Client only (http://localhost:3000)
npm run client:dev

# Server only (http://localhost:5000)  
npm run server:dev

# Production build
npm run build
```

## 🔧 Configuration

### **Environment Variables**
Create a `.env` file in the server directory:
```env
PORT=5000
GITHUB_TOKEN=your_github_token_here
```

### **OpenRouter API Key**
1. Get an API key from [OpenRouter](https://openrouter.ai/)
2. In AutoCode, click the chat button
3. Enter your API key in the settings

## 📖 Usage

### **Creating a Project**
1. Click "Create New Project"
2. Enter project name and description
3. Start coding immediately

### **Using AutoChat**
1. Click the chat icon or press Ctrl+Shift+C
2. Configure your OpenRouter API key
3. Ask questions about your code, debugging help, or programming concepts

### **Keyboard Shortcuts**
- `Ctrl+S` - Save current file
- `Ctrl+Shift+P` - Open command palette
- `Ctrl+Shift+C` - Toggle AutoChat
- `Ctrl+B` - Toggle sidebar (collapse/expand)
- `Ctrl+,` - Open settings
- `Escape` - Close modals/chat

## 🏗️ Architecture

### **Monorepo Structure**
```
autocode/
├── client/          # React frontend
├── server/          # Node.js backend  
├── docs/            # API documentation
└── package.json     # Root scripts
```

### **Key Components**
- **Editor Store** - File management and editor state
- **Project Store** - Workspace and project data
- **Chat Store** - AI conversation management
- **Security Utils** - Path validation and sanitization
- **Error Boundary** - Graceful error handling

## 🔒 Security

AutoCode implements enterprise-grade security:
- **Input validation** on all user inputs
- **Path traversal prevention** in file operations  
- **XSS protection** with security headers
- **File type restrictions** for uploads
- **Resource limits** to prevent DoS
- **UUID-based** workspace isolation

## 🚀 Production Deployment

### **Build Process**
```bash
npm run build    # Creates optimized production build
```

### **Environment Setup**
- Configure CORS origins for your domain
- Set up proper SSL/TLS certificates
- Configure reverse proxy (nginx/Apache)
- Set production environment variables

### **Performance**
- **Code splitting** - Optimized bundle chunks
- **Tree shaking** - Remove unused code
- **Gzip compression** - Reduced transfer sizes
- **Asset optimization** - Minified and compressed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

Interactive API documentation is available at:
- **Development**: http://localhost:5000/api-docs
- **JSON Spec**: http://localhost:5000/api-docs.json

## 🐛 Troubleshooting

### **Common Issues**

**Monaco Editor not loading**
- Check browser console for errors
- Ensure network connection for CDN resources

**File operations failing**
- Verify workspace permissions
- Check file path validity

**AutoChat not working**
- Validate OpenRouter API key
- Check network connectivity
- Verify model availability