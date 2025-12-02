import React, { useState, useCallback } from 'react';
import {
  Eye,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Play,
  Square,
  RefreshCw,
  Terminal,
  X,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useWebContainerInstance } from '../providers/WebContainerProvider';
import { useWebContainerStore } from '../store/webcontainerStore';
import { useWebContainerOps } from '../hooks/useWebContainerOps';
import { useWebContainerFileSync } from '../hooks/useWebContainerFileSync';
import { useProjectStore } from '../store/projectStore';

type DeviceView = 'desktop' | 'tablet' | 'mobile';

/**
 * EnhancedPreview Component
 *
 * Live preview with WebContainer integration
 * - Runs Node.js entirely in browser
 * - Real-time iframe preview
 * - Device view switching
 * - Terminal output
 */
const EnhancedPreview: React.FC = () => {
  const { webcontainer, isBooting, bootError } = useWebContainerInstance();
  const { previewUrl, isInstalling, isRunning, logs } = useWebContainerStore();
  const { installDependencies, startDevServer, stopServer } = useWebContainerOps();
  const { currentProject } = useProjectStore();
  const { syncAllFiles, isSyncing } = useWebContainerFileSync();
  const [deviceView, setDeviceView] = useState<DeviceView>('desktop');
  const [showTerminal, setShowTerminal] = useState(false);

  /**
   * Handle Run Project button click
   * 1. Sync all files to WebContainer
   * 2. Install dependencies
   * 3. Start dev server
   */
  const handleRunProject = useCallback(async () => {
    if (!webcontainer || !currentProject) return;

    try {
      // Step 1: Ensure all files are synced
      console.log('📦 Step 1: Syncing files...');
      await syncAllFiles();

      // Step 2: Install dependencies
      console.log('📦 Step 2: Installing dependencies...');
      await installDependencies();

      // Step 3: Start dev server
      console.log('🚀 Step 3: Starting dev server...');
      await startDevServer('dev');
    } catch (error) {
      console.error('Failed to run project:', error);
    }
  }, [webcontainer, currentProject, syncAllFiles, installDependencies, startDevServer]);

  /**
   * Handle Stop button click
   */
  const handleStop = useCallback(() => {
    stopServer();
  }, [stopServer]);

  /**
   * Handle Refresh button click
   */
  const handleRefresh = useCallback(() => {
    const iframe = document.querySelector('iframe#preview');
    if (iframe && previewUrl) {
      (iframe as HTMLIFrameElement).src = previewUrl;
    }
  }, [previewUrl]);

  /**
   * Get iframe dimensions based on device view
   */
  const getIframeStyle = () => {
    switch (deviceView) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      case 'desktop':
      default:
        return { width: '100%', height: '100%' };
    }
  };

  // Boot error state
  if (bootError) {
    return (
      <div className="h-full bg-vscode-editor flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-vscode-text mb-3">
            WebContainer Boot Error
          </h3>
          <p className="text-vscode-text-muted mb-4">{bootError.message}</p>
          <div className="bg-vscode-panel border border-vscode-border rounded-lg p-4 text-left">
            <p className="text-sm text-vscode-text-muted mb-2">
              <strong>Browser Requirements:</strong>
            </p>
            <ul className="text-xs text-vscode-text-muted space-y-1 list-disc list-inside">
              <li>Chrome/Edge/Brave (recommended)</li>
              <li>Firefox 124+ (beta support)</li>
              <li>Safari 16.4+ (limited support)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Booting state
  if (isBooting) {
    return (
      <div className="h-full bg-vscode-editor flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-vscode-text text-lg font-medium mb-2">
            Booting WebContainer...
          </p>
          <p className="text-vscode-text-muted text-sm">
            Starting Node.js runtime in your browser
          </p>
        </div>
      </div>
    );
  }

  // No project state
  if (!currentProject) {
    return (
      <div className="h-full bg-vscode-editor flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 mx-auto mb-6 bg-vscode-border/30 rounded-full flex items-center justify-center">
            <Eye size={32} className="text-vscode-text-muted" />
          </div>
          <h3 className="text-xl font-semibold text-vscode-text mb-3">
            No Project Open
          </h3>
          <p className="text-vscode-text-muted">
            Create or open a project to see live preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-vscode-editor flex flex-col">
      {/* Preview Header */}
      <div className="h-12 bg-vscode-panel border-b border-vscode-border flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Eye size={16} className="text-purple-400" />
          <span className="text-sm font-medium text-vscode-text">Live Preview</span>
          {previewUrl && (
            <span className="text-xs text-vscode-text-muted truncate max-w-xs">
              {previewUrl}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          {/* Run/Stop Controls */}
          {!isRunning ? (
            <button
              onClick={handleRunProject}
              disabled={isSyncing || isInstalling || isBooting}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
              title="Run Project (sync files → npm install → npm run dev)"
            >
              {isSyncing ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Syncing...
                </>
              ) : isInstalling ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Run
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
              title="Stop Server"
            >
              <Square size={14} />
              Stop
            </button>
          )}

          {/* Refresh */}
          {previewUrl && (
            <button
              onClick={handleRefresh}
              className="p-2 rounded-md hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text transition-colors"
              title="Refresh Preview"
            >
              <RefreshCw size={16} />
            </button>
          )}

          <div className="w-px h-6 bg-vscode-border mx-2" />

          {/* Device View Options */}
          <button
            onClick={() => setDeviceView('desktop')}
            className={`p-2 rounded-md transition-colors ${deviceView === 'desktop'
                ? 'bg-vscode-border text-vscode-text'
                : 'hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text'
              }`}
            title="Desktop View"
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setDeviceView('tablet')}
            className={`p-2 rounded-md transition-colors ${deviceView === 'tablet'
                ? 'bg-vscode-border text-vscode-text'
                : 'hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text'
              }`}
            title="Tablet View"
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setDeviceView('mobile')}
            className={`p-2 rounded-md transition-colors ${deviceView === 'mobile'
                ? 'bg-vscode-border text-vscode-text'
                : 'hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text'
              }`}
            title="Mobile View"
          >
            <Smartphone size={16} />
          </button>

          <div className="w-px h-6 bg-vscode-border mx-2" />

          {/* Terminal Toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-2 rounded-md transition-colors ${showTerminal
                ? 'bg-vscode-border text-vscode-text'
                : 'hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text'
              }`}
            title="Toggle Terminal"
          >
            <Terminal size={16} />
          </button>

          {/* Open in Browser */}
          {previewUrl && (
            <button
              onClick={() => window.open(previewUrl, '_blank')}
              className="p-2 rounded-md hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text transition-colors"
              title="Open in Browser"
            >
              <Globe size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Preview Area */}
        <div
          className={`${showTerminal ? 'flex-1' : 'h-full'
            } flex items-center justify-center bg-gray-100 p-4 overflow-auto`}
        >
          {previewUrl ? (
            <iframe
              id="preview"
              src={previewUrl}
              className="bg-white rounded-lg shadow-lg"
              style={getIframeStyle()}
              title="Live Preview"
            />
          ) : (
            <div className="text-center max-w-md">
              <div className="w-24 h-24 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Eye size={40} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Live Preview with WebContainer
              </h3>
              <p className="text-gray-600 mb-4">
                Click <strong>"Run"</strong> to start your development server and see your app
                running live
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✨ Runs Node.js entirely in your browser</p>
                <p>⚡ Instant updates with hot reload</p>
                <p>🌐 Works offline once loaded</p>
                <p>🚀 20% faster builds than localhost</p>
              </div>
            </div>
          )}
        </div>

        {/* Terminal Output */}
        {showTerminal && (
          <div className="h-64 bg-black border-t border-vscode-border flex flex-col flex-shrink-0">
            <div className="h-8 bg-vscode-panel border-b border-vscode-border flex items-center justify-between px-3">
              <div className="flex items-center gap-2 text-xs text-vscode-text">
                <Terminal size={12} />
                Terminal Output
              </div>
              <button
                onClick={() => setShowTerminal(false)}
                className="text-vscode-text-muted hover:text-vscode-text"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 font-mono text-xs text-green-400 vscode-scrollbar">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500">
                  No logs yet. Run your project to see output.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPreview;
