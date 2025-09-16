/**
 * Enhanced ChatBot Component
 * Features automatic context, streaming responses, and file operations
 * Integrates with enhanced AI service for advanced capabilities
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Settings,
  Loader,
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Pause,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useEnhancedChatStore } from '../store/enhancedChatStore';
import { useProjectStore } from '../store/projectStore';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '../services/openRouter';

const EnhancedChatBot: React.FC = () => {
  const {
    isOpen,
    error,
    mode,
    apiKey,
    isApiKeyValid,
    freeModels,
    selectedModel,
    isLoadingModels,
    messages,
    isTyping,
    streamingContent,
    currentArtifacts,
    fileOperations,
    useStreaming,
    autoExecuteActions,
    contextOptimization,
    maxTokens,
    temperature,
    toggleChat,
    closeChat,
    setMode,
    setApiKey,
    clearApiKey,
    loadModels,
    selectModel,
    sendMessage,
    executeArtifacts,
    abortCurrentRequest,
    clearMessages,
    setError,
    setMaxTokens,
    setTemperature,
    setUseStreaming,
    setAutoExecuteActions,
    setContextOptimization,
  } = useEnhancedChatStore();

  const { currentProject } = useProjectStore();

  const [inputMessage, setInputMessage] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingContent]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const message = inputMessage.trim();
    setInputMessage('');

    if (mode === 'chat') {
      await sendMessage(message);
    } else {
      await sendMessage(message); // Using same function for now since mode logic is handled in store
    }
  };

  const handleSetApiKey = async () => {
    if (apiKeyInput.trim()) {
      await setApiKey(apiKeyInput.trim());
      setApiKeyInput('');
    }
  };

  const getOperationIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={12} className="text-yellow-400" />;
      case 'running': return <Loader size={12} className="text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle size={12} className="text-green-400" />;
      case 'failed': return <XCircle size={12} className="text-red-400" />;
      default: return <Clock size={12} className="text-gray-400" />;
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="group relative bg-vscode-accent hover:bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
          title="AutoChat - AI Assistant"
        >
          <div className="relative">
            <Sparkles size={18} className="transition-transform duration-200 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <span className="text-sm font-medium hidden sm:block">AutoChat</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-vscode-sidebar flex flex-col">
      {/* Clean Header */}
      <div className="flex items-center justify-between p-3 border-b border-vscode-border bg-vscode-panel">
        {/* Left: Icon + Title + Mode Toggle */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Sparkles className="text-vscode-accent" size={18} />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          <h3 className="font-medium text-vscode-text">AutoChat</h3>

          {/* Compact Mode Toggle */}
          <div className="flex bg-vscode-border rounded-md overflow-hidden">
            <button
              onClick={() => setMode('chat')}
              className={`px-2 py-1 text-xs transition-all duration-150 ${
                mode === 'chat'
                  ? 'bg-vscode-accent text-white'
                  : 'text-vscode-text-muted hover:text-vscode-text hover:bg-vscode-border'
              }`}
              title="Chat Mode"
            >
              💬
            </button>
            <button
              onClick={() => setMode('edit')}
              disabled={!currentProject}
              className={`px-2 py-1 text-xs transition-all duration-150 ${
                mode === 'edit'
                  ? 'bg-vscode-accent text-white'
                  : currentProject
                    ? 'text-vscode-text-muted hover:text-vscode-text hover:bg-vscode-border'
                    : 'text-vscode-text-muted opacity-50 cursor-not-allowed'
              }`}
              title={currentProject ? `Edit Mode: ${currentProject.name}` : "Requires project"}
            >
              ⚡
            </button>
          </div>

          {/* Compact Status */}
          {mode === 'edit' && currentProject && (
            <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
              {currentProject.name}
            </div>
          )}
        </div>

        {/* Right: Essential Actions Only */}
        <div className="flex items-center space-x-1">
          {isTyping && (
            <button
              onClick={abortCurrentRequest}
              className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-vscode-text-muted transition-all duration-150"
              title="Stop"
            >
              <Pause size={14} />
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 hover:bg-vscode-border rounded text-vscode-text-muted hover:text-vscode-text transition-all duration-150 ${showSettings ? 'bg-vscode-border text-vscode-text' : ''}`}
            title="Settings"
          >
            <Settings size={14} />
          </button>

          <button
            onClick={closeChat}
            className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-vscode-text-muted transition-all duration-150"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Contextual Action Bar - Only show when needed */}
      {messages.length > 0 && !showSettings && (
        <div className="px-3 py-2 border-b border-vscode-border bg-vscode-bg">
          <div className="flex items-center justify-between">
            <div className="text-xs text-vscode-text-muted">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
              {mode === 'edit' && currentProject && (
                <span className="ml-2 text-green-400">• Auto-context active</span>
              )}
            </div>
            <button
              onClick={clearMessages}
              className="text-xs text-vscode-text-muted hover:text-red-400 transition-colors"
              title="Clear conversation"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Settings Panel */}
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
              <label className="text-sm font-medium text-vscode-text mb-2 block">Model</label>
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
                  <button
                    onClick={loadModels}
                    className="text-vscode-accent hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Settings */}
          {isApiKeyValid && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-vscode-text mb-2 block">
                    Streaming
                  </label>
                  <input
                    type="checkbox"
                    checked={useStreaming}
                    onChange={(e) => setUseStreaming(e.target.checked)}
                    className="w-4 h-4 text-vscode-accent bg-vscode-editor border-vscode-border rounded focus:ring-vscode-accent"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-vscode-text mb-2 block">
                    Auto Execute
                  </label>
                  <input
                    type="checkbox"
                    checked={autoExecuteActions}
                    onChange={(e) => setAutoExecuteActions(e.target.checked)}
                    className="w-4 h-4 text-vscode-accent bg-vscode-editor border-vscode-border rounded focus:ring-vscode-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-vscode-text mb-2 block">
                  Auto Context
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={contextOptimization}
                    onChange={(e) => setContextOptimization(e.target.checked)}
                    className="w-4 h-4 text-vscode-accent bg-vscode-editor border-vscode-border rounded focus:ring-vscode-accent"
                  />
                  <span className="text-xs text-vscode-text-muted">
                    Automatically include relevant files
                  </span>
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Operations Status */}
      {fileOperations.length > 0 && (
        <div className="p-3 border-b border-vscode-border bg-vscode-panel">
          <div className="text-xs font-medium text-vscode-text mb-2">File Operations</div>
          <div className="space-y-1 max-h-20 overflow-y-auto vscode-scrollbar">
            {fileOperations.slice(-3).map((op, index) => (
              <div key={index} className="flex items-center space-x-2 text-xs">
                {getOperationIcon(op.status)}
                <span className="text-vscode-text-muted">{op.action}</span>
                {op.filePath && (
                  <span className="text-vscode-accent font-mono">{op.filePath}</span>
                )}
              </div>
            ))}
          </div>
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
          <div className="text-center text-vscode-text-muted space-y-6 py-12">
            <div className="relative mx-auto w-16 h-16 bg-vscode-accent/20 rounded-xl flex items-center justify-center">
              <Sparkles size={24} className="text-vscode-accent" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-vscode-text">Welcome to AutoChat</p>
              <p className="text-sm text-vscode-text-muted px-4">
                Get your free API key to start using AI assistance
              </p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-vscode-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Settings size={16} />
              <span>Setup API Key</span>
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-vscode-text-muted space-y-4 py-8">
            <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-vscode-accent/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-vscode-accent/30 shadow-lg">
              <Sparkles size={28} className="text-vscode-accent" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-vscode-text">AutoChat Ready</p>
              <p className="text-sm text-vscode-text-muted px-4">
                {mode === 'chat'
                  ? 'Ask questions, get code help, or request explanations'
                  : `Edit ${currentProject?.name || 'your project'} files with intelligent context`
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              // Convert AIMessage to ChatMessageType for compatibility
              const chatMessage: ChatMessageType = {
                id: message.id,
                role: message.role,
                content: message.content,
                timestamp: message.timestamp
              };

              return (
                <div key={message.id} className="relative">
                  <ChatMessage
                    message={chatMessage}
                    isLast={index === messages.length - 1}
                  />
                  {/* Show streaming indicator on last message when typing */}
                  {isTyping && index === messages.length - 1 && message.role === 'assistant' && (
                    <div className="absolute bottom-2 right-4">
                      <span className="animate-pulse text-vscode-accent">▊</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming indicator - only show when typing and no content yet */}

            {isTyping && !streamingContent && (
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
                    <span className="text-sm text-vscode-text-muted">
                      {mode === 'edit' ? 'Analyzing context...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Artifacts Display */}
            {currentArtifacts.length > 0 && (
              <div className="border border-vscode-border rounded-lg p-4 bg-vscode-panel">
                <div className="text-sm font-medium text-vscode-text mb-2">Generated Artifacts</div>
                {currentArtifacts.map((artifact) => (
                  <div key={artifact.id} className="border-l-2 border-vscode-accent pl-3 mb-3">
                    <div className="text-xs font-medium text-vscode-accent">{artifact.title}</div>
                    <div className="text-xs text-vscode-text-muted">{artifact.actions.length} actions</div>
                    {!autoExecuteActions && (
                      <button
                        onClick={() => executeArtifacts([artifact])}
                        className="mt-2 text-xs bg-vscode-accent text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Execute
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div className="border-t border-vscode-border bg-gradient-to-r from-vscode-panel to-vscode-sidebar">
        {isApiKeyValid && selectedModel ? (
          <form onSubmit={handleSendMessage} className="p-3">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={mode === 'edit' ? "Describe what you want to edit..." : "Ask AutoChat Pro anything..."}
                  disabled={isTyping}
                  className="w-full px-4 py-3 bg-vscode-editor border border-vscode-border rounded-lg text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:ring-2 focus:ring-vscode-accent/50 focus:border-vscode-accent disabled:opacity-50 transition-all duration-150"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-vscode-text-muted">
                  {inputMessage.length > 0 && (
                    <span className="bg-vscode-panel px-2 py-0.5 rounded text-xs">
                      {isTyping ? 'Processing...' : 'Enter to send'}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="p-3 bg-vscode-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center shadow-sm"
                title={`Send to ${mode === 'edit' ? 'Edit Mode' : 'Chat Mode'}`}
              >
                <Send size={18} />
              </button>
            </div>

            {mode === 'edit' && currentProject && (
              <div className="mt-2 text-xs text-vscode-text-muted">
                <span className="text-green-400">🔧 Edit Mode:</span> AI will help modify files in "{currentProject.name}"
              </div>
            )}

            {mode === 'chat' && (
              <div className="mt-2 text-xs text-vscode-text-muted">
                <span className="text-blue-400">💬 Chat Mode:</span> General conversation and coding assistance
              </div>
            )}

            {mode === 'edit' && !currentProject && (
              <div className="mt-2 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                Edit mode requires an active project. Please open or create a project first.
              </div>
            )}
          </form>
        ) : (
          <div className="p-3">
            <div className="text-xs text-center text-vscode-text-muted">
              Configure API key and select model to start using Enhanced AutoChat
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatBot;