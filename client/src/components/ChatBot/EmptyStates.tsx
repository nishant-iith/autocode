/**
 * Empty States Components
 * Handles different empty/welcome states of the chat
 */

import React from 'react';
import { Key, Sparkles, Settings } from 'lucide-react';

interface WelcomeStateProps {
  onConfigureApiKey: () => void;
}

export const WelcomeState: React.FC<WelcomeStateProps> = ({ onConfigureApiKey }) => (
  <div className="text-center text-vscode-text-muted space-y-4 py-12">
    <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-vscode-panel to-vscode-border rounded-xl flex items-center justify-center border border-vscode-border shadow-lg">
      <Key size={28} className="text-vscode-accent" />
    </div>
    <div className="space-y-2">
      <p className="text-lg font-semibold text-vscode-text">Welcome to AutoChat</p>
      <p className="text-sm text-vscode-text-muted px-6">
        AutoCode's intelligent AI assistant is ready to help you with coding, debugging, and development questions.
      </p>
      <p className="text-xs text-vscode-text-muted">Configure your OpenRouter API key to get started</p>
    </div>
    <button
      onClick={onConfigureApiKey}
      className="inline-flex items-center space-x-2 px-4 py-2 bg-vscode-accent text-white rounded-lg hover:bg-blue-600 transition-all duration-200 hover-lift shadow-sm"
    >
      <Settings size={16} />
      <span>Configure API Key</span>
    </button>
  </div>
);

interface ReadyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

export const ReadyState: React.FC<ReadyStateProps> = ({ onSuggestionClick }) => (
  <div className="text-center text-vscode-text-muted space-y-4 py-8">
    <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-vscode-accent/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-vscode-accent/30 shadow-lg">
      <Sparkles size={28} className="text-vscode-accent" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
    </div>
    <div className="space-y-3">
      <p className="text-lg font-semibold text-vscode-text">AutoChat is Ready</p>
      <p className="text-sm text-vscode-text-muted px-6">
        I'm your AutoCode AI assistant. I can help you write code, explain concepts, debug issues, and answer programming questions.
      </p>
    </div>
    <div className="flex flex-wrap gap-2 justify-center px-4">
      {[
        '💡 Explain code',
        '🐛 Debug issues',
        '🔧 Optimize performance',
        '📚 Learn concepts'
      ].map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSuggestionClick(suggestion.replace(/^.{2}\s/, ''))}
          className="text-xs bg-vscode-panel border border-vscode-border rounded-lg px-3 py-2 hover:bg-vscode-border transition-colors cursor-pointer"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);

interface QuickSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({ onSuggestionClick }) => (
  <div className="px-4 pb-4 space-y-3">
    <div className="text-xs text-vscode-text-muted font-medium">Quick suggestions:</div>
    <div className="grid grid-cols-2 gap-2">
      {[
        'Optimize my code',
        'Explain this function',
        'Debug an error',
        'Write unit tests',
        'Review code quality',
        'Best practices'
      ].map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSuggestionClick(suggestion)}
          className="text-xs bg-vscode-editor hover:bg-vscode-border border border-vscode-border rounded-lg px-3 py-2 text-vscode-text-muted hover:text-vscode-text transition-all duration-150 text-left hover-lift"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);