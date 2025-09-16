/**
 * ChatBot Header Component
 * Handles the top bar with title, controls, and settings toggle
 */

import React from 'react';
import { X, Settings, Trash2, Sparkles } from 'lucide-react';

interface ChatBotHeaderProps {
  messagesCount: number;
  showSettings: boolean;
  onToggleSettings: () => void;
  onClearMessages: () => void;
  onClose: () => void;
}

export const ChatBotHeader: React.FC<ChatBotHeaderProps> = ({
  messagesCount,
  showSettings,
  onToggleSettings,
  onClearMessages,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-vscode-border bg-gradient-to-r from-vscode-panel to-vscode-sidebar">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Sparkles className="text-vscode-accent" size={20} />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-vscode-text">AutoChat</h3>
          <div className="text-xs text-vscode-text-muted bg-vscode-border px-2 py-1 rounded-md">
            AI Assistant
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {messagesCount > 0 && (
          <button
            onClick={onClearMessages}
            className="p-2 hover:bg-vscode-border/70 rounded-lg text-vscode-text-muted hover:text-vscode-text transition-all duration-150 hover-lift"
            title="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          onClick={onToggleSettings}
          className={`p-2 hover:bg-vscode-border/70 rounded-lg text-vscode-text-muted hover:text-vscode-text transition-all duration-150 hover-lift ${
            showSettings ? 'bg-vscode-border/50 text-vscode-text' : ''
          }`}
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-vscode-text-muted transition-all duration-150 hover-lift"
          title="Close AutoChat"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};