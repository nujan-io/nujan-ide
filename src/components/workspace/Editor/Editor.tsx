import { useAuthAction } from '@/hooks/auth.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Tree } from '@/interfaces/workspace.interface';
import EventEmitter from '@/utility/eventEmitter';
import { fileTypeFromFileName } from '@/utility/utils';
import EditorDefault from '@monaco-editor/react';
import { FC, useEffect, useRef, useState } from 'react';
import s from './Editor.module.scss';

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
      updateFileContent(file.id, editorRef.current.getValue());
    } catch (error) {}
  };

  useEffect(() => {
    setIsLoaded(true);
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
    const content = await getFileContent(file.id);
    editorRef.current.setValue(content);
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
    updateOpenFile(file.id, { isDirty: true });
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

  return (
    <div className={`${s.container} ${className}`}>
      <EditorDefault
        className={s.editor}
        path={file.id ? file.id : ''}
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
          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            experimentalDecorators: false,
          });

          const keywords = [
            'impure',
            'inline',
            'global',
            'return',
            'cell',
            'slice',
            'if',
            'while',
          ];

          let globalMethods = ['get_data', 'set_data', 'begin_cell'];

          const types = ['int', 'var'];

          const messageMethods = ['recv_internal', 'recv_external'];

          monaco.languages.register({ id: 'func' });
          monaco.languages.setMonarchTokensProvider('func', {
            keywords: keywords,
            globalMethods,
            messageMethods,
            types,
            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            escapes:
              /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
            operators: [
              '=',
              '>',
              '<',
              '!',
              '~',
              '?',
              ':',
              '==',
              '<=',
              '>=',
              '!=',
              '&&',
              '||',
              '++',
              '--',
              '+',
              '-',
              '*',
              '/',
              '&',
              '|',
              '^',
              '%',
              '<<',
              '>>',
              '>>>',
              '+=',
              '-=',
              '*=',
              '/=',
              '&=',
              '|=',
              '^=',
              '%=',
              '<<=',
              '>>=',
              '>>>=',
            ],
            tokenizer: {
              root: [
                // identifiers and keywords
                [
                  /[a-z_$][\w$]*/,
                  {
                    cases: {
                      '@globalMethods': 'string',
                      '@types': 'type.keyword',
                      '@messageMethods': 'annotation',
                      '@keywords': 'keyword',
                      '@default': 'identifier',
                    },
                  },
                ],
                [/[A-Z][\w\$]*/, 'type.identifier'],

                // whitespace
                { include: '@whitespace' },

                // delimiters and operators
                [/[{}()\[\]]/, '@brackets'],

                [/[<>](?!@symbols)/, '@brackets'],
                [
                  /@symbols/,
                  { cases: { '@operators': 'operator', '@default': '' } },
                ],

                // numbers
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/\d+/, 'number'],
                [/(;;.*\n)+/, 'comment'],

                // delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],
                [/(^#include.*\;)/, 'include'],

                // strings
                // [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                // [
                //   /"/,
                //   { token: 'string.quote', bracket: '@open', next: '@string' },
                // ],

                // characters
                // [/'[^\\']'/, 'string'],
                // [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                // [/'/, 'string.invalid'],
              ],

              string: [
                // [/[^\\"]+/, 'string'],
                // [/@escapes/, 'string.escape'],
                // [/\\./, 'string.escape.invalid'],
              ],

              whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\;\;.*$/, 'comment'],
              ],
            },
          });

          monaco.editor.defineTheme('func-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              {
                token: 'keyword',
                foreground: '#f97583',
                fontStyle: 'bold',
              },
              {
                token: '@brackets',
                foreground: '#ff0000',
              },
              {
                token: 'string',
                foreground: '#009966',
              },
              {
                token: 'variable',
                foreground: '#006699',
              },
              {
                token: 'include',
                foreground: '#3bd0e9',
              },
            ],
            colors: {},
          });

          monaco.languages.registerCompletionItemProvider('func', {
            provideCompletionItems: (model, position) => {
              var word = model.getWordUntilPosition(position);
              var range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
              };
              const suggestions = [
                ...keywords.map((k) => {
                  return {
                    label: k,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: k,
                    range,
                  };
                }),
                ...globalMethods.map((k) => {
                  return {
                    label: k,
                    kind: monaco.languages.CompletionItemKind.Function,
                    insertText: k,
                    range,
                  };
                }),
              ];

              return { suggestions: suggestions };
            },
            // triggerCharacters: ['/'],
          });
        }}
      />
    </div>
  );
};

export default Editor;
