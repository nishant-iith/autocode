import React, { useEffect, useRef } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessage as ChatMessageType } from '../services/openRouter';

interface ChatMessageProps {
  message: ChatMessageType;
  isLast?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast }) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Auto-scroll to bottom when message updates (for streaming)
  useEffect(() => {
    if (isLast && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [message.content, isLast]);

  return (
    <div
      ref={messageRef}
      className={`flex space-x-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'assistant' && (
        <div className="w-8 h-8 bg-vscode-accent rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          message.role === 'user'
            ? 'bg-vscode-accent text-white'
            : 'bg-vscode-panel border border-vscode-border text-vscode-text'
        }`}
      >
        {message.role === 'user' ? (
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div className="text-sm">
            <ReactMarkdown
              components={{
                code(props: { className?: string; children?: React.ReactNode; inline?: boolean }) {
                  const { className, children, inline } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const codeContent = String(children).replace(/\n$/, '');
                  
                  return !inline && match ? (
                    <div className="relative group">
                      <button
                        onClick={() => handleCopyCode(codeContent)}
                        className="absolute top-2 right-2 p-1 bg-vscode-bg hover:bg-vscode-border rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Copy code"
                      >
                        {copiedCode === codeContent ? (
                          <Check size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} className="text-vscode-text-muted" />
                        )}
                      </button>
                      <SyntaxHighlighter
                        style={vscDarkPlus as {[key: string]: React.CSSProperties}}
                        language={match[1]}
                        PreTag="div"
                        className="text-sm rounded-md !bg-vscode-editor !border !border-vscode-border"
                        {...props}
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className="bg-vscode-editor px-1 py-0.5 rounded text-vscode-accent border border-vscode-border"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-vscode-accent pl-4 mb-2 italic text-vscode-text-muted">
                      {children}
                    </blockquote>
                  );
                },
                h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold text-vscode-text">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <div
          className={`text-xs mt-1 ${
            message.role === 'user' ? 'text-blue-100' : 'text-vscode-text-muted'
          }`}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      {message.role === 'user' && (
        <div className="w-8 h-8 bg-vscode-selection rounded-full flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-vscode-text" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;