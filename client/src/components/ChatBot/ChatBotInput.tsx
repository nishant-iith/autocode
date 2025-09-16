/**
 * ChatBot Input Component
 * Handles message input and sending functionality
 */

import React, { useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

interface ChatBotInputProps {
  message: string;
  isTyping: boolean;
  isApiKeyValid: boolean;
  selectedModel: string | null;
  activeFileName?: string;
  projectName?: string;
  showContextMenu: boolean;
  onMessageChange: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleContextMenu: () => void;
  onCloseContextMenu: () => void;
  onSendWithContext: (contextType: 'file' | 'project' | 'structure') => void;
}

export const ChatBotInput: React.FC<ChatBotInputProps> = ({
  message,
  isTyping,
  isApiKeyValid,
  selectedModel,
  activeFileName,
  projectName,
  showContextMenu,
  onMessageChange,
  onSubmit,
  onToggleContextMenu,
  onCloseContextMenu,
  onSendWithContext
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  if (!isApiKeyValid || !selectedModel) {
    return (
      <div className="p-3">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Configure API key to start chatting..."
              disabled={true}
              className="w-full px-4 py-3 bg-vscode-editor border border-vscode-border rounded-lg text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none opacity-50 cursor-not-allowed"
            />
          </div>
          <button
            type="button"
            disabled={true}
            className="p-3 bg-vscode-accent/50 text-white rounded-lg cursor-not-allowed opacity-50 flex items-center justify-center"
            title="Configure API key first"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="text-xs text-center text-vscode-text-muted mt-2">
          Click the settings button above to configure your API key
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="p-3">
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Ask AutoChat anything..."
            disabled={isTyping}
            className="w-full px-4 py-3 bg-vscode-editor border border-vscode-border rounded-lg text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:ring-2 focus:ring-vscode-accent/50 focus:border-vscode-accent disabled:opacity-50 transition-all duration-150"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-vscode-text-muted">
            {message.length > 0 && (
              <span className="bg-vscode-panel px-2 py-0.5 rounded text-xs">
                {isTyping ? 'Sending...' : 'Enter to send'}
              </span>
            )}
          </div>
        </div>

        {/* Context Menu Button */}
        {(activeFileName || projectName) && (
          <div className="relative context-menu-container">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleContextMenu();
              }}
              disabled={isTyping}
              className="p-3 bg-vscode-border text-vscode-text hover:bg-vscode-panel hover:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center hover-lift shadow-sm"
              title="Add context from current file or project"
            >
              <Plus size={18} />
            </button>

            <ContextMenu
              isOpen={showContextMenu}
              activeFileName={activeFileName}
              projectName={projectName}
              hasMessage={message.trim().length > 0}
              isTyping={isTyping}
              onClose={onCloseContextMenu}
              onSendWithContext={onSendWithContext}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!message.trim() || isTyping}
          className="p-3 bg-vscode-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center hover-lift shadow-sm"
          title="Send message to AutoChat"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
};