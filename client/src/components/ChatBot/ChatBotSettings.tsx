/**
 * ChatBot Settings Panel Component
 * Aggregates all settings-related components
 */

import React from 'react';
import { ApiKeyManager } from './ApiKeyManager';
import { ModelSelector } from './ModelSelector';
import { AdvancedSettings } from './AdvancedSettings';

interface Model {
  id: string;
  name: string;
}

interface ChatBotSettingsProps {
  isVisible: boolean;
  apiKey: string | null;
  isApiKeyValid: boolean;
  models: Model[];
  selectedModel: string | null;
  isLoadingModels: boolean;
  useStreaming: boolean;
  maxTokens: number;
  temperature: number;
  onSetApiKey: (apiKey: string) => void;
  onClearApiKey: () => void;
  onSelectModel: (modelId: string) => void;
  onLoadModels: () => void;
  onSetUseStreaming: (value: boolean) => void;
  onSetMaxTokens: (value: number) => void;
  onSetTemperature: (value: number) => void;
}

export const ChatBotSettings: React.FC<ChatBotSettingsProps> = ({
  isVisible,
  apiKey,
  isApiKeyValid,
  models,
  selectedModel,
  isLoadingModels,
  useStreaming,
  maxTokens,
  temperature,
  onSetApiKey,
  onClearApiKey,
  onSelectModel,
  onLoadModels,
  onSetUseStreaming,
  onSetMaxTokens,
  onSetTemperature
}) => {
  if (!isVisible) return null;

  return (
    <div className="p-4 border-b border-vscode-border bg-vscode-bg space-y-4">
      {/* API Key Section */}
      <ApiKeyManager
        apiKey={apiKey}
        onSetApiKey={onSetApiKey}
        onClearApiKey={onClearApiKey}
      />

      {/* Model Selection */}
      {isApiKeyValid && (
        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          isLoading={isLoadingModels}
          onSelectModel={onSelectModel}
          onLoadModels={onLoadModels}
        />
      )}

      {/* Advanced Settings */}
      {isApiKeyValid && (
        <AdvancedSettings
          useStreaming={useStreaming}
          maxTokens={maxTokens}
          temperature={temperature}
          onSetUseStreaming={onSetUseStreaming}
          onSetMaxTokens={onSetMaxTokens}
          onSetTemperature={onSetTemperature}
        />
      )}
    </div>
  );
};