import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Files, Search, Settings, FolderOpen } from 'lucide-react';
import FileTree from './FileTree';
import ProjectList from './ProjectList';
import { useProjectStore } from '../store/projectStore';
import { useSidebarStore } from '../store/sidebarStore';

interface SidebarProps {
  onOpenSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProjectStore();
  const { activeTab, isCollapsed, width, setActiveTab, setWidth } = useSidebarStore();

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX - 48; // 48px is the icon bar width
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setWidth(newWidth);
    }
  }, [isResizing, setWidth, MIN_WIDTH, MAX_WIDTH]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const tabs = [
    { id: 'files' as const, icon: Files, label: 'Files' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'projects' as const, icon: FolderOpen, label: 'Projects' },
  ];

  return (
    <div className="flex h-full">
      <div className="w-12 bg-vscode-panel border-r border-vscode-border flex flex-col flex-shrink-0 rounded-l-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative p-3 transition-all duration-200 ease-out hover-lift
              ${
                activeTab === tab.id && !isCollapsed
                  ? 'bg-vscode-border text-white shadow-sm' 
                  : 'text-vscode-text-muted hover:text-white hover:bg-vscode-border/70'
              }
            `}
            title={tab.label}
          >
            <tab.icon 
              size={20} 
              className={`transition-all duration-200 ${
                activeTab === tab.id && !isCollapsed ? 'scale-110' : 'hover:scale-105'
              }`} 
            />
            {activeTab === tab.id && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-400 animate-in slide-in-from-left-1 duration-200" />
            )}
          </button>
        ))}
        
        <div className="mt-auto">
          <button
            onClick={onOpenSettings}
            className="p-3 text-vscode-text-muted hover:text-white hover:bg-vscode-border/70 transition-all duration-200 hover-lift"
            title="Settings (Ctrl+,)"
          >
            <Settings size={20} className="transition-transform duration-200 hover:scale-105 hover:rotate-90" />
          </button>
        </div>
      </div>

      {!isCollapsed && activeTab && (
        <div 
          ref={sidebarRef}
          className="bg-vscode-sidebar border-r border-vscode-border flex-shrink-0 overflow-hidden relative transition-all duration-200 ease-in-out"
          style={{ width }}
        >
        {activeTab === 'files' && (
          <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="p-4 border-b border-vscode-border bg-gradient-to-r from-vscode-sidebar to-vscode-panel/50">
              <h2 className="text-sm font-semibold text-vscode-text uppercase tracking-wider flex items-center space-x-2">
                <Files size={14} className="text-blue-400" />
                <span>{currentProject ? currentProject.name : 'Explorer'}</span>
              </h2>
              {currentProject && (
                <p className="text-xs text-vscode-text-muted mt-1 truncate">
                  {currentProject.description || 'No description'}
                </p>
              )}
            </div>
            <FileTree />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="h-full animate-in fade-in slide-in-from-right-2 duration-300">
            <div className="p-4 border-b border-vscode-border bg-gradient-to-r from-vscode-sidebar to-vscode-panel/50">
              <h2 className="text-sm font-semibold text-vscode-text uppercase tracking-wider flex items-center space-x-2 mb-4">
                <Search size={14} className="text-green-400" />
                <span>Search</span>
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search files and content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2.5 pl-9 bg-vscode-editor border border-vscode-border rounded-md text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 transition-all duration-200"
                />
                <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-vscode-text-muted" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              {searchQuery ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Search size={24} className="text-yellow-400" />
                  </div>
                  <p className="text-sm text-vscode-text-muted mb-2">Searching for "{searchQuery}"</p>
                  <p className="text-xs text-vscode-text-muted/70">Search functionality coming soon...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-vscode-border/30 rounded-full flex items-center justify-center">
                    <Search size={24} className="text-vscode-text-muted/50" />
                  </div>
                  <p className="text-sm text-vscode-text-muted mb-2">Search across your project</p>
                  <p className="text-xs text-vscode-text-muted/70">Enter a search term above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <ProjectList />
          </div>
        )}

        {/* Resize Handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-400/20 transition-all duration-200 group ${
            isResizing ? 'bg-blue-400/30' : ''
          }`}
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
        >
          <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-0.5 h-8 transition-all duration-200 ${
            isResizing 
              ? 'bg-blue-400 h-16' 
              : 'bg-vscode-border group-hover:bg-blue-400/50'
          }`} />
        </div>
        </div>
      )}

      {/* Collapse/Expand indicator */}
      {isCollapsed && activeTab && (
        <div className="w-0.5 bg-blue-400 h-full animate-in slide-in-from-right-1 duration-200" />
      )}
    </div>
  );
};

export default Sidebar;