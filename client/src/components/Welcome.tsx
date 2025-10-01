import React, { useState } from 'react';
import { Plus, Upload, Code, Zap, Sparkles } from 'lucide-react';
import CreateProjectModal from './modals/CreateProjectModal';
import ImportModal from './modals/ImportModal';
import TemplateModal from './modals/TemplateModal';

/**
 * Welcome screen component
 * Displays when no project is open
 * Single project mode - creating/importing a new project replaces any existing one
 */
const Welcome: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  return (
    <div className="h-full bg-gradient-to-br from-vscode-editor via-vscode-editor to-vscode-panel/20 flex items-center justify-center overflow-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-8 text-center w-full animate-in fade-in duration-700">
        <div className="mb-12 animate-in slide-in-from-top-2 fade-in duration-1000">
          <div className="flex items-center justify-center mb-6 group">
            <div className="relative">
              <Code size={48} className="text-blue-400 mr-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
              <Sparkles size={16} className="absolute -top-2 -right-1 text-yellow-400 animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AutoCode
              </h1>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                <span className="text-xs text-green-400 font-medium">Online & Ready</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg text-vscode-text font-medium">
              Professional Code Editor Experience in Your Browser
            </p>
            <p className="text-sm text-vscode-text-muted/80">
              Create or import a project to get started
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in slide-in-from-bottom-2 fade-in duration-1000 delay-300">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-6 bg-vscode-panel border border-vscode-border rounded-xl hover:bg-gradient-to-br hover:from-vscode-border hover:to-blue-500/10 transition-all duration-300 text-left group hover-lift hover-glow"
          >
            <div className="flex items-center mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                <Plus size={20} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-vscode-text group-hover:text-white transition-colors duration-300">
                New Project
              </h3>
            </div>
            <p className="text-sm text-vscode-text-muted group-hover:text-vscode-text-muted/90 leading-relaxed">
              Start fresh with an empty Node.js project
            </p>
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="p-6 bg-vscode-panel border border-vscode-border rounded-xl hover:bg-gradient-to-br hover:from-vscode-border hover:to-green-500/10 transition-all duration-300 text-left group hover-lift hover-glow"
          >
            <div className="flex items-center mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                <Zap size={20} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-vscode-text group-hover:text-white transition-colors duration-300">
                Use Template
              </h3>
            </div>
            <p className="text-sm text-vscode-text-muted group-hover:text-vscode-text-muted/90 leading-relaxed">
              Quick start with Express.js, React, or other templates
            </p>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="p-6 bg-vscode-panel border border-vscode-border rounded-xl hover:bg-gradient-to-br hover:from-vscode-border hover:to-purple-500/10 transition-all duration-300 text-left group hover-lift hover-glow"
          >
            <div className="flex items-center mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                <Upload size={20} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-vscode-text group-hover:text-white transition-colors duration-300">
                Import Project
              </h3>
            </div>
            <p className="text-sm text-vscode-text-muted group-hover:text-vscode-text-muted/90 leading-relaxed">
              Import from ZIP file or Git repository
            </p>
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-vscode-border/50 animate-in fade-in duration-1000 delay-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm text-vscode-text-muted">
            <div>
              <strong className="text-vscode-text text-xs">Features:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Monaco Editor</li>
                <li>• IntelliSense</li>
                <li>• Syntax Highlighting</li>
              </ul>
            </div>
            <div>
              <strong className="text-vscode-text text-xs">File Management:</strong>
              <ul className="mt-1 space-y-1">
                <li>• File Explorer</li>
                <li>• Multi-tab Editing</li>
                <li>• Auto-save</li>
              </ul>
            </div>
            <div>
              <strong className="text-vscode-text text-xs">Import Options:</strong>
              <ul className="mt-1 space-y-1">
                <li>• ZIP Upload</li>
                <li>• Git Import</li>
                <li>• Templates</li>
              </ul>
            </div>
            <div>
              <strong className="text-vscode-text text-xs">Shortcuts:</strong>
              <ul className="mt-1 space-y-1">
                <li>• Ctrl+S (Save)</li>
                <li>• Ctrl+Shift+P (Command)</li>
                <li>• Ctrl+, (Settings)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => setShowImportModal(false)}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onSuccess={() => setShowTemplateModal(false)}
        />
      )}
    </div>
  );
};

export default Welcome;
