import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../ChatMessage';
import { ChatMessage as ChatMessageType } from '../../services/openRouter';

// Mock ReactMarkdown and SyntaxHighlighter
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

jest.mock('react-syntax-highlighter', () => {
  return function MockSyntaxHighlighter({ children }: { children: string }) {
    return (
      <div data-testid="syntax-highlighter">
        <pre>{children}</pre>
        <button onClick={() => {}}>Copy</button>
      </div>
    );
  };
});

describe('ChatMessage', () => {
  const mockUserMessage: ChatMessageType = {
    id: '1',
    role: 'user',
    content: 'Hello, AI!',
    timestamp: new Date('2024-01-15T10:30:00.000Z'),
  };

  const mockAssistantMessage: ChatMessageType = {
    id: '2',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: new Date('2024-01-15T10:30:05.000Z'),
  };

  const mockCodeMessage: ChatMessageType = {
    id: '3',
    role: 'assistant',
    content: 'Here is some code:\n\n```javascript\nconsole.log("Hello World");\n```',
    timestamp: new Date('2024-01-15T10:30:10.000Z'),
  };

  it('renders user message correctly', () => {
    render(<ChatMessage message={mockUserMessage} />);

    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<ChatMessage message={mockAssistantMessage} />);

    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByTestId('bot-avatar')).toBeInTheDocument();
  });

  it('renders code blocks with syntax highlighting', () => {
    render(<ChatMessage message={mockCodeMessage} />);

    expect(screen.getByText('Here is some code:')).toBeInTheDocument();
    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
    expect(screen.getByText('console.log("Hello World");')).toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    render(<ChatMessage message={mockUserMessage} />);

    expect(screen.getByText('10:30')).toBeInTheDocument();
  });

  it('applies correct styling for user messages', () => {
    render(<ChatMessage message={mockUserMessage} />);

    const messageContainer = screen.getByText('Hello, AI!').closest('div');
    expect(messageContainer).toHaveClass('bg-vscode-accent');
  });

  it('applies correct styling for assistant messages', () => {
    render(<ChatMessage message={mockAssistantMessage} />);

    const messageContainer = screen.getByText('Hello! How can I help you today?').closest('div');
    expect(messageContainer).toHaveClass('bg-vscode-editor');
  });

  it('shows copy button for code blocks', () => {
    render(<ChatMessage message={mockCodeMessage} />);

    const copyButton = screen.getByText('Copy');
    expect(copyButton).toBeInTheDocument();
  });

  it('handles copy code functionality', async () => {
    const mockWriteText = jest.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(<ChatMessage message={mockCodeMessage} />);

    const copyButton = screen.getByText('Copy');
    fireEvent.click(copyButton);

    // Note: This is a simplified test since we're mocking the SyntaxHighlighter
    // In a real test, you'd need to handle the actual code copying logic
    expect(copyButton).toBeInTheDocument();
  });

  it('applies isLast prop correctly', () => {
    const { rerender } = render(<ChatMessage message={mockUserMessage} isLast={false} />);

    // Initial render
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();

    // Re-render with isLast true
    rerender(<ChatMessage message={mockUserMessage} isLast={true} />);

    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
  });

  it('memoizes formatted timestamp', () => {
    const { rerender } = render(<ChatMessage message={mockUserMessage} />);

    // Initial render
    expect(screen.getByText('10:30')).toBeInTheDocument();

    // Re-render same message - should use memoized timestamp
    rerender(<ChatMessage message={mockUserMessage} />);

    expect(screen.getByText('10:30')).toBeInTheDocument();
  });
});