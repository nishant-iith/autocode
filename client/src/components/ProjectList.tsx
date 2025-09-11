import React, { useEffect, useState } from 'react';
import { Plus, Upload, Github, Trash2, FolderOpen, Calendar } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import CreateProjectModal from './modals/CreateProjectModal';
import ImportModal from './modals/ImportModal';
import TemplateModal from './modals/TemplateModal';

const ProjectList: React.FC = () => {
  const {
    projects,
    currentProject,
    loadProjects,
    setCurrentProject,
    deleteProject,
    isLoading,
  } = useProjectStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (workspaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await deleteProject(workspaceId);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-vscode-border">
        <h2 className="text-sm font-medium text-vscode-text uppercase tracking-wider mb-3">
          Projects
        </h2>
        
        <div className="space-y-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 w-full p-2 text-sm bg-vscode-accent hover:bg-blue-600 rounded transition-colors"
          >
            <Plus size={14} />
            <span>New Project</span>
          </button>
          
          <div className="flex space-x-1">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex-1 flex items-center justify-center space-x-1 p-2 text-sm border border-vscode-border hover:bg-vscode-border rounded transition-colors"
            >
              <FolderOpen size={12} />
              <span>Template</span>
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 flex items-center justify-center space-x-1 p-2 text-sm border border-vscode-border hover:bg-vscode-border rounded transition-colors"
            >
              <Upload size={12} />
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto vscode-scrollbar">
        {isLoading ? (
          <div className="p-4 text-center text-vscode-text-muted">
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-4 text-center text-vscode-text-muted">
            <p>No projects yet</p>
            <p className="text-xs mt-1">Create your first project to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {projects.map((project) => (
              <div
                key={project.workspaceId}
                onClick={() => setCurrentProject(project)}
                className={`group p-3 rounded cursor-pointer transition-colors mb-2 ${
                  currentProject?.workspaceId === project.workspaceId
                    ? 'bg-vscode-selection'
                    : 'hover:bg-vscode-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-vscode-text truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-xs text-vscode-text-muted mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2 text-xs text-vscode-text-muted">
                      <Calendar size={10} />
                      <span>Modified {formatDate(project.modified)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteProject(project.workspaceId, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProjects();
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadProjects();
          }}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          onClose={() => setShowTemplateModal(false)}
          onSuccess={() => {
            setShowTemplateModal(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
};

export default ProjectList;