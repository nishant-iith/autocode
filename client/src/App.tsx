import { useState, useCallback, useEffect, useMemo } from 'react';
import { throttle } from './utils/throttle';
import { useEditorStore } from './store/editorStore';
import { useProjectStore } from './store/projectStore';
import { useEnhancedChatStore } from './store/enhancedChatStore';
import { useSidebarStore } from './store/sidebarStore';
import { WebContainerProvider } from './providers/WebContainerProvider';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import TabBar from './components/TabBar';
import Welcome from './components/Welcome';
import EnhancedPreview from './components/EnhancedPreview';
import StatusBar from './components/StatusBar';
import CommandPalette from './components/CommandPalette';
import SettingsModal from './components/modals/SettingsModal';
import EnhancedChatBot from './components/EnhancedChatBot';
import { useAIFileSync } from './services/aiFileSyncService';
import { useHotkeys } from 'react-hotkeys-hook';
import { MessageCircle } from 'lucide-react';

function App() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { activeFile, openTabs } = useEditorStore();
  const { currentProject } = useProjectStore();
  const { isOpen: isChatOpen, width: chatWidth, toggleChat, setWidth: setChatWidth } = useEnhancedChatStore();
  const { toggleSidebar, activeTab } = useSidebarStore();
  const { connect, joinWorkspace, leaveWorkspace } = useAIFileSync();

  const [isResizingChat, setIsResizingChat] = useState(false);
  const MIN_CHAT_WIDTH = 300;
  const MAX_CHAT_WIDTH = 800;

  // Initialize AI File Sync service
  useEffect(() => {
    connect();
  }, [connect]);

  // Handle workspace changes for AI sync
  useEffect(() => {
    if (currentProject?.workspaceId) {
      joinWorkspace(currentProject.workspaceId);
    } else {
      leaveWorkspace();
    }
  }, [currentProject?.workspaceId, joinWorkspace, leaveWorkspace]);

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

  const throttledSetChatWidth = useMemo(
    () => throttle(setChatWidth, 16), // ~60fps
    [setChatWidth]
  );

  const handleChatResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingChat) return;

    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= MIN_CHAT_WIDTH && newWidth <= MAX_CHAT_WIDTH) {
      throttledSetChatWidth(newWidth);
    }
  }, [isResizingChat, throttledSetChatWidth, MIN_CHAT_WIDTH, MAX_CHAT_WIDTH]);

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
    <WebContainerProvider>
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
                {openTabs.length > 0 && activeTab !== 'preview' && <TabBar />}

                <div className="flex-1 relative">
                  {activeTab === 'preview' ? (
                    <EnhancedPreview />
                  ) : currentProject ? (
                    activeFile ? (
                      <Editor />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-vscode-text-muted">
                        <div className="w-16 h-16 mb-4 bg-vscode-panel rounded-full flex items-center justify-center">
                          <MessageCircle size={32} className="opacity-50" />
                        </div>
                        <p className="font-medium">No file is open</p>
                        <p className="text-sm mt-2 opacity-70">Select a file from the sidebar to start editing</p>
                        <p className="text-xs mt-4 opacity-50">or use AutoChat to generate code</p>
                      </div>
                    )
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
                className={`w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-400/20 transition-colors duration-200 group flex items-center justify-center ${isResizingChat ? 'bg-blue-400/30' : ''
                  }`}
                onMouseDown={handleChatResizeMouseDown}
                title="Drag to resize chat panel"
              >
                <div className={`w-1 h-12 rounded-full transition-all duration-200 ${isResizingChat
                  ? 'bg-blue-400 h-20'
                  : 'bg-slate-600 group-hover:bg-blue-400/50'
                  }`} />
              </div>

              {/* Chat Panel */}
              <div
                className="bg-vscode-panel rounded-xl shadow-xl border border-vscode-border/50 overflow-hidden"
                style={{ width: chatWidth }}
              >
                <EnhancedChatBot />
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

        {/* Floating Chat Button - Only show when chat is closed */}
        {!isChatOpen && (
          <button
            onClick={toggleChat}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50"
            title="Open Enhanced AutoChat (Ctrl+Shift+C)"
          >
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform duration-200" />

            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20"></div>
          </button>
        )}
      </div>
    </WebContainerProvider>
  );
}

export default App;