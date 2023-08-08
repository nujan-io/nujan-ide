import { useAuthAction } from '@/hooks/auth.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Tree } from '@/interfaces/workspace.interface';
import EventEmitter from '@/utility/eventEmitter';
import { fileTypeFromFileName } from '@/utility/utils';
import EditorDefault, { loader } from '@monaco-editor/react';
import { FC, useEffect, useRef, useState } from 'react';
import s from './Editor.module.scss';
import { editorOnMount } from './EditorOnMount';

interface Props {
  file: Tree;
  projectId: string;
  className?: string;
}

const Editor: FC<Props> = ({ file, projectId, className = '' }) => {
  const {
    updateFileContent,
    isProjectEditable,
    getFileContent,
    updateOpenFile,
    openedFiles,
  } = useWorkspaceActions();

  const { user } = useAuthAction();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditorInitialized, setIsEditorInitialized] = useState(false);

  // Using this extra state to trigger save file from js event
  const [saveFileCounter, setSaveFileCounter] = useState(1);
  const [initialFile, setInitialFile] = useState<Pick<
    Tree,
    'id' | 'content'
  > | null>(null);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const saveFile = () => {
    if (!file.id) return;
    try {
      updateFileContent(file.id, editorRef.current.getValue(), projectId);
    } catch (error) {}
  };

  useEffect(() => {
    async function loadMonacoEditor() {
      let monaco = await import('monaco-editor');

      (window as any).MonacoEnvironment.getWorkerUrl = (
        _: string,
        label: string
      ) => {
        if (label === 'typescript') {
          return '/_next/static/ts.worker.js';
        }

        return '/_next/static/editor.worker.js';
      };
      loader.config({ monaco });
      await loader.init();
    }
    loadMonacoEditor().then(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    const saveFileDebouce = setTimeout(() => {
      saveFile();
    }, 300);

    return () => clearTimeout(saveFileDebouce);
  }, [saveFileCounter]);

  useEffect(() => {
    if (!isLoaded) return;
    EventEmitter.on('SAVE_FILE', () => {
      setSaveFileCounter((prev) => prev + 1);
    });
    return () => {
      EventEmitter.off('SAVE_FILE');
    };
  }, [isLoaded]);

  const fetchFileContent = async () => {
    if (!file.id || file.id === initialFile?.id) return;
    let content = await getFileContent(file.id);
    let modelContent = editorRef.current.getValue();
    if (modelContent) {
      content = modelContent;
    } else {
      editorRef.current.setValue(content);
    }
    setInitialFile({ id: file.id, content });
  };

  const markFileDirty = () => {
    if (
      file.id !== initialFile?.id ||
      !initialFile?.content ||
      initialFile.content === editorRef.current.getValue()
    ) {
      return;
    }
    updateOpenFile(file.id, { isDirty: true }, projectId);
  };

  useEffect(() => {
    if (!isEditorInitialized) {
      return;
    }
    fetchFileContent();
    // if (fileTypeFromFileName(file.name) === 'func') {
    //   monacoRef.current.setTheme('func-theme');
    // } else {
    //   monacoRef.current.setTheme('vs-dark');
    // }
  }, [file, isEditorInitialized]);

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }

    // Define and set custom theme

    // monacoRef.current.defineTheme('app-theme', {
    //   base: 'vs-dark',
    //   inherit: true,
    //   rules: [],
    //   colors: {
    //     'editor.background': '#000000',
    //   },
    // });
    // monacoRef.current.setTheme('app-theme');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monacoRef.current]);

  if (!isLoaded) {
    return <div className={`${s.container} ${className}`}>Loading...</div>;
  }

  return (
    <div className={`${s.container} ${className}`}>
      <EditorDefault
        className={s.editor}
        path={file.id ? `${projectId}/${file.id}}` : ''}
        theme="vs-dark"
        // height="90vh"
        defaultLanguage={`${fileTypeFromFileName(file.name)}`}
        // defaultLanguage={`func`}
        defaultValue=""
        onChange={markFileDirty}
        options={{
          fontSize: 14,
          bracketPairColorization: {
            enabled: true,
          },
          readOnly: !isProjectEditable(projectId as string, user),
        }}
        onMount={async (editor, monaco) => {
          editorRef.current = editor;
          monacoRef.current = monaco.editor;

          setIsEditorInitialized(true);
          editorOnMount(editor, monaco);
        }}
      />
    </div>
  );
};

export default Editor;
