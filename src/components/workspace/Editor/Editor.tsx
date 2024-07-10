import { useSettingAction } from '@/hooks/setting.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { ContractLanguage, Tree } from '@/interfaces/workspace.interface';
import EventEmitter from '@/utility/eventEmitter';
import { highlightCodeSnippets } from '@/utility/syntaxHighlighter';
import { fileTypeFromFileName } from '@/utility/utils';
import EditorDefault, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { FC, useEffect, useRef, useState } from 'react';
import { useLatest } from 'react-use';
import ReconnectingWebSocket from 'reconnecting-websocket';
import s from './Editor.module.scss';
import { editorOnMount } from './EditorOnMount';
type Monaco = typeof monaco;

interface Props {
  file: Tree;
  projectId: string;
  className?: string;
}

const Editor: FC<Props> = ({ file, projectId, className = '' }) => {
  const { updateFileContent, getFileContent, updateOpenFile } =
    useWorkspaceActions();

  const { isFormatOnSave } = useSettingAction();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditorInitialized, setIsEditorInitialized] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<[number, number]>([
    0, 0,
  ]);

  // Using this extra state to trigger save file from js event
  const [saveFileCounter, setSaveFileCounter] = useState(1);
  const latestFile = useLatest(file);

  const [initialFile, setInitialFile] = useState<Pick<
    Tree,
    'id' | 'content'
  > | null>(null);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // eslint-disable-next-line prefer-const
  let lspWebSocket: ReconnectingWebSocket | null;

  const saveFile = async () => {
    const fileContent = editorRef.current?.getValue() ?? '';
    if (!fileContent) return;
    try {
      if (isFormatOnSave()) {
        editorRef.current?.trigger(
          'editor',
          'editor.action.formatDocument',
          {},
        );
      }
      await updateFileContent(file.id, fileContent, projectId);
      EventEmitter.emit('FILE_SAVED', { fileId: file.id });
    } catch (error) {
      /* empty */
    }
  };

  useEffect(() => {
    async function loadMonacoEditor() {
      const monaco = await import('monaco-editor');

      window.MonacoEnvironment.getWorkerUrl = (_: string, label: string) => {
        if (label === 'typescript') {
          return '/_next/static/ts.worker.js';
        }
        return '/_next/static/editor.worker.js';
      };
      loader.config({ monaco });
      await highlightCodeSnippets(
        loader,
        fileTypeFromFileName(file.name) as ContractLanguage,
      );
    }

    loadMonacoEditor()
      .then(() => {
        setIsLoaded(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saveFileDebouce = setTimeout(() => {
      (async () => {
        await saveFile();
      })().catch(() => {});
    }, 300);

    return () => {
      clearTimeout(saveFileDebouce);
    };
  }, [saveFileCounter]);

  useEffect(() => {
    if (!isLoaded) return;
    EventEmitter.on('SAVE_FILE', () => {
      setSaveFileCounter((prev) => prev + 1);
    });

    // If file is changed e.g. in case of build process then force update in editor
    EventEmitter.on('FORCE_UPDATE_FILE', (filePath: string) => {
      (async () => {
        if (filePath !== latestFile.current.path) return;
        await fetchFileContent(true);
      })().catch((error) => {
        console.error('Error handling FORCE_UPDATE_FILE event:', error);
      });
    });
    return () => {
      EventEmitter.off('SAVE_FILE');
      EventEmitter.off('FORCE_UPDATE_FILE');
    };
  }, [isLoaded]);

  const fetchFileContent = async (force = false) => {
    if ((!file.id || file.id === initialFile?.id) && !force) return;
    let content = await getFileContent(file.id);
    if (!editorRef.current) return;
    let modelContent = editorRef.current.getValue();

    if (force) {
      editorRef.current.setValue(content);
      modelContent = content;
    }
    if (modelContent) {
      content = modelContent;
    } else {
      editorRef.current.setValue(content);
    }
    setInitialFile({ id: file.id, content });
    editorRef.current.focus();
  };

  const markFileDirty = () => {
    if (!editorRef.current) return;
    const fileContent = editorRef.current.getValue();
    if (
      file.id !== initialFile?.id ||
      !initialFile.content ||
      initialFile.content === fileContent
    ) {
      return;
    }
    if (!fileContent) {
      return;
    }

    updateOpenFile(file.id, { isDirty: true }, projectId);
  };

  useEffect(() => {
    if (!isEditorInitialized) {
      return;
    }
    (async () => {
      await fetchFileContent();
    })().catch(() => {});
  }, [file, isEditorInitialized]);

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monacoRef.current]);

  useEffect(() => {
    window.onbeforeunload = () => {
      // On page reload/exit, close web socket connection
      lspWebSocket?.close();
    };
    return () => {
      lspWebSocket?.close();
    };
  }, []);

  if (!isLoaded) {
    return <div className={`${s.container} ${className}`}>Loading...</div>;
  }

  return (
    <div className={`${s.container} ${className}`}>
      <div className={s.editorInfo}>
        <span>
          Ln {cursorPosition[0]}, Col {cursorPosition[1]}
        </span>
      </div>
      <EditorDefault
        className={s.editor}
        path={file.id ? `${projectId}/${file.id}}` : ''}
        theme="vs-theme-dark"
        // height="90vh"
        defaultLanguage={fileTypeFromFileName(file.name)}
        // defaultLanguage={`func`}
        defaultValue=""
        onChange={markFileDirty}
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 14,
          bracketPairColorization: {
            enabled: true,
          },
        }}
        onMount={(editor, monaco) => {
          (async () => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            setIsEditorInitialized(true);
            await editorOnMount(editor, monaco);
            editor.onDidChangeCursorPosition(() => {
              const position = editor.getPosition();
              if (position) {
                setCursorPosition([position.lineNumber, position.column]);
              }
            });
            const { startLSP } = await import('./lsp');
            await startLSP(editor, monaco, lspWebSocket);
          })().catch((error) => {
            console.error('Error in onMount:', error);
          });
        }}
      />
    </div>
  );
};

export default Editor;
