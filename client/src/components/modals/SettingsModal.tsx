import React, { useState } from 'react';
import { X, Save, Settings, Eye, EyeOff, Type, Palette, Clock } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const {
    theme,
    fontSize,
    wordWrap,
    minimap,
    autosaveEnabled,
    autosaveDelay,
    setTheme,
    setFontSize,
    toggleWordWrap,
    toggleMinimap,
    toggleAutosave,
    setAutosaveDelay,
  } = useEditorStore();

  const [tempSettings, setTempSettings] = useState({
    theme,
    fontSize,
    wordWrap,
    minimap,
    autosaveEnabled,
    autosaveDelay,
  });

  const handleSave = () => {
    setTheme(tempSettings.theme);
    setFontSize(tempSettings.fontSize);
    if (tempSettings.wordWrap !== wordWrap) toggleWordWrap();
    if (tempSettings.minimap !== minimap) toggleMinimap();
    if (tempSettings.autosaveEnabled !== autosaveEnabled) toggleAutosave();
    setAutosaveDelay(tempSettings.autosaveDelay);
    onClose();
  };

  const handleReset = () => {
    setTempSettings({
      theme: 'dark',
      fontSize: 14,
      wordWrap: true,
      minimap: true,
      autosaveEnabled: true,
      autosaveDelay: 2000,
    });
  };

  const autosaveDelayOptions = [
    { label: '1 second', value: 1000 },
    { label: '2 seconds', value: 2000 },
    { label: '3 seconds', value: 3000 },
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
    { label: '30 seconds', value: 30000 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-panel border border-vscode-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-vscode-border">
          <div className="flex items-center space-x-3">
            <Settings size={24} className="text-vscode-accent" />
            <h2 className="text-xl font-semibold text-vscode-text">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vscode-border rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-96 vscode-scrollbar">
          <div className="space-y-8">
            {/* Theme Settings */}
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4 flex items-center">
                <Palette size={20} className="mr-2" />
                Appearance
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vscode-text mb-2">
                    Theme
                  </label>
                  <div className="flex space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={tempSettings.theme === 'dark'}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, theme: e.target.value as 'dark' | 'light' }))}
                        className="text-vscode-accent focus:ring-vscode-accent"
                      />
                      <span className="text-vscode-text">Dark</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={tempSettings.theme === 'light'}
                        onChange={(e) => setTempSettings(prev => ({ ...prev, theme: e.target.value as 'dark' | 'light' }))}
                        className="text-vscode-accent focus:ring-vscode-accent"
                      />
                      <span className="text-vscode-text">Light</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Settings */}
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4 flex items-center">
                <Type size={20} className="mr-2" />
                Editor
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vscode-text mb-2">
                    Font Size
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={tempSettings.fontSize}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      className="flex-1 h-2 bg-vscode-border rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-vscode-text font-mono text-sm min-w-8">
                      {tempSettings.fontSize}px
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-vscode-text">
                    Word Wrap
                  </label>
                  <button
                    onClick={() => setTempSettings(prev => ({ ...prev, wordWrap: !prev.wordWrap }))}
                    className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                      tempSettings.wordWrap 
                        ? 'bg-vscode-accent text-white' 
                        : 'bg-vscode-border text-vscode-text hover:bg-vscode-selection'
                    }`}
                  >
                    <span>{tempSettings.wordWrap ? 'On' : 'Off'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-vscode-text">
                    Minimap
                  </label>
                  <button
                    onClick={() => setTempSettings(prev => ({ ...prev, minimap: !prev.minimap }))}
                    className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                      tempSettings.minimap 
                        ? 'bg-vscode-accent text-white' 
                        : 'bg-vscode-border text-vscode-text hover:bg-vscode-selection'
                    }`}
                  >
                    {tempSettings.minimap ? <Eye size={16} /> : <EyeOff size={16} />}
                    <span>{tempSettings.minimap ? 'Show' : 'Hide'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Autosave Settings */}
            <div>
              <h3 className="text-lg font-medium text-vscode-text mb-4 flex items-center">
                <Clock size={20} className="mr-2" />
                Autosave
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-vscode-text">
                      Enable Autosave
                    </label>
                    <p className="text-xs text-vscode-text-muted mt-1">
                      Automatically save files after changes
                    </p>
                  </div>
                  <button
                    onClick={() => setTempSettings(prev => ({ ...prev, autosaveEnabled: !prev.autosaveEnabled }))}
                    className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                      tempSettings.autosaveEnabled 
                        ? 'bg-green-600 text-white' 
                        : 'bg-vscode-border text-vscode-text hover:bg-vscode-selection'
                    }`}
                  >
                    <Save size={16} />
                    <span>{tempSettings.autosaveEnabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>

                {tempSettings.autosaveEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-vscode-text mb-2">
                      Autosave Delay
                    </label>
                    <select
                      value={tempSettings.autosaveDelay}
                      onChange={(e) => setTempSettings(prev => ({ ...prev, autosaveDelay: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-vscode-text focus:outline-none focus:border-vscode-accent"
                    >
                      {autosaveDelayOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-vscode-text-muted mt-1">
                      Time to wait after stopping typing before auto-saving
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-vscode-border">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-vscode-text-muted hover:text-vscode-text transition-colors"
          >
            Reset to Defaults
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-vscode-border hover:bg-vscode-border rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-vscode-accent hover:bg-blue-600 text-white rounded transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;