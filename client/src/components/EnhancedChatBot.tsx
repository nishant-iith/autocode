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
  Sparkles,
  Pause,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useEnhancedChatStore } from '../store/enhancedChatStore';
import { useProjectStore } from '../store/projectStore';
import ChatMessage from './ChatMessage';
import ChatSettingsModal from './modals/ChatSettingsModal';

const EnhancedChatBot: React.FC = () => {
  const {
    isOpen,
    error,
    mode,
    messages,
    isTyping,
    streamingContent,
    currentArtifacts,
    toggleChat,
    closeChat,
    setMode,
    sendMessage,
    executeArtifacts,
    abortCurrentRequest,
    clearMessages,
    setError,
    apiKey
  } = useEnhancedChatStore();

  const { currentProject } = useProjectStore();

  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingContent]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputMessage]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const message = inputMessage.trim();
    setInputMessage('');

    // Reset height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleChat}
          className="group relative bg-vscode-accent hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 flex items-center space-x-2 hover:scale-105 active:scale-95"
          title="AutoChat - AI Assistant"
        >
          <Sparkles size={20} className="transition-transform duration-200 group-hover:rotate-12" />
          <span className="font-medium pr-1">Ask AI</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`h-full bg-vscode-sidebar flex flex-col border-l border-vscode-border shadow-2xl transition-all duration-300 ${isExpanded ? 'w-[600px]' : 'w-full'}`}>
      {/* Clean Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-vscode-border bg-vscode-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-vscode-sidebar/60 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-vscode-panel rounded-lg p-1 border border-vscode-border">
            <button
              onClick={() => setMode('chat')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${mode === 'chat'
                ? 'bg-vscode-accent text-white shadow-sm'
                : 'text-vscode-text-muted hover:text-vscode-text hover:bg-vscode-border/50'
                }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMode('edit')}
              disabled={!currentProject}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${mode === 'edit'
                ? 'bg-vscode-accent text-white shadow-sm'
                : currentProject
                  ? 'text-vscode-text-muted hover:text-vscode-text hover:bg-vscode-border/50'
                  : 'text-vscode-text-muted opacity-50 cursor-not-allowed'
                }`}
            >
              Edit
            </button>
          </div>

          {mode === 'edit' && currentProject && (
            <span className="text-xs text-green-400 font-medium px-2 py-0.5 bg-green-400/10 rounded border border-green-400/20">
              {currentProject.name}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-vscode-border rounded-lg text-vscode-text-muted hover:text-vscode-text transition-colors hidden md:block"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-vscode-border rounded-lg text-vscode-text-muted hover:text-vscode-text transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>

          <div className="w-px h-4 bg-vscode-border mx-1" />

          <button
            onClick={closeChat}
            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-vscode-text-muted transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-vscode-editor/30 relative">
        {messages.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
              <Sparkles size={32} className="text-vscode-accent" />
            </div>
            <h3 className="text-xl font-semibold text-vscode-text mb-2">
              How can I help you?
            </h3>
            <p className="text-sm text-vscode-text-muted max-w-xs mb-8">
              I can help you write code, debug issues, or explain complex concepts.
            </p>

            {!apiKey && (
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-2.5 bg-vscode-accent hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Setup API Key
              </button>
            )}
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={{
                  id: message.id,
                  role: message.role,
                  content: message.content,
                  timestamp: message.timestamp,
                  artifacts: message.artifacts
                }}
                isLast={index === messages.length - 1}
              />
            ))}

            {/* Streaming Indicator */}
            {isTyping && !streamingContent && (
              <div className="px-4 py-6 flex items-center space-x-3 animate-in fade-in duration-300">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                  <Loader size={16} className="text-purple-400 animate-spin" />
                </div>
                <span className="text-sm text-vscode-text-muted">Thinking...</span>
              </div>
            )}

            {/* Artifacts Status */}
            {currentArtifacts.length > 0 && (
              <div className="mx-4 mb-4 p-4 bg-vscode-panel border border-vscode-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-vscode-text-muted uppercase tracking-wider">Generated Artifacts</span>
                  <span className="text-xs bg-vscode-accent/10 text-vscode-accent px-2 py-0.5 rounded-full">
                    {currentArtifacts.length} items
                  </span>
                </div>
                <div className="space-y-2">
                  {currentArtifacts.map((artifact) => (
                    <div key={artifact.id} className="flex items-center justify-between p-2 bg-vscode-editor rounded-lg border border-vscode-border/50">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <div className="w-1 h-8 bg-vscode-accent rounded-full flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-vscode-text truncate">{artifact.title}</div>
                          <div className="text-xs text-vscode-text-muted">{artifact.actions.length} actions</div>
                        </div>
                      </div>
                      <button
                        onClick={() => executeArtifacts([artifact])}
                        className="px-3 py-1.5 text-xs bg-vscode-accent hover:bg-blue-600 text-white rounded-md transition-colors flex-shrink-0 ml-2"
                      >
                        Run
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-24 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg shadow-lg backdrop-blur-sm flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 rounded">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-vscode-sidebar border-t border-vscode-border">
        <div className="relative bg-vscode-editor border border-vscode-border rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-vscode-accent focus-within:border-vscode-accent transition-all duration-200">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'edit' ? "Describe changes to your code..." : "Ask anything..."}
            disabled={isTyping}
            rows={1}
            className="w-full px-4 py-3 pr-12 bg-transparent text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none resize-none max-h-[200px] scrollbar-hide"
            style={{ minHeight: '44px' }}
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {isTyping ? (
              <button
                onClick={abortCurrentRequest}
                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200"
                title="Stop generation"
              >
                <Pause size={16} />
              </button>
            ) : (
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="p-2 bg-vscode-accent text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                title="Send message"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-1">
          <div className="text-xs text-vscode-text-muted flex items-center space-x-2">
            {mode === 'edit' && (
              <span className="flex items-center text-green-400">
                <Sparkles size={10} className="mr-1" />
                Edit Mode
              </span>
            )}
            <span>•</span>
            <span>Markdown supported</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-xs text-vscode-text-muted hover:text-red-400 transition-colors flex items-center space-x-1"
            >
              <Trash2 size={10} />
              <span>Clear chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && <ChatSettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default EnhancedChatBot;