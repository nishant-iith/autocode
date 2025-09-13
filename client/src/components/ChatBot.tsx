import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Settings, 
  Key, 
  Bot, 
  Loader, 
  AlertCircle,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  History
} from 'lucide-react';
import { useChatStore } from '../store/chatStore';
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
    conversationHistory,
    toggleChat,
    closeChat,
    setApiKey,
    clearApiKey,
    loadModels,
    selectModel,
    sendMessage,
    clearMessages,
    setError,
    setMaxTokens,
    setTemperature,
    setUseStreaming,
    loadConversation,
    newConversation,
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleSetApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setApiKeyInput('');
    }
  };


  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-vscode-accent hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-colors z-50"
        title="Open AI Chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 lg:w-96 bg-vscode-sidebar border-l border-vscode-border flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-vscode-border bg-vscode-panel">
        <div className="flex items-center space-x-2">
          <Bot className="text-vscode-accent" size={20} />
          <h3 className="font-medium text-vscode-text">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={newConversation}
            className="p-1 hover:bg-vscode-border rounded text-vscode-text-muted hover:text-vscode-text transition-colors"
            title="New Conversation"
            disabled={messages.length === 0}
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-vscode-border rounded text-vscode-text-muted hover:text-vscode-text transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={closeChat}
            className="p-1 hover:bg-vscode-border rounded text-vscode-text-muted hover:text-vscode-text transition-colors"
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

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-vscode-text">History</label>
                <History size={14} className="text-vscode-text-muted" />
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 vscode-scrollbar">
                {conversationHistory.map((conversation, index) => (
                  <button
                    key={index}
                    onClick={() => loadConversation(conversation)}
                    className="w-full text-left p-2 text-xs bg-vscode-editor hover:bg-vscode-border rounded border border-vscode-border transition-colors"
                  >
                    <div className="truncate text-vscode-text">
                      {conversation.find(m => m.role === 'user')?.content.substring(0, 50) || 'Empty conversation'}
                      {(conversation.find(m => m.role === 'user')?.content.length || 0) > 50 && '...'}
                    </div>
                    <div className="text-vscode-text-muted mt-1">
                      {conversation.length} messages
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Controls */}
          {messages.length > 0 && (
            <div className="flex justify-between">
              <button
                onClick={clearMessages}
                className="flex items-center space-x-1 text-xs text-vscode-text-muted hover:text-vscode-text transition-colors"
              >
                <Trash2 size={12} />
                <span>Clear Chat</span>
              </button>
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
          <div className="text-center text-vscode-text-muted space-y-2">
            <Key size={48} className="mx-auto opacity-50" />
            <p className="text-sm">Configure your OpenRouter API key to start chatting</p>
            <button
              onClick={() => setShowSettings(true)}
              className="text-vscode-accent hover:underline text-sm"
            >
              Open Settings
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-vscode-text-muted space-y-2">
            <Bot size={48} className="mx-auto opacity-50" />
            <p className="text-sm">Start a conversation with the AI assistant</p>
            <p className="text-xs">Ask about code, get help with development, or chat about anything!</p>
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
          <div className="flex space-x-3 justify-start">
            <div className="w-8 h-8 bg-vscode-accent rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-vscode-panel border border-vscode-border rounded-lg px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-vscode-text-muted rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-vscode-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-vscode-text-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isApiKeyValid && selectedModel && (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-vscode-border bg-vscode-panel">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isTyping}
              className="flex-1 px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:border-vscode-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2 bg-vscode-accent text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatBot;