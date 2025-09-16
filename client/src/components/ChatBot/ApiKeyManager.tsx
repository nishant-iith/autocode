/**
 * API Key Manager Component
 * Handles API key input, display, and management
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface ApiKeyManagerProps {
  apiKey: string | null;
  onSetApiKey: (apiKey: string) => void;
  onClearApiKey: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  apiKey,
  onSetApiKey,
  onClearApiKey
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSetApiKey = () => {
    if (apiKeyInput.trim()) {
      onSetApiKey(apiKeyInput.trim());
      setApiKeyInput('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-vscode-text">API Key</label>
        {apiKey && (
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            className="text-xs text-vscode-text-muted hover:text-vscode-text"
          >
            {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
      </div>

      {apiKey ? (
        <div className="flex items-center space-x-2">
          <div className="flex-1 px-2 py-1 bg-vscode-editor border border-vscode-border rounded text-xs text-vscode-text font-mono truncate">
            {showApiKey ? apiKey : '••••••••••••••••'}
          </div>
          <button
            onClick={onClearApiKey}
            className="p-1 text-red-400 hover:text-red-300 transition-colors"
            title="Clear API Key"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-or-..."
              className="flex-1 px-2 py-1 bg-vscode-editor border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:border-vscode-accent"
              onKeyPress={(e) => e.key === 'Enter' && handleSetApiKey()}
            />
            <button
              onClick={handleSetApiKey}
              disabled={!apiKeyInput.trim()}
              className="px-3 py-1 bg-vscode-accent text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-vscode-text-muted">
            Get your free API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vscode-accent hover:underline"
            >
              OpenRouter
            </a>
          </p>
        </div>
      )}
    </div>
  );
};