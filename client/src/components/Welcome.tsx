import React, { useState, useEffect } from 'react';
import { Plus, Upload, FolderOpen, Code, Zap, Clock, Sparkles } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import CreateProjectModal from './modals/CreateProjectModal';
import ImportModal from './modals/ImportModal';
import TemplateModal from './modals/TemplateModal';

const Welcome: React.FC = () => {
  const { projects, loadProjects, setCurrentProject } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const recentProjects = projects.slice(0, 5);

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
              Build, edit, and manage your Node.js projects with full-featured IDE capabilities
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
              Start fresh with an empty Node.js project and build something amazing
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
              Quick start with Express.js, REST API, or CLI templates
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
              Import from ZIP file or Git repository seamlessly
            </p>
          </button>
        </div>

        {recentProjects.length > 0 && (
          <div className="text-left animate-in slide-in-from-bottom-2 fade-in duration-1000 delay-500">
            <h2 className="text-lg font-semibold text-vscode-text mb-6 flex items-center">
              <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                <Clock size={18} className="text-orange-400" />
              </div>
              Recent Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentProjects.map((project, index) => (
                <button
                  key={project.workspaceId}
                  onClick={() => setCurrentProject(project)}
                  className={`w-full p-5 bg-vscode-panel border border-vscode-border rounded-xl hover:bg-gradient-to-br hover:from-vscode-border hover:to-orange-500/10 transition-all duration-300 text-left group hover-lift hover-glow animate-in slide-in-from-left-2 fade-in duration-700`}
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        <FolderOpen size={16} className="text-blue-400 mr-2 flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-vscode-text group-hover:text-white transition-colors duration-300 truncate">
                          {project.name}
                        </h3>
                      </div>
                      {project.description && (
                        <p className="text-xs text-vscode-text-muted group-hover:text-vscode-text-muted/90 line-clamp-2 mb-2">
                          {project.description}
                        </p>
                      )}
                      <div className="text-xs text-vscode-text-muted/70 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(project.modified).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-4">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <FolderOpen size={12} className="text-blue-400" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-vscode-border/50 animate-in fade-in duration-1000 delay-700">
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