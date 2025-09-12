import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createProject, setCurrentProject } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const result = await createProject(name.trim(), description.trim() || undefined);
      
      const newProject = {
        workspaceId: result.workspaceId,
        name: result.name,
        description: result.description,
        created: new Date(),
        modified: new Date(),
      };
      
      setCurrentProject(newProject);
      onSuccess();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-vscode-panel border border-vscode-border rounded-lg p-6 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-vscode-text">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-vscode-border rounded"
            disabled={isCreating}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vscode-text mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-vscode-text focus:outline-none focus:border-vscode-accent"
              placeholder="my-awesome-project"
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vscode-text mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-vscode-text focus:outline-none focus:border-vscode-accent resize-none"
              placeholder="A brief description of your project..."
              rows={3}
              disabled={isCreating}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-vscode-border hover:bg-vscode-border rounded transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm bg-vscode-accent hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50"
              disabled={!name.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;