# Chapter 2: Development Setup

## Prerequisites and Environment Setup

This chapter will guide you through setting up a complete development environment for AutoCode, including all necessary tools, dependencies, and configurations.

### System Requirements

#### Operating System Support
- **Windows**: Windows 10 or later (with WSL2 recommended)
- **macOS**: macOS 10.15 or later
- **Linux**: Any modern distribution (Ubuntu 18.04+, CentOS 7+, etc.)

#### Required Software

| Tool | Minimum Version | Recommended Version | Purpose |
|------|----------------|-------------------|---------|
| **Node.js** | 18.x.x | 20.x.x LTS | JavaScript runtime |
| **npm** | 8.x.x | 10.x.x | Package manager |
| **Git** | 2.30.0 | 2.40.0+ | Version control |
| **VS Code** | 1.70.0 | Latest | IDE (recommended) |
| **Chrome** | 90.0 | Latest | Development browser |

### Development Tools Installation

#### Installing Node.js and npm

**Option 1: Official Installer (Recommended)**
```bash
# Download from https://nodejs.org/
# Choose the LTS version for stability
```

**Option 2: Using Version Manager**
```bash
# For macOS/Linux with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts

# For Windows with nvm-windows
# Download from https://github.com/coreybutler/nvm-windows
```

**Verification:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

#### Installing Git

**Windows:**
```bash
# Download from https://git-scm.com/download/win
# or use winget
winget install --id Git.Git -e --source winget
```

**macOS:**
```bash
# Using Homebrew
brew install git

# Or download from https://git-scm.com/download/mac
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

#### Visual Studio Code Setup

**Installation:**
```bash
# Download from https://code.visualstudio.com/
# or use package manager:
# Windows: winget install Microsoft.VisualStudioCode
# macOS: brew install --cask visual-studio-code
# Linux: snap install code --classic
```

**Recommended Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-markdown",
    "bierner.markdown-mermaid",
    "yzhang.markdown-all-in-one"
  ]
}
```

## Project Setup

### Cloning the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/autocode.git
cd autocode

# Verify the structure
ls -la
```

### Project Structure Overview

```
autocode/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # State management
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # Express routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Server utilities
│   │   └── config/        # Configuration
│   ├── docs/              # API documentation
│   └── package.json       # Backend dependencies
├── shared/                # Shared types and utilities
├── markdown-docs/         # This documentation
├── package.json           # Root package.json
└── README.md
```

### Installing Dependencies

#### Root Dependencies
```bash
# Install root-level dependencies
npm install
```

#### Client Dependencies
```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Return to root
cd ..
```

#### Server Dependencies
```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Return to root
cd ..
```

### Environment Configuration

#### Environment Variables

Create environment files for different environments:

**`.env` (Development):**
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Client Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# AI Configuration
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet

# WebContainer Configuration
VITE_WEBCONTAINER_ENABLED=true

# Security
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=http://localhost:5173

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# Database (if using)
# DATABASE_URL=mongodb://localhost:27017/autocode
```

**`.env.production` (Production):**
```env
NODE_ENV=production
PORT=3001

# Production URLs
VITE_API_URL=https://api.autocode.dev
VITE_WS_URL=wss://api.autocode.dev

# Production AI Configuration
VITE_OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
VITE_DEFAULT_AI_MODEL=anthropic/claude-3.5-sonnet

# Production Security
JWT_SECRET=${JWT_SECRET}
CORS_ORIGIN=https://autocode.dev

# Production File Storage
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=10485760

# SSL/HTTPS
HTTPS_ENABLED=true
SSL_CERT_PATH=/etc/ssl/certs/autocode.crt
SSL_KEY_PATH=/etc/ssl/private/autocode.key
```

#### Environment Setup Script

Create a setup script to automate environment configuration:

**`scripts/setup-env.sh`:**
```bash
#!/bin/bash

echo "🚀 Setting up AutoCode development environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Check client .env
if [ ! -f client/.env ]; then
    echo "📝 Creating client .env file..."
    cat > client/.env << EOF
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_OPENROUTER_API_KEY=your_api_key_here
EOF
    echo "⚠️  Please edit client/.env with your OpenRouter API key"
else
    echo "✅ Client .env file already exists"
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p server/uploads
mkdir -p server/logs
mkdir -p client/dist

# Set permissions
chmod +x scripts/*.sh

echo "✅ Environment setup complete!"
echo "📖 Next steps:"
echo "   1. Edit .env files with your configuration"
echo "   2. Run 'npm run dev' to start development servers"
```

## Development Workflow

### Running the Development Servers

