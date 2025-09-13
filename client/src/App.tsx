import { useState, useCallback, useEffect } from 'react';
import { useEditorStore } from './store/editorStore';
import { useProjectStore } from './store/projectStore';
import { useChatStore } from './store/chatStore';
import { useSidebarStore } from './store/sidebarStore';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import TabBar from './components/TabBar';
import Welcome from './components/Welcome';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import SettingsModal from './components/modals/SettingsModal';
import ChatBot from './components/ChatBot';
import { useHotkeys } from 'react-hotkeys-hook';

function App() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { activeFile, openTabs } = useEditorStore();
  const { currentProject } = useProjectStore();
  const { isOpen: isChatOpen, width: chatWidth, toggleChat, setWidth: setChatWidth } = useChatStore();
  const { toggleSidebar } = useSidebarStore();
  
  const [isResizingChat, setIsResizingChat] = useState(false);
  const MIN_CHAT_WIDTH = 300;
  const MAX_CHAT_WIDTH = 800;

  // Responsive chat width
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 768 && chatWidth > screenWidth * 0.9) {
        setChatWidth(Math.floor(screenWidth * 0.9));
      } else if (screenWidth >= 768 && chatWidth < MIN_CHAT_WIDTH) {
        setChatWidth(MIN_CHAT_WIDTH);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chatWidth, setChatWidth, MIN_CHAT_WIDTH]);

  useHotkeys('ctrl+shift+p', () => setShowCommandPalette(true), { preventDefault: true });
  useHotkeys('ctrl+comma', () => setShowSettings(true), { preventDefault: true });
  useHotkeys('ctrl+shift+c', () => toggleChat(), { preventDefault: true });
  useHotkeys('ctrl+b', () => toggleSidebar(), { preventDefault: true });
  useHotkeys('escape', () => {
    setShowCommandPalette(false);
    setShowSettings(false);
  });

  // Chat panel resize handlers
  const handleChatResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingChat(true);
  }, []);

  const handleChatResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingChat) return;
    
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= MIN_CHAT_WIDTH && newWidth <= MAX_CHAT_WIDTH) {
      setChatWidth(newWidth);
    }
  }, [isResizingChat, setChatWidth, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH]);

  const handleChatResizeMouseUp = useCallback(() => {
    setIsResizingChat(false);
  }, []);

  useEffect(() => {
    if (isResizingChat) {
      document.addEventListener('mousemove', handleChatResizeMouseMove);
      document.addEventListener('mouseup', handleChatResizeMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleChatResizeMouseMove);
      document.removeEventListener('mouseup', handleChatResizeMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingChat, handleChatResizeMouseMove, handleChatResizeMouseUp]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-vscode-text p-4 gap-4">
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Main AutoCode Area (Left Side) */}
        <div 
          className="flex flex-col flex-1 overflow-hidden bg-vscode-bg rounded-xl shadow-xl border border-vscode-border/50"
          style={{ 
            width: isChatOpen ? `calc(100% - ${chatWidth + 16}px)` : '100%'
          }}
        >
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
          
          {/* Status Bar - Only for AutoCode */}
          <div className="border-t border-vscode-border">
            <StatusBar />
          </div>
        </div>

        {/* AutoChat Panel (Right Side) */}
        {isChatOpen && (
          <div className="relative flex">
            {/* Resize Handle */}
            <div
              className={`w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-400/20 transition-colors duration-200 group flex items-center justify-center ${
                isResizingChat ? 'bg-blue-400/30' : ''
              }`}
              onMouseDown={handleChatResizeMouseDown}
              title="Drag to resize chat panel"
            >
              <div className={`w-1 h-12 rounded-full transition-all duration-200 ${
                isResizingChat 
                  ? 'bg-blue-400 h-20' 
                  : 'bg-slate-600 group-hover:bg-blue-400/50'
              }`} />
            </div>
            
            {/* Chat Panel */}
            <div 
              className="bg-vscode-panel rounded-xl shadow-xl border border-vscode-border/50 overflow-hidden"
              style={{ width: chatWidth }}
            >
              <ChatBot />
            </div>
          </div>
        )}
      </div>
      
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