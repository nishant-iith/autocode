import React, { useEffect, useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Plus,
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

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  onFileClick: (node: FileNode) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, depth, onFileClick }) => {
  const { toggleFolder, currentProject, refreshFileTree } = useProjectStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.path);
    } else {
      onFileClick(node);
    }
  };

  const handleRename = async () => {
    if (!currentProject || newName === node.name) {
      setIsRenaming(false);
      return;
    }

    try {
      const newPath = node.path.replace(node.name, newName);
      await api.renameFile(currentProject.workspaceId, node.path, newPath);
      await refreshFileTree();
      setIsRenaming(false);
    } catch (error) {
      console.error('Failed to rename file:', error);
      setNewName(node.name);
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!currentProject) return;
    
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      try {
        await api.deleteFile(currentProject.workspaceId, node.path);
        await refreshFileTree();
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const getFileIcon = () => {
    if (node.type === 'folder') {
      return node.isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
    
    const fileName = node.name.toLowerCase();
    const extension = node.name.split('.').pop()?.toLowerCase();
    
    // Special files
    if (fileName === 'package.json') {
      return <Package size={16} className="text-green-600" />;
    }
    if (fileName === 'package-lock.json' || fileName === 'yarn.lock') {
      return <Package size={16} className="text-orange-600" />;
    }
    if (fileName.startsWith('readme')) {
      return <FileText size={16} className="text-green-400" />;
    }
    if (fileName === '.gitignore' || fileName === '.env' || fileName.startsWith('.env')) {
      return <Settings size={16} className="text-gray-500" />;
    }
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return <FileCode size={16} className="text-yellow-500" />;
      case 'ts':
      case 'tsx':
        return <FileCode size={16} className="text-blue-500" />;
      case 'json':
        return <FileJson size={16} className="text-yellow-600" />;
      case 'html':
        return <Globe size={16} className="text-orange-500" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <Hash size={16} className="text-blue-400" />;
      case 'md':
      case 'markdown':
        return <FileText size={16} className="text-gray-400" />;
      case 'txt':
        return <FileText size={16} className="text-gray-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'ico':
        return <Image size={16} className="text-purple-500" />;
      case 'config':
      case 'conf':
        return <Settings size={16} className="text-gray-400" />;
      case 'package':
        return <Package size={16} className="text-green-600" />;
      case 'py':
        return <Code size={16} className="text-blue-600" />;
      case 'java':
        return <Code size={16} className="text-red-600" />;
      case 'cpp':
      case 'c':
        return <Code size={16} className="text-blue-700" />;
      case 'go':
        return <Code size={16} className="text-cyan-500" />;
      case 'rs':
        return <Code size={16} className="text-orange-600" />;
      case 'php':
        return <Code size={16} className="text-purple-600" />;
      case 'rb':
        return <Code size={16} className="text-red-500" />;
      case 'sh':
        return <Code size={16} className="text-green-500" />;
      case 'yml':
      case 'yaml':
        return <Settings size={16} className="text-yellow-500" />;
      case 'xml':
        return <Code size={16} className="text-orange-400" />;
      case 'sql':
        return <Code size={16} className="text-blue-300" />;
      default:
        return <File size={16} className="text-gray-400" />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(node.name);
      setIsRenaming(false);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center hover:bg-vscode-border cursor-pointer group relative`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowContextMenu(true);
        }}
      >
        <div className="flex items-center flex-1 py-1">
          {node.type === 'folder' && (
            <span className="mr-1 text-vscode-text-muted">
              {node.isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          )}
          
          <span className="mr-2 text-vscode-text-muted">
            {getFileIcon()}
          </span>
          
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="bg-vscode-editor border border-vscode-accent rounded px-1 py-0 text-sm focus:outline-none flex-1"
              autoFocus
            />
          ) : (
            <span className="text-sm text-vscode-text truncate flex-1">
              {node.name}
            </span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 pr-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowContextMenu(true);
            }}
            className="p-1 hover:bg-vscode-border rounded"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>

        {showContextMenu && (
          <div className="absolute right-0 top-full bg-vscode-panel border border-vscode-border rounded shadow-lg py-1 z-50 min-w-32">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setShowContextMenu(false);
              }}
              className="flex items-center space-x-2 px-3 py-1 hover:bg-vscode-border w-full text-left text-sm"
            >
              <Edit3 size={12} />
              <span>Rename</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
                setShowContextMenu(false);
              }}
              className="flex items-center space-x-2 px-3 py-1 hover:bg-vscode-border w-full text-left text-sm text-red-400"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {node.type === 'folder' && node.isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC = () => {
  const { fileTree, currentProject, refreshFileTree } = useProjectStore();
  const { openFile } = useEditorStore();

  useEffect(() => {
    if (currentProject) {
      refreshFileTree();
    }
  }, [currentProject, refreshFileTree]);

  const handleFileClick = async (node: FileNode) => {
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
  };

  if (!currentProject) {
    return (
      <div className="p-4 text-center text-vscode-text-muted">
        <p>No project selected</p>
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="p-4 text-center text-vscode-text-muted">
        <p>No files in project</p>
      </div>
    );
  }

  return (
    <div className="vscode-scrollbar overflow-auto flex-1">
      {fileTree.map((node) => (
        <FileTreeItem
          key={node.id}
          node={node}
          depth={0}
          onFileClick={handleFileClick}
        />
      ))}
    </div>
  );
};

export default FileTree;