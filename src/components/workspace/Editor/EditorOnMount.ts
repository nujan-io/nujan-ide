import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

type Monaco = typeof monaco;

export const editorOnMount = (
  editor: editor.IStandaloneCodeEditor,
  monaco: Monaco
) => {
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
        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],

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
};
