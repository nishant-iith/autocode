# AutoCode - Online VS Code for Node.js

![AutoCode](https://img.shields.io/badge/AutoCode-Online%20IDE-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Express](https://img.shields.io/badge/Express-4-green)
![Monaco](https://img.shields.io/badge/Monaco%20Editor-Latest-orange)

AutoCode is a powerful online code editor specifically designed for Node.js development. Built with React and Express, it provides a VS Code-like experience in your browser with advanced features for modern JavaScript/TypeScript development.

## 🚀 Features

### Core Editor
- **Monaco Editor** - The same editor that powers VS Code
- **IntelliSense** - Smart code completion and suggestions
- **Syntax Highlighting** - Support for JavaScript, TypeScript, JSON, HTML, CSS, and more
- **Multi-tab Interface** - Work on multiple files simultaneously
- **Auto-save** - Never lose your work
- **Code Folding** - Collapse and expand code blocks
- **Minimap** - Navigate large files easily

### File Management
- **File Explorer** - Hierarchical file tree with drag-and-drop
- **File Operations** - Create, delete, rename, and move files/folders
- **Context Menus** - Right-click actions for files and folders
- **Real-time Updates** - See changes across all connected clients

### Project Management
- **Multiple Projects** - Manage several projects simultaneously
- **Project Templates** - Start with Express.js, REST API, or CLI templates
- **Import Options** - Import from ZIP files or GitHub repositories
- **Project Dashboard** - Overview of all your projects

### Developer Experience
- **Command Palette** (Ctrl+Shift+P) - Quick access to all commands
- **Keyboard Shortcuts** - Familiar VS Code shortcuts
- **Themes** - Dark and light themes
- **Customizable Settings** - Font size, word wrap, minimap toggle
- **Responsive Design** - Works on desktop, tablet, and mobile

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-username/autocode.git
cd autocode
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
cp server/.env.example server/.env
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
autocode/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── store/         # Zustand state management
│   │   ├── services/      # API services
│   │   └── styles/        # Tailwind CSS
│   └── public/
├── server/                # Express backend
│   ├── routes/           # API routes
│   ├── workspaces/       # User project files
│   └── index.js          # Server entry point
└── README.md
```

## 🎯 Available Scripts

### Root Scripts
- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build the client for production
- `npm run start` - Start the production server
- `npm run install:all` - Install all dependencies

### Client Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Server Scripts
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start production server

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
GITHUB_TOKEN=your_github_token_here
```

### Customization

#### Adding New Templates
Edit `server/routes/templates.js` to add new project templates:

```javascript
const templates = {
  'your-template': {
    name: 'Your Template',
    description: 'Template description',
    files: {
      'package.json': { /* package.json content */ },
      'index.js': 'console.log("Hello World");'
    }
  }
};
```

#### Adding New Languages
Monaco Editor supports many languages out of the box. Update the language mapping in `client/src/store/editorStore.ts`:

```javascript
const languageMap = {
  'py': 'python',
  'go': 'go',
  'rust': 'rust',
  // Add more extensions
};
```

## 🌐 API Endpoints

### Projects
- `GET /api/projects/list` - Get all projects
- `POST /api/projects/create` - Create new project
- `POST /api/projects/import-zip` - Import from ZIP
- `POST /api/projects/import-github` - Import from GitHub
- `DELETE /api/projects/:id` - Delete project

### Files
- `GET /api/files/tree/:workspaceId` - Get file tree
- `GET /api/files/content/:workspaceId/*` - Get file content
- `PUT /api/files/content/:workspaceId/*` - Save file content
- `POST /api/files/create/:workspaceId` - Create file/folder
- `DELETE /api/files/:workspaceId/*` - Delete file/folder

### Templates
- `GET /api/templates/list` - Get available templates
- `POST /api/templates/create/:templateId` - Create from template

## 🎨 Themes and Customization

AutoCode supports both dark and light themes. The dark theme is based on VS Code's default dark theme with custom colors defined in `tailwind.config.js`.

### Custom Colors
```javascript
colors: {
  'vscode': {
    'bg': '#1e1e1e',
    'sidebar': '#252526',
    'editor': '#1e1e1e',
    'panel': '#181818',
    'border': '#2d2d30',
    'text': '#cccccc',
    'text-muted': '#969696',
    'accent': '#007acc',
  }
}
```

## 🔌 Extensions and Plugins

AutoCode is built to be extensible. Future versions will support:

- Custom themes
- Plugin system
- Additional language servers
- Git integration
- Terminal integration
- Debugging support

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The code editor that powers VS Code
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Express.js](https://expressjs.com/) - Fast, unopinionated, minimalist web framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) - A small, fast and scalable bearbones state-management solution

## 🐛 Issues and Support

If you encounter any issues or have questions, please file an issue on our [GitHub Issues](https://github.com/your-username/autocode/issues) page.

## 🗺️ Roadmap

- [ ] Git integration
- [ ] Terminal/Console integration
- [ ] Real-time collaboration
- [ ] Plugin system
- [ ] Debugging support
- [ ] Docker integration
- [ ] Cloud deployment options
- [ ] Mobile app

---

**AutoCode** - Bringing the power of VS Code to your browser for Node.js development! 🚀