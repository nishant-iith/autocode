import React, { useState, useEffect } from 'react';
import { useEditorStore } from './store/editorStore';
import { useProjectStore } from './store/projectStore';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import TabBar from './components/TabBar';
import Welcome from './components/Welcome';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import SettingsModal from './components/modals/SettingsModal';
import { useHotkeys } from 'react-hotkeys-hook';

function App() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { activeFile, openTabs } = useEditorStore();
  const { currentProject } = useProjectStore();

  useHotkeys('ctrl+shift+p', () => setShowCommandPalette(true), { preventDefault: true });
  useHotkeys('ctrl+comma', () => setShowSettings(true), { preventDefault: true });
  useHotkeys('escape', () => {
    setShowCommandPalette(false);
    setShowSettings(false);
  });

  return (
    <div className="flex flex-col h-screen bg-vscode-bg text-vscode-text">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onOpenSettings={() => setShowSettings(true)} />
        
        <div className="flex flex-col flex-1">
          {openTabs.length > 0 && <TabBar />}
          
          <div className="flex-1 relative">
            {currentProject && activeFile ? (
              <Editor />
            ) : (
              <Welcome />
            )}
          </div>
        </div>
      </div>
      
      <StatusBar />
      
      {showCommandPalette && (
        <CommandPalette 
          onClose={() => setShowCommandPalette(false)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;