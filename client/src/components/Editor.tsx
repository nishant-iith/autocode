import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { api } from '../services/api';
import { useAutosave } from '../hooks/useAutosave';
import { useWebContainerFileSync } from '../hooks/useWebContainerFileSync';
import { debounce } from '../utils/debounce';

const Editor: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const {
    activeFile,
    updateFileContent,
    saveFile,
    theme,
    fontSize,
    wordWrap,
    minimap,
  } = useEditorStore();
  const { currentProject } = useProjectStore();
  const { scheduleAutosave, forceSave, isSaving } = useAutosave();
  const { syncFile } = useWebContainerFileSync();

  // Create a debounced sync function to avoid overwhelming the WebContainer
  const debouncedSync = useMemo(
    () => debounce((path: string, content: string) => {
      syncFile(path, content).catch(err =>
        console.error(`[Editor] Failed to sync ${path} to WebContainer:`, err)
      );
    }, 500), // 500ms delay
    [syncFile]
  );

  const handleEditorDidMount = useCallback((editorInstance: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editorInstance;
    setEditorReady(true);

    // Configure Monaco editor
    monaco.editor.defineTheme('vscode-dark-custom', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'cccccc', background: '1e1e1e' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'regexp', foreground: 'd16969' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'class', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'variable', foreground: '9cdcfe' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#cccccc',
        'editor.lineHighlightBackground': '#282828',
        'editor.selectionBackground': '#264f78',
        'editor.selectionHighlightBackground': '#add6ff26',
        'editorCursor.foreground': '#aeafad',
        'editorWhitespace.foreground': '#404040',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editorGutter.background': '#1e1e1e',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
      },
    });

    monaco.editor.setTheme('vscode-dark-custom');

    // Add keyboard shortcuts
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Use a stable reference to avoid dependency issues
      const saveHandler = async () => {
        if (!activeFile || !currentProject) return;
        setIsLoading(true);
        try {
          if (activeFile.isDirty) {
            await api.saveFileContent(
              currentProject.workspaceId,
              activeFile.path,
              activeFile.content
            );
            saveFile(activeFile.path);
          } else {
            await forceSave();
          }
        } catch (error) {
          console.error('Failed to save file:', error);
        } finally {
          setIsLoading(false);
        }
      };
      saveHandler();
    });

    // Configure editor options
    editorInstance.updateOptions({
      fontFamily: 'JetBrains Mono, Consolas, Monaco, Courier New, monospace',
      fontSize: fontSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: true,
      trimAutoWhitespace: true,
      formatOnPaste: true,
      formatOnType: true,
    });

    // Add performance optimizations
    editorInstance.onDidChangeModelContent(() => {
      // Debounced content change handling will be done by the parent handler
    });
  }, [fontSize, wordWrap, minimap, activeFile, currentProject, saveFile, forceSave, setIsLoading]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.path, value);

      // Schedule autosave when content changes
      scheduleAutosave(activeFile.path, value);

      // Trigger real-time sync to WebContainer
      debouncedSync(activeFile.path, value);
    }
  }, [activeFile, updateFileContent, scheduleAutosave, debouncedSync]);


  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: fontSize,
        wordWrap: wordWrap ? 'on' : 'off',
        minimap: { enabled: minimap },
      });
    }
  }, [fontSize, wordWrap, minimap]);

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-vscode-editor text-vscode-text-muted">
        <div className="text-center space-y-4 animate-in fade-in duration-500">
          <div className="w-20 h-20 mx-auto bg-vscode-border/30 rounded-lg flex items-center justify-center">
            <svg className="w-10 h-10 text-vscode-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl mb-2 text-vscode-text">No file selected</h2>
            <p className="text-vscode-text-muted/70">Select a file from the explorer to start editing</p>
          </div>
          <div className="text-xs text-vscode-text-muted/50 space-y-1">
            <p>💡 Quick tip: Use Ctrl+P to quickly open files</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-vscode-editor relative overflow-hidden">
      {/* Loading overlay */}
      {!editorReady && (
        <div className="absolute inset-0 bg-vscode-editor flex items-center justify-center z-20">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-vscode-text-muted">Initializing Monaco Editor...</p>
          </div>
        </div>
      )}
      <MonacoEditor
        height="100%"
        language={activeFile.language}
        value={activeFile.content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vscode-dark-custom' : 'vs-light'}
        options={{
          automaticLayout: true,
          scrollBeyondLastLine: false,
          fontSize: fontSize,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, Courier New, monospace',
          wordWrap: wordWrap ? 'on' : 'off',
          minimap: { enabled: minimap },
          tabSize: 2,
          insertSpaces: true,
          detectIndentation: true,
          trimAutoWhitespace: true,
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          parameterHints: { enabled: true },
          quickSuggestions: true,
          contextmenu: true,
          mouseWheelZoom: true,
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'mouseover',
          unfoldOnClickAfterEndOfLine: false,
          colorDecorators: true,
          codeLens: false,
        }}
      />

      {/* Status indicators */}
      <div className="absolute top-3 right-3 flex flex-col space-y-2 z-10">
        {!editorReady && (
          <div className="bg-vscode-panel/90 backdrop-blur-sm text-vscode-text px-3 py-2 rounded-md text-xs flex items-center space-x-2 border border-vscode-border animate-in fade-in duration-300">
            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading editor...</span>
          </div>
        )}
        {(isSaving || isLoading) && (
          <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-md text-xs flex items-center space-x-2 animate-in slide-in-from-right-2 fade-in duration-200">
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{isLoading ? 'Saving...' : 'Auto-saving...'}</span>
          </div>
        )}
        {activeFile?.isDirty && !isSaving && !isLoading && editorReady && (
          <div className="bg-orange-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-md text-xs flex items-center space-x-2 animate-in slide-in-from-right-2 fade-in duration-200">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Unsaved changes</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;