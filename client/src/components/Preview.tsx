import React from 'react';
import { Eye, Globe, Smartphone, Tablet, Monitor } from 'lucide-react';

const Preview: React.FC = () => {
  return (
    <div className="h-full bg-vscode-editor flex flex-col">
      {/* Preview Header */}
      <div className="h-12 bg-vscode-panel border-b border-vscode-border flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <Eye size={16} className="text-purple-400" />
          <span className="text-sm font-medium text-vscode-text">Live Preview</span>
        </div>
        
        {/* Device Preview Options */}
        <div className="flex items-center space-x-2">
          <button
            className="p-2 rounded-md hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text transition-colors"
            title="Desktop View"
          >
            <Monitor size={16} />
          </button>
          <button
            className="p-2 rounded-md hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text transition-colors"
            title="Tablet View"
          >
            <Tablet size={16} />
          </button>
          <button
            className="p-2 rounded-md hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text transition-colors"
            title="Mobile View"
          >
            <Smartphone size={16} />
          </button>
          <div className="w-px h-6 bg-vscode-border mx-2" />
          <button
            className="p-2 rounded-md hover:bg-vscode-border/50 text-vscode-text-muted hover:text-vscode-text transition-colors"
            title="Open in Browser"
          >
            <Globe size={16} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Eye size={40} className="text-purple-400" />
          </div>
          <h3 className="text-lg font-medium text-vscode-text mb-3">
            Website Preview
          </h3>
          <p className="text-vscode-text-muted mb-4 max-w-md">
            Your website preview will appear here when you start a development server
          </p>
          <div className="space-y-2 text-sm text-vscode-text-muted">
            <p>• Run your development server</p>
            <p>• Preview changes in real-time</p>
            <p>• Test responsive design</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preview;