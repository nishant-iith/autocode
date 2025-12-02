import React from 'react';
import { X, Trash2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useEnhancedChatStore } from '../../store/enhancedChatStore';

interface ChatSettingsModalProps {
    onClose: () => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({ onClose }) => {
    const {
        apiKey,
        isApiKeyValid,
        freeModels,
        selectedModel,
        isLoadingModels,
        maxTokens,
        temperature,
        useStreaming,
        autoExecuteActions,
        contextOptimization,
        setApiKey,
        clearApiKey,
        loadModels,
        selectModel,
        setMaxTokens,
        setTemperature,
        setUseStreaming,
        setAutoExecuteActions,
        setContextOptimization,
    } = useEnhancedChatStore();

    const [apiKeyInput, setApiKeyInput] = React.useState('');
    const [showApiKey, setShowApiKey] = React.useState(false);

    const handleSetApiKey = async () => {
        if (apiKeyInput.trim()) {
            await setApiKey(apiKeyInput.trim());
            setApiKeyInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-vscode-panel border border-vscode-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-vscode-border bg-vscode-sidebar/50">
                    <div className="flex items-center space-x-2">
                        <Sparkles size={18} className="text-vscode-accent" />
                        <h2 className="font-semibold text-vscode-text">AI Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-vscode-border rounded-md text-vscode-text-muted hover:text-vscode-text transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto vscode-scrollbar">
                    {/* API Key Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-vscode-text block">OpenRouter API Key</label>

                        {apiKey ? (
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 px-3 py-2 bg-vscode-editor border border-vscode-border rounded-lg text-sm text-vscode-text font-mono truncate flex items-center justify-between">
                                    <span>{showApiKey ? apiKey : 'sk-or-••••••••••••••••'}</span>
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="text-vscode-text-muted hover:text-vscode-text ml-2"
                                    >
                                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <button
                                    onClick={clearApiKey}
                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    title="Remove API Key"
                                >
                                    <Trash2 size={16} />
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
                                        className="flex-1 px-3 py-2 bg-vscode-editor border border-vscode-border rounded-lg text-sm text-vscode-text focus:outline-none focus:border-vscode-accent focus:ring-1 focus:ring-vscode-accent/50 transition-all"
                                        onKeyPress={(e) => e.key === 'Enter' && handleSetApiKey()}
                                    />
                                    <button
                                        onClick={handleSetApiKey}
                                        disabled={!apiKeyInput.trim()}
                                        className="px-4 py-2 bg-vscode-accent text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                                <p className="text-xs text-vscode-text-muted">
                                    Get your free key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-vscode-accent hover:underline">openrouter.ai</a>
                                </p>
                            </div>
                        )}
                    </div>

                    {isApiKeyValid && (
                        <>
                            <div className="h-px bg-vscode-border" />

                            {/* Model Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-vscode-text">Model</label>
                                    {isLoadingModels && <span className="text-xs text-vscode-text-muted animate-pulse">Loading...</span>}
                                </div>

                                {freeModels.length > 0 ? (
                                    <select
                                        value={selectedModel || ''}
                                        onChange={(e) => selectModel(e.target.value)}
                                        className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded-lg text-sm text-vscode-text focus:outline-none focus:border-vscode-accent"
                                    >
                                        {freeModels.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-red-400 flex items-center justify-between bg-red-400/10 px-3 py-2 rounded-lg">
                                        <span>Failed to load models</span>
                                        <button onClick={loadModels} className="underline hover:text-red-300">Retry</button>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-vscode-border" />

                            {/* Advanced Settings */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-vscode-text-muted uppercase tracking-wider">Advanced Configuration</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center justify-between p-3 bg-vscode-editor border border-vscode-border rounded-lg cursor-pointer hover:border-vscode-accent/50 transition-colors">
                                        <span className="text-sm text-vscode-text">Streaming</span>
                                        <input
                                            type="checkbox"
                                            checked={useStreaming}
                                            onChange={(e) => setUseStreaming(e.target.checked)}
                                            className="w-4 h-4 text-vscode-accent rounded border-vscode-border bg-vscode-panel focus:ring-vscode-accent"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3 bg-vscode-editor border border-vscode-border rounded-lg cursor-pointer hover:border-vscode-accent/50 transition-colors">
                                        <span className="text-sm text-vscode-text">Auto-Run</span>
                                        <input
                                            type="checkbox"
                                            checked={autoExecuteActions}
                                            onChange={(e) => setAutoExecuteActions(e.target.checked)}
                                            className="w-4 h-4 text-vscode-accent rounded border-vscode-border bg-vscode-panel focus:ring-vscode-accent"
                                        />
                                    </label>
                                </div>

                                <label className="flex items-center justify-between p-3 bg-vscode-editor border border-vscode-border rounded-lg cursor-pointer hover:border-vscode-accent/50 transition-colors">
                                    <div>
                                        <div className="text-sm text-vscode-text">Context Optimization</div>
                                        <div className="text-xs text-vscode-text-muted mt-0.5">Smartly include relevant files</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={contextOptimization}
                                        onChange={(e) => setContextOptimization(e.target.checked)}
                                        className="w-4 h-4 text-vscode-accent rounded border-vscode-border bg-vscode-panel focus:ring-vscode-accent"
                                    />
                                </label>

                                <div className="space-y-3 pt-2">
                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-vscode-text-muted">Max Tokens</span>
                                            <span className="text-vscode-text font-mono">{maxTokens}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="4000"
                                            step="100"
                                            value={maxTokens}
                                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-vscode-border rounded-full appearance-none cursor-pointer accent-vscode-accent"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs mb-2">
                                            <span className="text-vscode-text-muted">Temperature</span>
                                            <span className="text-vscode-text font-mono">{temperature}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.1"
                                            value={temperature}
                                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-vscode-border rounded-full appearance-none cursor-pointer accent-vscode-accent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-vscode-border bg-vscode-sidebar/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-vscode-accent text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatSettingsModal;
