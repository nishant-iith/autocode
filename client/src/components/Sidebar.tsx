import React, { useState } from 'react';
import { Files, Search, Settings, FolderOpen } from 'lucide-react';
import FileTree from './FileTree';
import ProjectList from './ProjectList';
import { useProjectStore } from '../store/projectStore';

interface SidebarProps {
  onOpenSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'projects'>('files');
  const { currentProject } = useProjectStore();

  const tabs = [
    { id: 'files' as const, icon: Files, label: 'Files' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'projects' as const, icon: FolderOpen, label: 'Projects' },
  ];

  return (
    <div className="flex h-full">
      <div className="w-12 bg-vscode-panel border-r border-vscode-border flex flex-col">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 hover:bg-vscode-border transition-colors ${
              activeTab === tab.id ? 'bg-vscode-border text-white' : 'text-vscode-text-muted'
            }`}
            title={tab.label}
          >
            <tab.icon size={20} />
          </button>
        ))}
        
        <div className="mt-auto">
          <button
            onClick={onOpenSettings}
            className="p-3 text-vscode-text-muted hover:bg-vscode-border transition-colors"
            title="Settings (Ctrl+,)"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="w-64 bg-vscode-sidebar border-r border-vscode-border">
        {activeTab === 'files' && (
          <div className="h-full">
            <div className="p-3 border-b border-vscode-border">
              <h2 className="text-sm font-medium text-vscode-text uppercase tracking-wider">
                {currentProject ? currentProject.name : 'Explorer'}
              </h2>
            </div>
            <FileTree />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="p-3">
            <div className="border-b border-vscode-border pb-3 mb-3">
              <h2 className="text-sm font-medium text-vscode-text uppercase tracking-wider mb-3">
                Search
              </h2>
              <input
                type="text"
                placeholder="Search files..."
                className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-sm focus:outline-none focus:border-vscode-accent"
              />
            </div>
            <p className="text-vscode-text-muted text-sm">
              Search functionality coming soon...
            </p>
          </div>
        )}

        {activeTab === 'projects' && <ProjectList />}
      </div>
    </div>
  );
};

export default Sidebar;