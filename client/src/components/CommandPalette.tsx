import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, Save, Palette, Type, Eye, EyeOff, Clock } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  group: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  onOpenSettings?: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, onOpenSettings }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    activeFile,
    saveFile,
    setFontSize,
    fontSize,
    toggleWordWrap,
    wordWrap,
    toggleMinimap,
    minimap,
    setTheme,
    toggleAutosave,
    autosaveEnabled,
    setAutosaveDelay,
  } = useEditorStore();
  
  const { currentProject } = useProjectStore();

  const commands: Command[] = [
    // File commands
    {
      id: 'file.save',
      title: 'Save File',
      description: 'Save the current file',
      icon: <Save size={16} />,
      action: () => {
        if (activeFile && currentProject) {
          saveFile(activeFile.path);
        }
        onClose();
      },
      group: 'File',
    },
    
    // View commands
    {
      id: 'view.toggleWordWrap',
      title: `${wordWrap ? 'Disable' : 'Enable'} Word Wrap`,
      description: 'Toggle word wrapping in the editor',
      icon: <Type size={16} />,
      action: () => {
        toggleWordWrap();
        onClose();
      },
      group: 'View',
    },
    {
      id: 'view.toggleMinimap',
      title: `${minimap ? 'Hide' : 'Show'} Minimap`,
      description: 'Toggle the minimap in the editor',
      icon: minimap ? <EyeOff size={16} /> : <Eye size={16} />,
      action: () => {
        toggleMinimap();
        onClose();
      },
      group: 'View',
    },
    {
      id: 'view.increaseFontSize',
      title: 'Increase Font Size',
      description: 'Make the editor font larger',
      icon: <Type size={16} />,
      action: () => {
        setFontSize(Math.min(fontSize + 2, 24));
        onClose();
      },
      group: 'View',
    },
    {
      id: 'view.decreaseFontSize',
      title: 'Decrease Font Size',
      description: 'Make the editor font smaller',
      icon: <Type size={16} />,
      action: () => {
        setFontSize(Math.max(fontSize - 2, 10));
        onClose();
      },
      group: 'View',
    },
    
    // Autosave commands
    {
      id: 'autosave.toggle',
      title: `${autosaveEnabled ? 'Disable' : 'Enable'} Autosave`,
      description: 'Toggle automatic file saving',
      icon: <Clock size={16} />,
      action: () => {
        toggleAutosave();
        onClose();
      },
      group: 'Autosave',
    },
    {
      id: 'autosave.delay1s',
      title: 'Set Autosave Delay to 1 Second',
      description: 'Save files 1 second after changes',
      icon: <Clock size={16} />,
      action: () => {
        setAutosaveDelay(1000);
        onClose();
      },
      group: 'Autosave',
    },
    {
      id: 'autosave.delay2s',
      title: 'Set Autosave Delay to 2 Seconds',
      description: 'Save files 2 seconds after changes',
      icon: <Clock size={16} />,
      action: () => {
        setAutosaveDelay(2000);
        onClose();
      },
      group: 'Autosave',
    },
    {
      id: 'autosave.delay5s',
      title: 'Set Autosave Delay to 5 Seconds',
      description: 'Save files 5 seconds after changes',
      icon: <Clock size={16} />,
      action: () => {
        setAutosaveDelay(5000);
        onClose();
      },
      group: 'Autosave',
    },
    
    // Settings command
    ...(onOpenSettings ? [{
      id: 'settings.open',
      title: 'Open Settings',
      description: 'Open the settings modal',
      icon: <Settings size={16} />,
      action: () => {
        onOpenSettings();
        onClose();
      },
      group: 'Settings',
    }] : []),
    
    // Theme commands
    {
      id: 'theme.dark',
      title: 'Dark Theme',
      description: 'Switch to dark theme',
      icon: <Palette size={16} />,
      action: () => {
        setTheme('dark');
        onClose();
      },
      group: 'Theme',
    },
    {
      id: 'theme.light',
      title: 'Light Theme',
      description: 'Switch to light theme',
      icon: <Palette size={16} />,
      action: () => {
        setTheme('light');
        onClose();
      },
      group: 'Theme',
    },
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.description.toLowerCase().includes(query.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.group]) {
      acc[command.group] = [];
    }
    acc[command.group].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-vscode-panel border border-vscode-border rounded-lg shadow-2xl w-full max-w-2xl max-h-96 overflow-hidden">
        <div className="p-4 border-b border-vscode-border">
          <div className="flex items-center space-x-3">
            <Search size={20} className="text-vscode-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-vscode-text placeholder-vscode-text-muted outline-none text-lg"
              placeholder="Type a command or search..."
            />
          </div>
        </div>

        <div className="overflow-auto max-h-80 vscode-scrollbar">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-6 text-center text-vscode-text-muted">
              <p>No commands found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([group, commands]) => (
              <div key={group}>
                <div className="px-4 py-2 text-xs font-medium text-vscode-text-muted uppercase tracking-wider bg-vscode-bg">
                  {group}
                </div>
                {commands.map((command) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  return (
                    <div
                      key={command.id}
                      className={`px-4 py-3 flex items-center space-x-3 cursor-pointer ${
                        globalIndex === selectedIndex
                          ? 'bg-vscode-selection'
                          : 'hover:bg-vscode-border'
                      }`}
                      onClick={() => command.action()}
                    >
                      <div className="text-vscode-text-muted">
                        {command.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-vscode-text font-medium">
                          {command.title}
                        </div>
                        <div className="text-sm text-vscode-text-muted truncate">
                          {command.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-vscode-bg border-t border-vscode-border text-xs text-vscode-text-muted">
          Press <kbd className="px-1 bg-vscode-border rounded">↑↓</kbd> to navigate,{' '}
          <kbd className="px-1 bg-vscode-border rounded">Enter</kbd> to select,{' '}
          <kbd className="px-1 bg-vscode-border rounded">Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;