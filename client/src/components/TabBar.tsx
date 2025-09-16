import React, { useCallback } from 'react';
import { X, Circle, FileText, Sparkles } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';

const getFileIconColor = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const colorMap: { [key: string]: string } = {
    'js': 'text-yellow-400',
    'jsx': 'text-blue-400',
    'ts': 'text-blue-500',
    'tsx': 'text-blue-400',
    'json': 'text-yellow-300',
    'html': 'text-orange-400',
    'css': 'text-blue-400',
    'scss': 'text-pink-400',
    'md': 'text-gray-300',
    'py': 'text-green-400',
    'java': 'text-red-500',
    'cpp': 'text-blue-600',
    'c': 'text-blue-500',
    'go': 'text-cyan-400',
    'rs': 'text-orange-500',
    'php': 'text-purple-400',
    'rb': 'text-red-400',
    'sh': 'text-green-400',
    'yml': 'text-yellow-400',
    'yaml': 'text-yellow-400',
    'xml': 'text-orange-300',
    'sql': 'text-blue-300',
  };
  
  return colorMap[ext || ''] || 'text-gray-400';
};

const TabBar: React.FC = () => {
  const { openTabs, activeFile, setActiveFile, closeFile } = useEditorStore();
  
  const handleTabClick = useCallback((path: string) => {
    setActiveFile(path);
  }, [setActiveFile]);
  
  const handleCloseTab = useCallback((e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    closeFile(path);
  }, [closeFile]);

  if (openTabs.length === 0) return null;

  return (
    <div className="flex bg-vscode-panel border-b border-vscode-border overflow-x-auto vscode-scrollbar scrollbar-hide">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            flex items-center min-w-0 border-r border-vscode-border cursor-pointer group relative
            transition-all duration-200 ease-out hover-lift
            ${
              activeFile?.path === tab.path
                ? 'bg-vscode-editor text-vscode-text shadow-sm'
                : 'bg-vscode-panel text-vscode-text-muted hover:bg-vscode-border/70 hover:text-vscode-text'
            }
          `}
          onClick={() => handleTabClick(tab.path)}
        >
          {/* Active tab indicator */}
          {activeFile?.path === tab.path && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 animate-in slide-in-from-top-1 duration-200" />
          )}
          
          <div className="flex items-center px-4 py-2.5 min-w-0 flex-1">
            <div className="relative mr-2.5">
              <FileText
                size={14}
                className={`transition-all duration-200 ${
                  getFileIconColor(tab.name)
                } ${
                  activeFile?.path === tab.path ? 'scale-110' : 'group-hover:scale-105'
                }`}
              />
              {tab.isAIModified && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles
                    size={8}
                    className="text-purple-400 animate-pulse"
                  />
                </div>
              )}
            </div>
            <span className={`
              text-sm truncate flex-1 transition-all duration-200
              ${
                activeFile?.path === tab.path
                  ? 'font-medium'
                  : 'font-normal group-hover:font-medium'
              }
              ${tab.isAIModified ? 'text-purple-300' : ''}
            `}>
              {tab.name}
            </span>
            <div className="ml-2 flex items-center space-x-1">
              {tab.isAIModified && (
                <div
                  className="flex items-center text-purple-400"
                  title={`AI modified ${tab.lastAIModification ? new Date(tab.lastAIModification).toLocaleTimeString() : 'recently'}`}
                >
                  <Sparkles size={10} className="animate-pulse" />
                </div>
              )}
              {tab.isDirty && (
                <Circle
                  size={6}
                  className="fill-orange-400 text-orange-400 animate-pulse"
                  fill="currentColor"
                />
              )}
            </div>
          </div>
          
          <button
            onClick={(e) => handleCloseTab(e, tab.path)}
            className={`
              p-1.5 mr-2 hover:bg-red-500/20 rounded-md transition-all duration-200
              ${
                activeFile?.path === tab.path 
                  ? 'opacity-70 hover:opacity-100' 
                  : 'opacity-0 group-hover:opacity-100'
              }
              hover:scale-110 hover:text-red-400
            `}
            title="Close tab (Ctrl+W)"
          >
            <X size={12} className="transition-transform duration-150" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar;