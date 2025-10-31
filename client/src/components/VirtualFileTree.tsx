import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { List } from 'react-window';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Trash2,
  Edit3,
  MoreHorizontal,
  FileText,
  Code,
  FileJson,
  Globe,
  Image,
  Settings,
  Package,
  FileCode,
  Hash
} from 'lucide-react';
import { useProjectStore, FileNode } from '../store/projectStore';
import { useEditorStore } from '../store/editorStore';
import { api } from '../services/api';

interface VirtualFileTreeItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    flattenedItems: FlattenedFileNode[];
    onFileClick: (node: FileNode) => void;
    onToggleFolder: (path: string) => void;
    onRename: (path: string, newName: string) => void;
    onDelete: (path: string) => void;
  };
}

interface FlattenedFileNode {
  node: FileNode;
  depth: number;
  isVisible: boolean;
}

const VirtualFileTreeItem: React.FC<VirtualFileTreeItemProps> = ({ index, style, data }) => {
  const { flattenedItems, onFileClick, onToggleFolder, onRename, onDelete } = data;
  const item = flattenedItems[index];

  if (!item || !item.isVisible) return null;

  const { node, depth } = item;
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (isLoading) return;
    if (node.type === 'folder') {
      onToggleFolder(node.path);
    } else {
      onFileClick(node);
    }
  }, [node, onToggleFolder, onFileClick, isLoading]);

  const handleRename = useCallback(async () => {
    if (newName === node.name) {
      setIsRenaming(false);
      return;
    }

    setIsLoading(true);
    try {
      await onRename(node.path, newName);
      setIsRenaming(false);
    } catch (error) {
      console.error('Failed to rename file:', error);
      setNewName(node.name);
      setIsRenaming(false);
    } finally {
      setIsLoading(false);
    }
  }, [newName, node.name, node.path, onRename]);

  const handleDelete = useCallback(async () => {
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      setIsLoading(true);
      try {
        await onDelete(node.path);
      } catch (error) {
        console.error('Failed to delete file:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [node.name, onDelete]);

  const fileIcon = useMemo(() => {
    if (node.type === 'folder') {
      return node.isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
    }

    const fileName = node.name.toLowerCase();
    const extension = node.name.split('.').pop()?.toLowerCase();

    // Special files
    if (fileName === 'package.json') {
      return <Package size={16} className="text-green-400" />;
    }
    if (fileName === 'package-lock.json' || fileName === 'yarn.lock') {
      return <Package size={16} className="text-orange-400" />;
    }
    if (fileName.startsWith('readme')) {
      return <FileText size={16} className="text-green-400" />;
    }
    if (fileName === '.gitignore' || fileName === '.env' || fileName.startsWith('.env')) {
      return <Settings size={16} className="text-gray-400" />;
    }

    switch (extension) {
      case 'js':
      case 'jsx':
        return <FileCode size={16} className="text-yellow-400" />;
      case 'ts':
      case 'tsx':
        return <FileCode size={16} className="text-blue-400" />;
      case 'json':
        return <FileJson size={16} className="text-yellow-300" />;
      case 'html':
        return <Globe size={16} className="text-orange-400" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <Hash size={16} className="text-blue-400" />;
      case 'md':
      case 'markdown':
        return <FileText size={16} className="text-gray-300" />;
      case 'txt':
        return <FileText size={16} className="text-gray-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'ico':
        return <Image size={16} className="text-purple-400" />;
      case 'py':
        return <Code size={16} className="text-blue-300" />;
      case 'java':
        return <Code size={16} className="text-red-400" />;
      case 'cpp':
      case 'c':
        return <Code size={16} className="text-blue-500" />;
      case 'go':
        return <Code size={16} className="text-cyan-400" />;
      case 'rs':
        return <Code size={16} className="text-orange-400" />;
      case 'php':
        return <Code size={16} className="text-purple-500" />;
      case 'rb':
        return <Code size={16} className="text-red-400" />;
      case 'sh':
        return <Code size={16} className="text-green-400" />;
      case 'yml':
      case 'yaml':
        return <Settings size={16} className="text-yellow-400" />;
      default:
        return <File size={16} className="text-gray-400" />;
    }
  }, [node.type, node.name, node.isExpanded]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(node.name);
      setIsRenaming(false);
    }
  }, [handleRename, node.name]);

  const paddingLeft = `${depth * 16 + 12}px`;

  return (
    <div style={style}>
      <div
        className={`
          flex items-center cursor-pointer group relative select-none
          transition-all duration-200 ease-out
          ${isHovered ? 'bg-vscode-border/50' : ''}
          ${isLoading ? 'opacity-60' : 'hover:bg-vscode-border/70'}
          ${node.type === 'file' ? 'hover:bg-blue-500/10' : ''}
        `}
        style={{ paddingLeft }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowContextMenu(true);
        }}
      >
        <div className="flex items-center flex-1 py-1.5">
          {node.type === 'folder' && (
            <span className="mr-1 text-vscode-text-muted transition-transform duration-150">
              {node.isExpanded ?
                <ChevronDown size={12} className="transform transition-transform duration-150" /> :
                <ChevronRight size={12} className="transform transition-transform duration-150" />
              }
            </span>
          )}

          <span className="mr-2.5 text-vscode-text-muted transition-all duration-150 hover:scale-110">
            {fileIcon}
          </span>

          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="bg-vscode-editor border border-vscode-accent rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1 transition-all duration-150"
              autoFocus
            />
          ) : (
            <span className={`
              text-sm truncate flex-1 transition-all duration-150
              ${node.type === 'file' ? 'text-vscode-text' : 'text-vscode-text font-medium'}
              ${isHovered ? 'text-white' : ''}
            `}>
              {node.name}
            </span>
          )}
        </div>

        <div className={`
          flex items-center space-x-1 pr-2 transition-all duration-200
          ${isHovered || showContextMenu ? 'opacity-100' : 'opacity-0'}
        `}>
          {isLoading && (
            <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowContextMenu(true);
            }}
            className="p-1 hover:bg-vscode-border rounded transition-all duration-150 hover:scale-110"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>

        {showContextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowContextMenu(false)}
            />
            <div className="absolute right-0 top-full bg-vscode-panel border border-vscode-border rounded-md shadow-xl py-1 z-50 min-w-36 animate-in slide-in-from-right-2 fade-in duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setShowContextMenu(false);
                }}
                className="flex items-center space-x-3 px-3 py-2 hover:bg-vscode-border/70 w-full text-left text-sm transition-all duration-150 hover:text-white"
                disabled={isLoading}
              >
                <Edit3 size={14} />
                <span>Rename</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                  setShowContextMenu(false);
                }}
                className="flex items-center space-x-3 px-3 py-2 hover:bg-red-500/20 w-full text-left text-sm text-red-400 hover:text-red-300 transition-all duration-150"
                disabled={isLoading}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to flatten file tree
