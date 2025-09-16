/**
 * Enhanced ChatBot Test Component
 * Simple test to verify the enhanced chatbot integration
 */

import React from 'react';
import { useEnhancedChatStore } from '../store/enhancedChatStore';
import { useProjectStore } from '../store/projectStore';

const EnhancedChatBotTest: React.FC = () => {
  const {
    mode,
    isApiKeyValid,
    selectedModel,
    setMode,
    canUseEditMode,
    isEditModeReady
  } = useEnhancedChatStore();

  const { currentProject } = useProjectStore();

  const testModeSwitch = () => {
    console.log('Testing mode switch...');
    console.log('Current mode:', mode);
    console.log('Has project:', !!currentProject);
    console.log('Can use edit mode:', canUseEditMode);
    console.log('Edit mode ready:', isEditModeReady);

    if (mode === 'chat') {
      setMode('edit');
    } else {
      setMode('chat');
    }
  };

  return (
    <div className="p-4 bg-vscode-panel border border-vscode-border rounded-lg">
      <h3 className="text-lg font-semibold text-vscode-text mb-4">Enhanced ChatBot Integration Test</h3>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-vscode-text-muted">Mode:</span>{' '}
          <span className={`font-medium ${mode === 'edit' ? 'text-green-400' : 'text-blue-400'}`}>
            {mode}
          </span>
        </div>

        <div>
          <span className="text-vscode-text-muted">API Key Valid:</span>{' '}
          <span className={`font-medium ${isApiKeyValid ? 'text-green-400' : 'text-red-400'}`}>
            {isApiKeyValid ? 'Yes' : 'No'}
          </span>
        </div>

        <div>
          <span className="text-vscode-text-muted">Selected Model:</span>{' '}
          <span className="font-medium text-vscode-text">
            {selectedModel || 'None'}
          </span>
        </div>

        <div>
          <span className="text-vscode-text-muted">Current Project:</span>{' '}
          <span className="font-medium text-vscode-text">
            {currentProject?.name || 'None'}
          </span>
        </div>

        <div>
          <span className="text-vscode-text-muted">Can Use Edit Mode:</span>{' '}
          <span className={`font-medium ${canUseEditMode ? 'text-green-400' : 'text-red-400'}`}>
            {canUseEditMode ? 'Yes' : 'No'}
          </span>
        </div>

        <div>
          <span className="text-vscode-text-muted">Edit Mode Ready:</span>{' '}
          <span className={`font-medium ${isEditModeReady ? 'text-green-400' : 'text-red-400'}`}>
            {isEditModeReady ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <button
        onClick={testModeSwitch}
        className="mt-4 px-4 py-2 bg-vscode-accent text-white rounded hover:bg-blue-600 transition-colors"
      >
        Toggle Mode (Current: {mode})
      </button>

      <div className="mt-4 text-xs text-vscode-text-muted">
        <p>✅ Enhanced ChatBot integration is active</p>
        <p>🔄 Mode switching: {canUseEditMode ? 'Available' : 'Requires project'}</p>
        <p>🤖 Auto-context: {mode === 'edit' ? 'Enabled' : 'Optional'}</p>
      </div>
    </div>
  );
};

export default EnhancedChatBotTest;