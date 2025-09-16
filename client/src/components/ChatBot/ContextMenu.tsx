/**
 * Context Menu Component
 * Handles adding file and project context to messages
 */

import React, { useEffect } from 'react';
import { FileText, FolderOpen, ChevronDown } from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  activeFileName?: string;
  projectName?: string;
  hasMessage: boolean;
  isTyping: boolean;
  onClose: () => void;
  onSendWithContext: (contextType: 'file' | 'project' | 'structure') => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  activeFileName,
  projectName,
  hasMessage,
  isTyping,
  onClose,
  onSendWithContext
}) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && target && !target.closest('.context-menu-container')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-vscode-panel border border-vscode-border rounded-lg shadow-lg p-2 min-w-48 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="text-xs text-vscode-text-muted mb-2 px-2">Add context:</div>

      {activeFileName && (
        <button
          onClick={() => onSendWithContext('file')}
          disabled={!hasMessage || isTyping}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-vscode-text hover:bg-vscode-border rounded-md transition-colors disabled:opacity-50"
        >
          <FileText size={16} className="text-blue-400" />
          <span>Current File</span>
          <span className="text-xs text-vscode-text-muted ml-auto">{activeFileName}</span>
        </button>
      )}

      {projectName && (
        <>
          <button
            onClick={() => onSendWithContext('project')}
            disabled={!hasMessage || isTyping}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-vscode-text hover:bg-vscode-border rounded-md transition-colors disabled:opacity-50"
          >
            <FolderOpen size={16} className="text-yellow-400" />
            <span>Project Files</span>
            <span className="text-xs text-vscode-text-muted ml-auto">{projectName}</span>
          </button>

          <button
            onClick={() => onSendWithContext('structure')}
            disabled={!hasMessage || isTyping}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-vscode-text hover:bg-vscode-border rounded-md transition-colors disabled:opacity-50"
          >
            <ChevronDown size={16} className="text-green-400" />
            <span>Project Structure</span>
            <span className="text-xs text-vscode-text-muted ml-auto">Tree view</span>
          </button>
        </>
      )}

      {!activeFileName && !projectName && (
        <div className="px-3 py-2 text-xs text-vscode-text-muted text-center">
          Open a project or file to add context
        </div>
      )}
    </div>
  );
};