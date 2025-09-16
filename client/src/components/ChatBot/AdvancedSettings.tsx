/**
 * Advanced Settings Component
 * Handles streaming, temperature, and token settings
 */

import React from 'react';

interface AdvancedSettingsProps {
  useStreaming: boolean;
  maxTokens: number;
  temperature: number;
  onSetUseStreaming: (value: boolean) => void;
  onSetMaxTokens: (value: number) => void;
  onSetTemperature: (value: number) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  useStreaming,
  maxTokens,
  temperature,
  onSetUseStreaming,
  onSetMaxTokens,
  onSetTemperature
}) => {
  return (
    <div className="space-y-3">
      {/* Streaming Response */}
      <div>
        <label className="text-sm font-medium text-vscode-text mb-2 block">
          Streaming Response
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="streaming"
            checked={useStreaming}
            onChange={(e) => onSetUseStreaming(e.target.checked)}
            className="w-4 h-4 text-vscode-accent bg-vscode-editor border-vscode-border rounded focus:ring-vscode-accent focus:ring-2"
          />
          <label htmlFor="streaming" className="text-xs text-vscode-text">
            Enable real-time streaming responses
          </label>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <label className="text-sm font-medium text-vscode-text mb-2 block">
          Max Tokens: {maxTokens}
        </label>
        <input
          type="range"
          min="100"
          max="4000"
          step="100"
          value={maxTokens}
          onChange={(e) => onSetMaxTokens(parseInt(e.target.value))}
          className="w-full h-2 bg-vscode-border rounded-lg appearance-none cursor-pointer accent-vscode-accent"
        />
        <div className="flex justify-between text-xs text-vscode-text-muted mt-1">
          <span>100</span>
          <span>4000</span>
        </div>
      </div>

      {/* Temperature */}
      <div>
        <label className="text-sm font-medium text-vscode-text mb-2 block">
          Temperature: {temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => onSetTemperature(parseFloat(e.target.value))}
          className="w-full h-2 bg-vscode-border rounded-lg appearance-none cursor-pointer accent-vscode-accent"
        />
        <div className="flex justify-between text-xs text-vscode-text-muted mt-1">
          <span>0.0</span>
          <span>2.0</span>
        </div>
      </div>
    </div>
  );
};