The project uses a concurrent development setup to run both frontend and backend simultaneously.

#### Option 1: Using Root Package Scripts

**Add to root `package.json`:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "start": "cd server && npm start",
    "test": "npm run test:client && npm run test:server",
    "test:client": "cd client && npm test",
    "test:server": "cd server && npm test",
    "lint": "npm run lint:client && npm run lint:server",
    "lint:client": "cd client && npm run lint",
    "lint:server": "cd server && npm run lint",
    "setup": "chmod +x scripts/setup-env.sh && ./scripts/setup-env.sh"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

**Start Development:**
```bash
# Start both client and server
npm run dev

# Or start individually
npm run dev:client  # Frontend on http://localhost:5173
npm run dev:server  # Backend on http://localhost:3001
```

#### Option 2: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### Development Workflow Diagram

```mermaid
graph LR
    Dev[Developer] --> Edit[Code Editor]
    Edit --> Frontend[React Dev Server:5173]
    Edit --> Backend[Express Dev Server:3001]

    Frontend --> HMR[Hot Module Reload]
    Backend --> Nodemon[Auto-restart on changes]

    Frontend -.->|API Calls| Backend
    Backend -->|WebSocket| Frontend

    HMR --> Browser[Browser Updates]
    Nodemon --> Browser

    style Dev fill:#e1f5fe
    style Frontend fill:#f3e5f5
    style Backend fill:#e8f5e8
    style Browser fill:#fff3e0
```

## IDE Configuration

### VS Code Workspace Settings

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### VS Code Tasks

Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development Servers",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "npm",
      "args": ["test"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Build Project",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    }
  ]
}
```

### VS Code Launch Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/src/index.js",
      "outFiles": ["${workspaceFolder}/server/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    },
    {
      "name": "Debug Client",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/client/src",
      "sourceMaps": true,
      "userDataDir": false,
      "runtimeArgs": ["--remote-debugging-port=9222"]
    }
  ]
}
```

## Code Quality Tools

### ESLint Configuration

**Client ESLint (`.eslintrc.js` in client/):**
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
```

**Server ESLint (`.eslintrc.js` in server/):**
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn'
  }
}
```

### Prettier Configuration

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Husky and Git Hooks

**Install Husky:**
```bash
npm install --save-dev husky
npx husky install
npm pkg set scripts.prepare="husky install"
```

**Pre-commit hook:**
```bash
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

**Pre-push hook:**
```bash
npx husky add .husky/pre-push "npm run build"
```

## Testing Setup

### Client Testing

**Vitest Configuration (`vitest.config.ts` in client/):**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**Test Setup (`client/src/test/setup.ts`):**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### Server Testing

**Jest Configuration (`jest.config.js` in server/):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For client
cd client && rm -rf node_modules package-lock.json && npm install

# For server
cd server && rm -rf node_modules package-lock.json && npm install
```

#### TypeScript Errors
```bash
# Check TypeScript version
npx tsc --version

# Rebuild type definitions
npm run build

# Clear TypeScript cache
npx tsc --build --clean
```

#### Environment Variables Not Loading
```bash
# Verify .env file exists
ls -la .env

# Check for syntax errors in .env
cat .env

# Restart development server after changes
npm run dev
```

### Performance Issues

#### Slow Development Server
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Use Vite's experimental features
# Add to vite.config.ts:
export default defineConfig({
  server: {
    hmr: {
      overlay: false
    }
  }
})
```

#### Build Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Enable source maps in development
# Add to vite.config.ts:
export default defineConfig({
  build: {
    sourcemap: true
  }
})
```

## Chapter Summary

In this chapter, we've covered the complete development setup for AutoCode:

- ✅ System requirements and prerequisites
- ✅ Installation of development tools
- ✅ Project cloning and dependency installation
- ✅ Environment configuration
- ✅ Development workflow setup
- ✅ IDE configuration and tools
- ✅ Code quality tools configuration
- ✅ Testing setup
- ✅ Troubleshooting common issues

### Next Steps

With your development environment properly set up, you're now ready to:

1. **Start Development**: Run `npm run dev` to start the development servers
2. **Explore Code**: Browse the project structure and understand the codebase
3. **Make Changes**: Start developing new features or fixing bugs
4. **Run Tests**: Ensure your changes don't break existing functionality
5. **Build Project**: Create production builds when ready

> **🔑 Key Takeaway:** A properly configured development environment is crucial for productive development. Take the time to set up all tools and configurations correctly to ensure a smooth development experience.

---

**Next Chapter:** [System Architecture and Design](./03-system-architecture.md) → Dive deep into the architectural patterns and design principles that power AutoCode.