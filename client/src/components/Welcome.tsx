import React, { useState, useEffect } from 'react';
import { Plus, Upload, FolderOpen, Code, Zap } from 'lucide-react';
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
    <div className="h-full bg-vscode-editor flex items-center justify-center overflow-auto">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 text-center w-full">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <Code size={32} className="text-vscode-accent mr-3" />
            <h1 className="text-2xl font-semibold text-white">AutoCode</h1>
          </div>
          <p className="text-sm text-vscode-text-muted mb-1">
            Online VS Code for Node.js Development
          </p>
          <p className="text-xs text-vscode-text-muted">
            Build, edit, and manage your Node.js projects in the browser
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-4 bg-vscode-panel border border-vscode-border rounded-lg hover:bg-vscode-border transition-colors text-left group"
          >
            <div className="flex items-center mb-2">
              <div className="p-2 bg-vscode-accent rounded mr-3">
                <Plus size={16} className="text-white" />
              </div>
              <h3 className="text-sm font-medium text-vscode-text">
                New Project
              </h3>
            </div>
            <p className="text-xs text-vscode-text-muted">
              Start fresh with an empty Node.js project
            </p>
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="p-4 bg-vscode-panel border border-vscode-border rounded-lg hover:bg-vscode-border transition-colors text-left group"
          >
            <div className="flex items-center mb-2">
              <div className="p-2 bg-green-600 rounded mr-3">
                <Zap size={16} className="text-white" />
              </div>
              <h3 className="text-sm font-medium text-vscode-text">
                Use Template
              </h3>
            </div>
            <p className="text-xs text-vscode-text-muted">
              Start with Express.js, REST API, or CLI templates
            </p>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="p-4 bg-vscode-panel border border-vscode-border rounded-lg hover:bg-vscode-border transition-colors text-left group"
          >
            <div className="flex items-center mb-2">
              <div className="p-2 bg-purple-600 rounded mr-3">
                <Upload size={16} className="text-white" />
              </div>
              <h3 className="text-sm font-medium text-vscode-text">
                Import Project
              </h3>
            </div>
            <p className="text-xs text-vscode-text-muted">
              Import from ZIP file or GitHub repository
            </p>
          </button>
        </div>

        {recentProjects.length > 0 && (
          <div className="text-left">
            <h2 className="text-sm font-medium text-vscode-text mb-3 flex items-center">
              <FolderOpen size={16} className="mr-2" />
              Recent Projects
            </h2>
            <div className="space-y-2">
              {recentProjects.map((project) => (
                <button
                  key={project.workspaceId}
                  onClick={() => setCurrentProject(project)}
                  className="w-full p-3 bg-vscode-panel border border-vscode-border rounded hover:bg-vscode-border transition-colors text-left flex items-center justify-between group"
                >
                  <div>
                    <h3 className="text-sm font-medium text-vscode-text">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-vscode-text-muted mt-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-vscode-text-muted">
                    {new Date(project.modified).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-vscode-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-vscode-text-muted">
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
                <li>• GitHub Import</li>
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