const flattenFileTree = (nodes: FileNode[], depth: number = 0): FlattenedFileNode[] => {
  const flattened: FlattenedFileNode[] = [];

  for (const node of nodes) {
    flattened.push({
      node,
      depth,
      isVisible: true
    });

    if (node.type === 'folder' && node.isExpanded && node.children) {
      flattened.push(...flattenFileTree(node.children, depth + 1));
    }
  }

  return flattened;
};

const VirtualFileTree: React.FC = () => {
  const { fileTree, currentProject, refreshFileTree, toggleFolder } = useProjectStore();
  const { openFile } = useEditorStore();
  const [isLoading, setIsLoading] = useState(false);
  const [listHeight, setListHeight] = useState(window.innerHeight - 200);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentProject) {
      setIsLoading(true);
      refreshFileTree().finally(() => setIsLoading(false));
    }
  }, [currentProject, refreshFileTree]);

  useEffect(() => {
    const handleResize = () => {
      setListHeight(window.innerHeight - 200);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleFileClick = useCallback(async (node: FileNode) => {
    if (!currentProject || node.type !== 'file') return;

    try {
      const fileData = await api.getFileContent(currentProject.workspaceId, node.path);
      openFile({
        path: node.path,
        name: node.name,
        content: fileData.content,
      });
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  }, [currentProject, openFile]);

  const handleRename = useCallback(async (path: string, newName: string) => {
    if (!currentProject) return;

    const newPath = path.replace(/[^/]+$/, newName);
    await api.renameFile(currentProject.workspaceId, path, newPath);
    await refreshFileTree();
  }, [currentProject, refreshFileTree]);

  const handleDelete = useCallback(async (path: string) => {
    if (!currentProject) return;

    await api.deleteFile(currentProject.workspaceId, path);
    await refreshFileTree();
  }, [currentProject, refreshFileTree]);

  const flattenedItems = useMemo(() => {
    return flattenFileTree(fileTree);
  }, [fileTree]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center text-vscode-text-muted">
        <div className="space-y-3">
          <Folder size={48} className="mx-auto text-vscode-text-muted/50" />
          <p className="text-lg">No project selected</p>
          <p className="text-sm text-vscode-text-muted/70">Choose a project to view its files</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="space-y-4 text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-vscode-text-muted">Loading files...</p>
        </div>
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center text-vscode-text-muted">
        <div className="space-y-3">
          <FileText size={48} className="mx-auto text-vscode-text-muted/50" />
          <p className="text-lg">No files found</p>
          <p className="text-sm text-vscode-text-muted/70">This project appears to be empty</p>
        </div>
      </div>
    );
  }

  // Only use virtual scrolling if there are more than 50 visible items
  const shouldUseVirtualScrolling = flattenedItems.length > 50;

  if (!shouldUseVirtualScrolling) {
    // Fallback to regular rendering for small trees
    return (
      <div className="vscode-scrollbar overflow-auto flex-1 py-1">
        {flattenedItems.map((item, index) => (
          <VirtualFileTreeItem
            key={item.node.id}
            index={index}
            style={{}}
            data={{
              flattenedItems: [item],
              onFileClick: handleFileClick,
              onToggleFolder: toggleFolder,
              onRename: handleRename,
              onDelete: handleDelete
            }}
          />
        ))}
      </div>
    );
  }

  const itemData = {
    flattenedItems,
    onFileClick: handleFileClick,
    onToggleFolder: toggleFolder,
    onRename: handleRename,
    onDelete: handleDelete
  };

  return (
    <div className="flex-1 py-1" ref={listRef}>
      <List
        height={listHeight} // Dynamic height based on viewport
        itemCount={flattenedItems.length}
        itemSize={32} // Height of each file tree item
        itemData={itemData}
        className="vscode-scrollbar"
      >
        {VirtualFileTreeItem}
      </List>
    </div>
  );
};

export default VirtualFileTree;