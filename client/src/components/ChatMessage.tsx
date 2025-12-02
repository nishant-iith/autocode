import React, { useEffect, useRef } from 'react';
import { Bot, User, Copy, Check, Terminal } from 'lucide-react';
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

  const isUser = message.role === 'user';

  return (
    <div
      ref={messageRef}
      className={`group flex space-x-4 py-6 px-4 ${isUser ? 'bg-vscode-panel/50' : 'bg-transparent'
        } border-b border-vscode-border/30 last:border-0`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center border border-blue-500/30">
            <User size={18} />
          </div>
        ) : (
          <div className="w-8 h-8 bg-purple-600/20 text-purple-400 rounded-lg flex items-center justify-center border border-purple-500/30">
            <Bot size={18} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-vscode-text text-sm">
            {isUser ? 'You' : 'AutoCode AI'}
          </span>
          <span className="text-xs text-vscode-text-muted">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        <div className={`text-sm leading-relaxed ${isUser ? 'text-vscode-text' : 'text-vscode-text-muted'}`}>
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <ReactMarkdown
              components={{
                code(props: { className?: string; children?: React.ReactNode; inline?: boolean }) {
                  const { className, children, inline } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const codeContent = String(children).replace(/\n$/, '');

                  return !inline && match ? (
                    <div className="my-4 rounded-lg overflow-hidden border border-vscode-border bg-vscode-editor shadow-sm">
                      <div className="flex items-center justify-between px-3 py-2 bg-vscode-panel border-b border-vscode-border">
                        <div className="flex items-center space-x-2 text-xs text-vscode-text-muted">
                          <Terminal size={12} />
                          <span>{match[1]}</span>
                        </div>
                        <button
                          onClick={() => handleCopyCode(codeContent)}
                          className="flex items-center space-x-1 text-xs text-vscode-text-muted hover:text-vscode-text transition-colors"
                        >
                          {copiedCode === codeContent ? (
                            <>
                              <Check size={12} className="text-green-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus as { [key: string]: React.CSSProperties }}
                        language={match[1]}
                        PreTag="div"
                        className="!bg-vscode-editor !p-4 !m-0 text-sm overflow-x-auto"
                        showLineNumbers={true}
                        lineNumberStyle={{ minWidth: '2.5em', paddingRight: '1em', color: '#6e7681', textAlign: 'right' }}
                        {...props}
                      >
                        {codeContent}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className="bg-vscode-panel px-1.5 py-0.5 rounded text-vscode-accent font-mono text-[13px]"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <p className="mb-3 last:mb-0 text-vscode-text">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-outside ml-4 mb-3 space-y-1 text-vscode-text">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-outside ml-4 mb-3 space-y-1 text-vscode-text">{children}</ol>;
                },
                li({ children }) {
                  return <li className="pl-1">{children}</li>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-4 border-vscode-accent/50 pl-4 py-1 my-3 bg-vscode-accent/5 rounded-r text-vscode-text-muted italic">
                      {children}
                    </blockquote>
                  );
                },
                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-vscode-text border-b border-vscode-border pb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-4 text-vscode-text">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 text-vscode-text">{children}</h3>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 border border-vscode-border rounded-lg">
                    <table className="min-w-full divide-y divide-vscode-border">{children}</table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-vscode-panel">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-vscode-border bg-vscode-editor">{children}</tbody>,
                tr: ({ children }) => <tr>{children}</tr>,
                th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-medium text-vscode-text-muted uppercase tracking-wider">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 whitespace-nowrap text-sm text-vscode-text">{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;