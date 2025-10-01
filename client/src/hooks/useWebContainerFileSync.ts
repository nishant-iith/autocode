import { useEffect, useCallback, useState } from 'react';
import { useWebContainerInstance } from '../providers/WebContainerProvider';
import { useProjectStore } from '../store/projectStore';
import { api } from '../services/api';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
}

/**
 * Syncs editor files with WebContainer file system
 *
 * Watches for file changes and syncs them to the WebContainer virtual file system.
 * This enables the in-browser dev server to see the latest code.
 */
export const useWebContainerFileSync = () => {
  const { webcontainer } = useWebContainerInstance();
  const { currentProject, fileTree } = useProjectStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  /**
   * Sync a single file to WebContainer
   */
  const syncFile = useCallback(
    async (path: string, content: string) => {
      if (!webcontainer) return;

      try {
        // Normalize path: convert backslashes to forward slashes and remove leading slash
        const cleanPath = path.replace(/\\/g, '/').replace(/^\//, '');

        // Create directory structure if needed
        const dirPath = cleanPath.substring(0, cleanPath.lastIndexOf('/'));
        if (dirPath) {
          await webcontainer.fs.mkdir(dirPath, { recursive: true });
        }

        // Write file content
        await webcontainer.fs.writeFile(cleanPath, content);
        console.log(`📝 Synced: ${cleanPath}`);
      } catch (error) {
        console.error(`Failed to sync file ${path}:`, error);
        throw error;
      }
    },
    [webcontainer]
  );

  /**
   * Recursively sync all files from file tree
   */
  const syncAllFiles = useCallback(async () => {
    if (!webcontainer || !currentProject) {
      console.warn('⚠️ Cannot sync: WebContainer or project not available');
      return;
    }

    setIsSyncing(true);
    console.log('🔄 Syncing entire project to WebContainer...');

    try {
      const syncNode = async (node: FileNode) => {
        if (node.type === 'folder') {
          // Sync all children
          if (node.children) {
            for (const child of node.children) {
              await syncNode(child);
            }
          }
        } else {
          // Fetch and sync file content
          try {
            const fileData = await api.getFileContent(
              currentProject.workspaceId,
              node.path
            );
            await syncFile(node.path, fileData.content);
          } catch (error) {
            console.error(`Failed to fetch content for ${node.path}:`, error);
          }
        }
      };

      // Sync all nodes in file tree
      for (const node of fileTree) {
        await syncNode(node);
      }

      setLastSyncTime(new Date());
      console.log('✅ All project files synced to WebContainer');
    } catch (error) {
      console.error('❌ Failed to sync files:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [webcontainer, currentProject, fileTree, syncFile]);

  /**
   * Auto-sync on mount and when project/fileTree changes
   */
  useEffect(() => {
    if (!webcontainer || !currentProject) return;

    syncAllFiles();
  }, [webcontainer, currentProject]); // Only sync when webcontainer or project changes

  return {
    syncFile,
    syncAllFiles,
    isSyncing,
    lastSyncTime
  };
};
