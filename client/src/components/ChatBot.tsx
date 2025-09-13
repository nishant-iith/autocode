import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Settings, 
  Key, 
  Loader, 
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  FileText,
  FolderOpen,
  ChevronDown,
  Plus
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore, FileNode } from '../store/projectStore';
import ChatMessage from './ChatMessage';

const ChatBot: React.FC = () => {
  const {
    isOpen,
    error,
    apiKey,
    isApiKeyValid,
    freeModels,
    selectedModel,
    isLoadingModels,
    messages,
    isTyping,
    useStreaming,
    maxTokens,
    temperature,
    toggleChat,
    closeChat,
    setApiKey,
    clearApiKey,
    loadModels,
    selectModel,
    sendMessage,
    sendMessageWithContext,
    clearMessages,
    setError,
    setMaxTokens,
    setTemperature,
    setUseStreaming,
  } = useChatStore();

  const { activeFile } = useEditorStore();
  const { currentProject, fileTree } = useProjectStore();


  const [inputMessage, setInputMessage] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showContextMenu && target && !target.closest('.context-menu-container')) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleSendWithContext = async (contextType: 'file' | 'project' | 'structure') => {
    if (!inputMessage.trim()) {
      setError('Please enter a message first');
      return;
    }
    
    if (isTyping) return;

    let context = '';
    
    if (contextType === 'file' && activeFile) {
      context = `File: ${activeFile.name}\n\nContent:\n${activeFile.content}`;
    } else if (contextType === 'project' && currentProject) {
      const flattenFiles = (nodes: FileNode[], prefix = ''): string[] => {
        return nodes.flatMap((node: FileNode) => {
          const fullPath = prefix + node.name;
          if (node.type === 'file') {
            return [`${fullPath}: [File]`];
          } else {
            const childFiles = node.children ? flattenFiles(node.children, fullPath + '/') : [];
            return [`${fullPath}: [Directory]`, ...childFiles];
          }
        });
      };
      const projectFiles = flattenFiles(fileTree).join('\n');
      context = `Project: ${currentProject.name}\n\nDescription: ${currentProject.description || 'No description'}\n\nFiles:\n${projectFiles}`;
    } else if (contextType === 'structure' && currentProject) {
      const flattenStructure = (nodes: FileNode[], prefix = ''): string[] => {
        return nodes.flatMap((node: FileNode) => {
          const fullPath = prefix + node.name;
          const icon = node.type === 'file' ? '📄' : '📁';
          if (node.type === 'folder' && node.children) {
            return [`${icon} ${fullPath}/`, ...flattenStructure(node.children, fullPath + '/')];
          }
          return [`${icon} ${fullPath}`];
        });
      };
      const structure = flattenStructure(fileTree).join('\n');
      context = `Project Structure for ${currentProject.name}:\n\n${structure}`;
    }

    if (!context) {
      setError('No context available for the selected type');
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');
    setShowContextMenu(false);
    
    try {
      await sendMessageWithContext(message, context);
    } catch (error) {
      setError('Failed to send message with context');
    }
  };

  const handleSetApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setApiKeyInput('');
    }
  };


  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="group relative bg-vscode-editor hover:bg-vscode-panel border-2 border-vscode-accent text-vscode-accent hover:text-white hover:bg-vscode-accent px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover-lift flex items-center space-x-2"
          title="AutoChat - AI Assistant"
        >
          <div className="relative">
            <Sparkles size={20} className="transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm font-medium hidden sm:block">AutoChat</span>
        </button>
        
        {/* Subtle hint for first-time users */}
        {!apiKey && (
          <div className="absolute bottom-full right-0 mb-2 bg-vscode-panel border border-vscode-border rounded-lg p-3 text-xs text-vscode-text-muted animate-in slide-in-from-bottom-1 fade-in duration-300 shadow-lg">
            <div className="flex items-center space-x-2">
              <Sparkles size={12} className="text-vscode-accent" />
              <span>AutoCode AI Assistant</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-vscode-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-vscode-border bg-gradient-to-r from-vscode-panel to-vscode-sidebar">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Sparkles className="text-vscode-accent" size={20} />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-vscode-text">AutoChat</h3>
            <div className="text-xs text-vscode-text-muted bg-vscode-border px-2 py-1 rounded-md">AI Assistant</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 hover:bg-vscode-border/70 rounded-lg text-vscode-text-muted hover:text-vscode-text transition-all duration-150 hover-lift"
              title="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 hover:bg-vscode-border/70 rounded-lg text-vscode-text-muted hover:text-vscode-text transition-all duration-150 hover-lift ${showSettings ? 'bg-vscode-border/50 text-vscode-text' : ''}`}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={closeChat}
            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-vscode-text-muted transition-all duration-150 hover-lift"
            title="Close AutoChat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-vscode-border bg-vscode-bg space-y-4">
          {/* API Key Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-vscode-text">API Key</label>
              {apiKey && (
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-xs text-vscode-text-muted hover:text-vscode-text"
                >
                  {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              )}
            </div>
            
            {apiKey ? (
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-2 py-1 bg-vscode-editor border border-vscode-border rounded text-xs text-vscode-text font-mono truncate">
                  {showApiKey ? apiKey : '••••••••••••••••'}
                </div>
                <button
                  onClick={clearApiKey}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  title="Clear API Key"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-or-..."
                    className="flex-1 px-2 py-1 bg-vscode-editor border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:border-vscode-accent"
                    onKeyPress={(e) => e.key === 'Enter' && handleSetApiKey()}
                  />
                  <button
                    onClick={handleSetApiKey}
                    disabled={!apiKeyInput.trim()}
                    className="px-3 py-1 bg-vscode-accent text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs text-vscode-text-muted">
                  Get your free API key from{' '}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vscode-accent hover:underline"
                  >
                    OpenRouter
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Model Selection */}
          {isApiKeyValid && (
            <div>
              <label className="text-sm font-medium text-vscode-text mb-2 block">
                Model
              </label>
              {isLoadingModels ? (
                <div className="flex items-center space-x-2 text-vscode-text-muted">
                  <Loader className="animate-spin" size={14} />
                  <span className="text-xs">Loading models...</span>
                </div>
              ) : freeModels.length > 0 ? (
                <select
                  value={selectedModel || ''}
                  onChange={(e) => selectModel(e.target.value)}
                  className="w-full px-2 py-1 bg-vscode-editor border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:border-vscode-accent"
                >
                  {freeModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-vscode-text-muted space-y-1">
                  <div>No models available.</div>
                  <div>
                    <button
                      onClick={loadModels}
                      className="text-vscode-accent hover:underline mr-2"
                    >
                      Retry
                    </button>
                    or{' '}
                    <a
                      href="https://openrouter.ai/settings/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-vscode-accent hover:underline"
                    >
                      Configure Privacy Settings
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Settings */}
          {isApiKeyValid && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-vscode-text mb-2 block">
                  Streaming Response
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="streaming"
                    checked={useStreaming}
                    onChange={(e) => setUseStreaming(e.target.checked)}
                    className="w-4 h-4 text-vscode-accent bg-vscode-editor border-vscode-border rounded focus:ring-vscode-accent focus:ring-2"
                  />
                  <label htmlFor="streaming" className="text-xs text-vscode-text">
                    Enable real-time streaming responses
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-vscode-text mb-2 block">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full h-2 bg-vscode-border rounded-lg appearance-none cursor-pointer accent-vscode-accent"
                />
                <div className="flex justify-between text-xs text-vscode-text-muted mt-1">
                  <span>100</span>
                  <span>4000</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-vscode-text mb-2 block">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-vscode-border rounded-lg appearance-none cursor-pointer accent-vscode-accent"
                />
                <div className="flex justify-between text-xs text-vscode-text-muted mt-1">
                  <span>0.0</span>
                  <span>2.0</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded flex items-start space-x-2 text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-xs">{error}</div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-300 hover:text-red-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 vscode-scrollbar">
        {!isApiKeyValid ? (
          <div className="text-center text-vscode-text-muted space-y-4 py-12">
            <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-vscode-panel to-vscode-border rounded-xl flex items-center justify-center border border-vscode-border shadow-lg">
              <Key size={28} className="text-vscode-accent" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-vscode-text">Welcome to AutoChat</p>
              <p className="text-sm text-vscode-text-muted px-6">AutoCode's intelligent AI assistant is ready to help you with coding, debugging, and development questions.</p>
              <p className="text-xs text-vscode-text-muted">Configure your OpenRouter API key to get started</p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-vscode-accent text-white rounded-lg hover:bg-blue-600 transition-all duration-200 hover-lift shadow-sm"
            >
              <Settings size={16} />
              <span>Configure API Key</span>
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-vscode-text-muted space-y-4 py-8">
            <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-vscode-accent/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-vscode-accent/30 shadow-lg">
              <Sparkles size={28} className="text-vscode-accent" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
            </div>
            <div className="space-y-3">
              <p className="text-lg font-semibold text-vscode-text">AutoChat is Ready</p>
              <p className="text-sm text-vscode-text-muted px-6">I'm your AutoCode AI assistant. I can help you write code, explain concepts, debug issues, and answer programming questions.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center px-4">
              <div className="text-xs bg-vscode-panel border border-vscode-border rounded-lg px-3 py-2 hover:bg-vscode-border transition-colors">💡 Explain code</div>
              <div className="text-xs bg-vscode-panel border border-vscode-border rounded-lg px-3 py-2 hover:bg-vscode-border transition-colors">🐛 Debug issues</div>
              <div className="text-xs bg-vscode-panel border border-vscode-border rounded-lg px-3 py-2 hover:bg-vscode-border transition-colors">🔧 Optimize performance</div>
              <div className="text-xs bg-vscode-panel border border-vscode-border rounded-lg px-3 py-2 hover:bg-vscode-border transition-colors">📚 Learn concepts</div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              isLast={index === messages.length - 1}
            />
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex space-x-3 justify-start animate-in fade-in duration-300">
            <div className="w-8 h-8 bg-gradient-to-br from-vscode-accent to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="bg-vscode-panel border border-vscode-border rounded-lg px-4 py-3 max-w-sm shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-vscode-accent rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-vscode-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-vscode-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
                <span className="text-sm text-vscode-text-muted">AutoChat is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-vscode-border bg-gradient-to-r from-vscode-panel to-vscode-sidebar">
        {isApiKeyValid && selectedModel ? (
          <>
            <form onSubmit={handleSendMessage} className="p-3">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask AutoChat anything..."
                    disabled={isTyping}
                    className="w-full px-4 py-3 bg-vscode-editor border border-vscode-border rounded-lg text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:ring-2 focus:ring-vscode-accent/50 focus:border-vscode-accent disabled:opacity-50 transition-all duration-150"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-vscode-text-muted">
                    {inputMessage.length > 0 && (
                      <span className="bg-vscode-panel px-2 py-0.5 rounded text-xs">
                        {isTyping ? 'Sending...' : 'Enter to send'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Context Menu Button */}
                {(activeFile || currentProject) && (
                  <div className="relative context-menu-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowContextMenu(prev => !prev);
                      }}
                      disabled={isTyping}
                      className="p-3 bg-vscode-border text-vscode-text hover:bg-vscode-panel hover:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center hover-lift shadow-sm"
                      title="Add context from current file or project"
                    >
                      <Plus size={18} />
                    </button>
                    
                    {/* Context Dropdown */}
                    {showContextMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-vscode-panel border border-vscode-border rounded-lg shadow-lg p-2 min-w-48 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="text-xs text-vscode-text-muted mb-2 px-2">Add context:</div>
                        
                        {activeFile && (
                          <button
                            onClick={() => handleSendWithContext('file')}
                            disabled={!inputMessage.trim() || isTyping}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-vscode-text hover:bg-vscode-border rounded-md transition-colors disabled:opacity-50"
                          >
                            <FileText size={16} className="text-blue-400" />
                            <span>Current File</span>
                            <span className="text-xs text-vscode-text-muted ml-auto">{activeFile.name}</span>
                          </button>
                        )}
                        
                        {currentProject && (
                          <>
                            <button
                              onClick={() => handleSendWithContext('project')}
                              disabled={!inputMessage.trim() || isTyping}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-vscode-text hover:bg-vscode-border rounded-md transition-colors disabled:opacity-50"
                            >
                              <FolderOpen size={16} className="text-yellow-400" />
                              <span>Project Files</span>
                              <span className="text-xs text-vscode-text-muted ml-auto">{currentProject.name}</span>
                            </button>
                            
                            <button
                              onClick={() => handleSendWithContext('structure')}
                              disabled={!inputMessage.trim() || isTyping}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-vscode-text hover:bg-vscode-border rounded-md transition-colors disabled:opacity-50"
                            >
                              <ChevronDown size={16} className="text-green-400" />
                              <span>Project Structure</span>
                              <span className="text-xs text-vscode-text-muted ml-auto">Tree view</span>
                            </button>
                          </>
                        )}
                        
                        {!activeFile && !currentProject && (
                          <div className="px-3 py-2 text-xs text-vscode-text-muted text-center">
                            Open a project or file to add context
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-3 bg-vscode-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center hover-lift shadow-sm"
                  title="Send message to AutoChat"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
            
            {messages.length === 0 && (
              <div className="px-4 pb-4 space-y-3">
                <div className="text-xs text-vscode-text-muted font-medium">Quick suggestions:</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Optimize my code",
                    "Explain this function", 
                    "Debug an error",
                    "Write unit tests",
                    "Review code quality",
                    "Best practices"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInputMessage(suggestion)}
                      className="text-xs bg-vscode-editor hover:bg-vscode-border border border-vscode-border rounded-lg px-3 py-2 text-vscode-text-muted hover:text-vscode-text transition-all duration-150 text-left hover-lift"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default ChatBot;