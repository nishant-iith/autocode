/**
 * ChatBot Floating Button Component
 * The minimized state button that opens the chat
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface ChatBotFloatingButtonProps {
  hasApiKey: boolean;
  onToggleChat: () => void;
}

export const ChatBotFloatingButton: React.FC<ChatBotFloatingButtonProps> = ({
  hasApiKey,
  onToggleChat
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onToggleChat}
        className="group relative bg-vscode-editor hover:bg-vscode-panel border-2 border-vscode-accent text-vscode-accent hover:text-white hover:bg-vscode-accent px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover-lift flex items-center space-x-2"
        title="AutoChat - AI Assistant"
      >
        <div className="relative">
          <Sparkles size={20} className="transition-transform duration-200 group-hover:scale-110" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <span className="text-sm font-medium hidden sm:block">AutoChat</span>
      </button>

      {/* Subtle hint for first-time users */}
      {!hasApiKey && (
        <div className="absolute bottom-full right-0 mb-2 bg-vscode-panel border border-vscode-border rounded-lg p-3 text-xs text-vscode-text-muted animate-in slide-in-from-bottom-1 fade-in duration-300 shadow-lg">
          <div className="flex items-center space-x-2">
            <Sparkles size={12} className="text-vscode-accent" />
            <span>AutoCode AI Assistant</span>
          </div>
        </div>
      )}
    </div>
  );
};