/**
 * Refactored ChatBot Component
 * Main orchestrator component following Single Responsibility Principle
 * Each concern is delegated to specialized components
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Sparkles } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore, FileNode } from '../store/projectStore';
import ChatMessage from './ChatMessage';

// Import refactored components
import { ChatBotHeader } from './ChatBot/ChatBotHeader';
import { ChatBotSettings } from './ChatBot/ChatBotSettings';
import { ChatBotInput } from './ChatBot/ChatBotInput';
import { ChatBotFloatingButton } from './ChatBot/ChatBotFloatingButton';
import { WelcomeState, ReadyState, QuickSuggestions } from './ChatBot/EmptyStates';

/**
 * Main ChatBot component that orchestrates the AI chat interface
 * Responsibilities:
 * - Coordinate between child components
 * - Manage component state and message handling
 * - Handle context generation for file/project integration
 */
const ChatBotRefactored: React.FC = () => {
  // Store hooks
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

  // Local component state
  const [inputMessage, setInputMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Event handlers
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

    const context = generateContext(contextType);
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

  const generateContext = (contextType: 'file' | 'project' | 'structure'): string => {
    if (contextType === 'file' && activeFile) {
      return `File: ${activeFile.name}\n\nContent:\n${activeFile.content}`;
    }

    if (contextType === 'project' && currentProject) {
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
      return `Project: ${currentProject.name}\n\nDescription: ${currentProject.description || 'No description'}\n\nFiles:\n${projectFiles}`;
    }

    if (contextType === 'structure' && currentProject) {
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
      return `Project Structure for ${currentProject.name}:\n\n${structure}`;
    }

    return '';
  };

  // Render floating button when closed
  if (!isOpen) {
    return (
      <ChatBotFloatingButton
        hasApiKey={!!apiKey}
        onToggleChat={toggleChat}
      />
    );
  }

  // Main chat interface
  return (
    <div className="h-full bg-vscode-sidebar flex flex-col">
      {/* Header */}
      <ChatBotHeader
        messagesCount={messages.length}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onClearMessages={clearMessages}
        onClose={closeChat}
      />

      {/* Settings Panel */}
      <ChatBotSettings
        isVisible={showSettings}
        apiKey={apiKey}
        isApiKeyValid={isApiKeyValid}
        models={freeModels}
        selectedModel={selectedModel}
        isLoadingModels={isLoadingModels}
        useStreaming={useStreaming}
        maxTokens={maxTokens}
        temperature={temperature}
        onSetApiKey={setApiKey}
        onClearApiKey={clearApiKey}
        onSelectModel={selectModel}
        onLoadModels={loadModels}
        onSetUseStreaming={setUseStreaming}
        onSetMaxTokens={setMaxTokens}
        onSetTemperature={setTemperature}
      />

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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 vscode-scrollbar">
        {!isApiKeyValid ? (
          <WelcomeState onConfigureApiKey={() => setShowSettings(true)} />
        ) : messages.length === 0 ? (
          <ReadyState onSuggestionClick={setInputMessage} />
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

      {/* Input Area */}
      <div className="border-t border-vscode-border bg-gradient-to-r from-vscode-panel to-vscode-sidebar">
        <ChatBotInput
          message={inputMessage}
          isTyping={isTyping}
          isApiKeyValid={isApiKeyValid}
          selectedModel={selectedModel}
          activeFileName={activeFile?.name}
          projectName={currentProject?.name}
          showContextMenu={showContextMenu}
          onMessageChange={setInputMessage}
          onSubmit={handleSendMessage}
          onToggleContextMenu={() => setShowContextMenu(prev => !prev)}
          onCloseContextMenu={() => setShowContextMenu(false)}
          onSendWithContext={handleSendWithContext}
        />

        {/* Quick Suggestions */}
        {isApiKeyValid && selectedModel && messages.length === 0 && (
          <QuickSuggestions onSuggestionClick={setInputMessage} />
        )}
      </div>
    </div>
  );
};

export default ChatBotRefactored;