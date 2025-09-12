import { useCallback, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { api } from '../services/api';

interface UseAutosaveOptions {
  enabled?: boolean;
  delay?: number;
}

export const useAutosave = (options: UseAutosaveOptions = {}) => {
  const { 
    autosaveEnabled, 
    autosaveDelay, 
    isSaving,
    setIsSaving,
    saveFile,
    updateLastSaved 
  } = useEditorStore();
  
  const { currentProject } = useProjectStore();
  
  const timeoutRef = useRef<number>();
  const pendingSaveRef = useRef<{ path: string; content: string } | null>(null);
  
  const enabled = options.enabled ?? autosaveEnabled;
  const delay = options.delay ?? autosaveDelay;

  const performSave = useCallback(async (path: string, content: string) => {
    if (!currentProject || !enabled) return;
    
    try {
      setIsSaving(true);
      await api.saveFileContent(currentProject.workspaceId, path, content);
      saveFile(path);
      updateLastSaved(path);
      console.log(`[Autosave] Saved ${path}`);
    } catch (error) {
      console.error('[Autosave] Failed to save file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentProject, enabled, setIsSaving, saveFile, updateLastSaved]);

  const scheduleAutosave = useCallback((path: string, content: string) => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Store pending save data
    pendingSaveRef.current = { path, content };

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        const { path: pendingPath, content: pendingContent } = pendingSaveRef.current;
        performSave(pendingPath, pendingContent);
        pendingSaveRef.current = null;
      }
    }, delay);
  }, [enabled, delay, performSave]);

  const cancelAutosave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    pendingSaveRef.current = null;
  }, []);

  const forceSave = useCallback(async () => {
    if (pendingSaveRef.current) {
      const { path, content } = pendingSaveRef.current;
      cancelAutosave();
      await performSave(path, content);
    }
  }, [performSave, cancelAutosave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAutosave();
    };
  }, [cancelAutosave]);

  return {
    scheduleAutosave,
    cancelAutosave,
    forceSave,
    isSaving,
    enabled,
    delay,
  };
};