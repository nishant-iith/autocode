import React, { useRef, useEffect } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEditorStore } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { api } from '../services/api';
import { useAutosave } from '../hooks/useAutosave';

const Editor: React.FC = () => {
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

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editorInstance;

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
      handleSave();
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
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFileContent(activeFile.path, value);
      
      // Schedule autosave when content changes
      scheduleAutosave(activeFile.path, value);
    }
  };

  const handleSave = async () => {
    if (!activeFile || !currentProject) return;

    try {
      // Force immediate save (cancels any pending autosave)
      if (activeFile.isDirty) {
        await api.saveFileContent(
          currentProject.workspaceId,
          activeFile.path,
          activeFile.content
        );
        saveFile(activeFile.path);
      } else {
        // Force save any pending autosave
        await forceSave();
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

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
        <div className="text-center">
          <h2 className="text-xl mb-2">No file selected</h2>
          <p>Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-vscode-editor relative">
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
      <div className="absolute top-2 right-2 flex flex-col space-y-1">
        {isSaving && (
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;