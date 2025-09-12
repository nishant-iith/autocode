import React from 'react';
import { AlertCircle, CheckCircle, GitBranch, Save, Clock } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';

interface StatusBarProps {}

const StatusBar: React.FC<StatusBarProps> = () => {
  const { 
    activeFile, 
    autosaveEnabled, 
    autosaveDelay, 
    isSaving, 
    lastSaved 
  } = useEditorStore();
  const { currentProject } = useProjectStore();

  const getFileInfo = () => {
    if (!activeFile) return null;

    const lines = activeFile.content.split('\n').length;
    const chars = activeFile.content.length;
    const ext = activeFile.name.split('.').pop()?.toUpperCase();

    return { lines, chars, ext };
  };

  const fileInfo = getFileInfo();
  
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just saved';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `Saved ${minutes}m ago`;
    } else {
      const hours = Math.floor(diff / 3600000);
      return `Saved ${hours}h ago`;
    }
  };

  return (
    <div className="h-6 bg-vscode-accent text-white flex items-center justify-between px-2 sm:px-3 text-xs overflow-hidden">
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {currentProject && (
          <>
            <div className="flex items-center space-x-1 min-w-0">
              <GitBranch size={12} />
              <span className="truncate">{currentProject.name}</span>
            </div>
            <div className="w-px h-4 bg-white bg-opacity-30 hidden sm:block" />
          </>
        )}
        
        <div className="flex items-center space-x-1">
          <CheckCircle size={12} />
          <span className="hidden sm:inline">AutoCode Ready</span>
          <span className="sm:hidden">Ready</span>
        </div>
        
        <div className="w-px h-4 bg-white bg-opacity-30 hidden sm:block" />
        
        {/* Autosave Status */}
        <div className="flex items-center space-x-1">
          {isSaving ? (
            <>
              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : autosaveEnabled ? (
            <>
              <Save size={12} />
              <span className="hidden sm:inline">Autosave: {autosaveDelay / 1000}s</span>
              <span className="sm:hidden">{autosaveDelay / 1000}s</span>
            </>
          ) : (
            <>
              <Clock size={12} />
              <span className="hidden sm:inline">Manual save</span>
              <span className="sm:hidden">Manual</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {activeFile && fileInfo && (
          <>
            <span className="hidden md:inline">{fileInfo.ext}</span>
            <div className="w-px h-4 bg-white bg-opacity-30 hidden md:block" />
            <span className="hidden lg:inline">Lines: {fileInfo.lines}</span>
            <span className="lg:hidden hidden sm:inline">{fileInfo.lines}L</span>
            <div className="w-px h-4 bg-white bg-opacity-30 hidden sm:block" />
            <span className="hidden lg:inline">Chars: {fileInfo.chars}</span>
            <span className="lg:hidden hidden sm:inline">{fileInfo.chars}C</span>
            <div className="w-px h-4 bg-white bg-opacity-30 hidden sm:block" />
            <span className="truncate max-w-32 sm:max-w-none">{activeFile.name}</span>
            
            {/* Show last saved time */}
            {activeFile.path && lastSaved[activeFile.path] && (
              <>
                <div className="w-px h-4 bg-white bg-opacity-30 hidden sm:block" />
                <span className="hidden sm:inline">{formatLastSaved(lastSaved[activeFile.path])}</span>
              </>
            )}
            
            {activeFile.isDirty && !isSaving && (
              <>
                <div className="w-px h-4 bg-white bg-opacity-30 hidden sm:block" />
                <div className="flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span className="hidden sm:inline">Unsaved</span>
                </div>
              </>
            )}
          </>
        )}
        
      </div>
    </div>
  );
};

export default StatusBar;