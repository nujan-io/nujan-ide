import { vscodeOneDark } from '@/assets/vscode-one-dark';
import { wireTmGrammars } from 'monaco-editor-textmate';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Registry } from 'monaco-textmate';
import { loadWASM } from 'onigasm';
import ftmLanguage from '../assets/ton/func/ftmLanguage.json';

let onigasmLoaded = false;

export async function highlightCodeSnippets(loader: any): Promise<any> {
  if (!onigasmLoaded) {
    try {
      await loadWASM(
        'https://cdn.jsdelivr.net/npm/onigasm@2.2.5/lib/onigasm.wasm'
      );
      onigasmLoaded = true;
    } catch {}
  }

  await (loader as any).init().then((monaco: any) => {
    const registry = new Registry({
      getGrammarDefinition: async () => {
        return {
          format: 'json',
          content: ftmLanguage,
        };
      },
    });

    const grammars = new Map();
    grammars.set('func', 'source.func');
    monaco.languages.register({ id: 'func' });
    monaco.editor.defineTheme('vs-theme-dark', vscodeOneDark);
    monaco.editor.setTheme('vs-theme-dark');

    const funcLanguageConfiguration: monaco.languages.LanguageConfiguration = {
      comments: {
        lineComment: ';;',
        blockComment: ['{-', '-}'],
      },
    };
    monaco.languages.setLanguageConfiguration(
      'func',
      funcLanguageConfiguration
    );

    wireTmGrammars(monaco, registry, grammars);
  });
}
