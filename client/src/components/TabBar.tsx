import React from 'react';
import { X, Circle } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconMap: { [key: string]: string } = {
    'js': '📄',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',
    'json': '📋',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'md': '📝',
    'py': '🐍',
    'java': '☕',
    'cpp': '⚙️',
    'c': '⚙️',
    'go': '🐹',
    'rs': '🦀',
    'php': '🐘',
    'rb': '💎',
    'sh': '📜',
    'yml': '⚙️',
    'yaml': '⚙️',
    'xml': '📄',
    'sql': '🗄️',
  };
  
  return iconMap[ext || ''] || '📄';
};

const TabBar: React.FC = () => {
  const { openTabs, activeFile, setActiveFile, closeFile } = useEditorStore();

  if (openTabs.length === 0) return null;

  return (
    <div className="flex bg-vscode-panel border-b border-vscode-border overflow-x-auto vscode-scrollbar">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center min-w-0 border-r border-vscode-border cursor-pointer group ${
            activeFile?.path === tab.path
              ? 'bg-vscode-editor text-vscode-text'
              : 'bg-vscode-panel text-vscode-text-muted hover:bg-vscode-border'
          }`}
          onClick={() => setActiveFile(tab.path)}
        >
          <div className="flex items-center px-3 py-2 min-w-0 flex-1">
            <span className="mr-2 text-sm">
              {getFileIcon(tab.name)}
            </span>
            <span className="text-sm truncate flex-1">
              {tab.name}
            </span>
            {tab.isDirty && (
              <Circle 
                size={8} 
                className="ml-2 fill-white text-white" 
                fill="currentColor"
              />
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeFile(tab.path);
            }}
            className="p-1 mr-1 hover:bg-vscode-border rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar;