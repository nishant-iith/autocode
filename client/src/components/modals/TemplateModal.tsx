import React, { useState, useEffect } from 'react';
import { X, Code, Server, Terminal, Loader, Zap, Globe, Layers } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { api, Template } from '../../services/api';

interface TemplateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ onClose, onSuccess }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { createFromTemplate, setCurrentProject } = useProjectStore();

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templatesData = await api.getTemplates();
        setTemplates(templatesData);
        if (templatesData.length > 0) {
          setSelectedTemplate(templatesData[0].id);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'express-basic':
      case 'express-api':
        return <Server size={24} className="text-green-500" />;
      case 'nodejs-cli':
        return <Terminal size={24} className="text-blue-500" />;
      case 'react-typescript':
        return <Zap size={24} className="text-cyan-500" />;
      case 'vue3-typescript':
        return <Layers size={24} className="text-green-600" />;
      case 'nextjs-typescript':
        return <Globe size={24} className="text-black dark:text-white" />;
      default:
        return <Code size={24} className="text-purple-500" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      const workspaceId = await createFromTemplate(selectedTemplate, projectName.trim() || undefined);
      
      const template = templates.find(t => t.id === selectedTemplate);
      const newProject = {
        workspaceId,
        name: projectName.trim() || template?.name || 'New Project',
        description: template?.description,
        created: new Date(),
        modified: new Date(),
      };
      
      setCurrentProject(newProject);
      onSuccess();
    } catch (error) {
      console.error('Failed to create from template:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-vscode-panel border border-vscode-border rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <Loader className="animate-spin" size={20} />
            <span className="text-vscode-text">Loading templates...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-panel border border-vscode-border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-vscode-text">Create from Template</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-vscode-border rounded"
            disabled={isCreating}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-vscode-text mb-3">
              Choose Template
            </label>
            <div className="grid grid-cols-1 gap-3">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-vscode-accent bg-vscode-accent bg-opacity-10'
                      : 'border-vscode-border hover:bg-vscode-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="sr-only"
                    disabled={isCreating}
                  />
                  <div className="flex items-start space-x-4">
                    <div className="mt-1">
                      {getTemplateIcon(template.id)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-vscode-text mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-vscode-text-muted">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-vscode-text mb-2">
              Project Name (optional)
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-vscode-text focus:outline-none focus:border-vscode-accent"
              placeholder="Leave empty to use template name"
              disabled={isCreating}
            />
            <p className="text-xs text-vscode-text-muted mt-1">
              If empty, the template name will be used
            </p>
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
              disabled={!selectedTemplate || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create from Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateModal;