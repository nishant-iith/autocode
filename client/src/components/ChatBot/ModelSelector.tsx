/**
 * Model Selector Component
 * Handles AI model selection and loading
 */

import React from 'react';
import { Loader } from 'lucide-react';

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  models: Model[];
  selectedModel: string | null;
  isLoading: boolean;
  onSelectModel: (modelId: string) => void;
  onLoadModels: () => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  isLoading,
  onSelectModel,
  onLoadModels
}) => {
  return (
    <div>
      <label className="text-sm font-medium text-vscode-text mb-2 block">
        Model
      </label>

      {isLoading ? (
        <div className="flex items-center space-x-2 text-vscode-text-muted">
          <Loader className="animate-spin" size={14} />
          <span className="text-xs">Loading models...</span>
        </div>
      ) : models.length > 0 ? (
        <select
          value={selectedModel || ''}
          onChange={(e) => onSelectModel(e.target.value)}
          className="w-full px-2 py-1 bg-vscode-editor border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:border-vscode-accent"
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-xs text-vscode-text-muted space-y-1">
          <div>No models available.</div>
          <div>
            <button
              onClick={onLoadModels}
              className="text-vscode-accent hover:underline mr-2"
            >
              Retry
            </button>
            or{' '}
            <a
              href="https://openrouter.ai/settings/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vscode-accent hover:underline"
            >
              Configure Privacy Settings
            </a>
          </div>
        </div>
      )}
    </div>
  );
};