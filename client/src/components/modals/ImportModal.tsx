import React, { useState } from 'react';
import { X, Upload, Github, Archive, Loader } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'github'>('zip');
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // ZIP import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // GitHub import state
  const [repoUrl, setRepoUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  
  const { importFromZip, importFromGithub } = useProjectStore();

  const handleZipImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      // importFromZip now automatically sets it as current project
      await importFromZip(selectedFile);
      onSuccess();
    } catch (error) {
      console.error('Failed to import ZIP:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleGithubImport = async () => {
    if (!repoUrl.trim()) return;

    setIsImporting(true);
    try {
      // importFromGithub now automatically sets it as current project
      await importFromGithub(repoUrl.trim(), accessToken.trim() || undefined);
      onSuccess();
    } catch (error) {
      console.error('Failed to import from GitHub:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-vscode-panel border border-vscode-border rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-vscode-border">
          <h2 className="text-lg font-semibold text-vscode-text">Import Project</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-vscode-border rounded"
            disabled={isImporting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-vscode-border">
          <button
            onClick={() => setActiveTab('zip')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'zip'
                ? 'border-vscode-accent text-vscode-accent'
                : 'border-transparent text-vscode-text-muted hover:text-vscode-text'
            }`}
            disabled={isImporting}
          >
            <div className="flex items-center justify-center space-x-2">
              <Archive size={16} />
              <span>ZIP File</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'github'
                ? 'border-vscode-accent text-vscode-accent'
                : 'border-transparent text-vscode-text-muted hover:text-vscode-text'
            }`}
            disabled={isImporting}
          >
            <div className="flex items-center justify-center space-x-2">
              <Github size={16} />
              <span>GitHub</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-vscode-accent bg-vscode-accent bg-opacity-10'
                    : 'border-vscode-border hover:border-vscode-text-muted'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <Archive size={48} className="mx-auto text-vscode-accent" />
                    <p className="text-vscode-text font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-vscode-text-muted">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-vscode-accent hover:underline"
                      disabled={isImporting}
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload size={48} className="mx-auto text-vscode-text-muted" />
                    <div>
                      <p className="text-vscode-text mb-2">
                        Drag and drop your ZIP file here, or
                      </p>
                      <label className="inline-block px-4 py-2 bg-vscode-accent hover:bg-blue-600 text-white text-sm rounded cursor-pointer transition-colors">
                        Choose File
                        <input
                          type="file"
                          className="hidden"
                          accept=".zip"
                          onChange={handleFileChange}
                          disabled={isImporting}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-vscode-text-muted">
                      Supports ZIP files up to 100MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm border border-vscode-border hover:bg-vscode-border rounded transition-colors"
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleZipImport}
                  className="flex-1 px-4 py-2 text-sm bg-vscode-accent hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Import ZIP</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vscode-text mb-2">
                  Repository URL *
                </label>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-vscode-text focus:outline-none focus:border-vscode-accent"
                  placeholder="https://github.com/username/repository"
                  disabled={isImporting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vscode-text mb-2">
                  Access Token (optional)
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-3 py-2 bg-vscode-editor border border-vscode-border rounded text-vscode-text focus:outline-none focus:border-vscode-accent"
                  placeholder="ghp_..."
                  disabled={isImporting}
                />
                <p className="text-xs text-vscode-text-muted mt-1">
                  Required for private repositories
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm border border-vscode-border hover:bg-vscode-border rounded transition-colors"
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGithubImport}
                  className="flex-1 px-4 py-2 text-sm bg-vscode-accent hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  disabled={!repoUrl.trim() || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader className="animate-spin" size={16} />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <span>Import Repository</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;