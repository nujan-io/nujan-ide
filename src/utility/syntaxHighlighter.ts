import { vscodeOneDark } from '@/assets/vscode-one-dark';
import { ContractLanguage } from '@/interfaces/workspace.interface';
import { wireTmGrammars } from 'monaco-editor-textmate';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Registry } from 'monaco-textmate';
import { loadWASM } from 'onigasm';
import funcTMLanguage from '../assets/ton/func/tmLanguage.json';
import tactTMLanguage from '../assets/ton/tact/tmLanguage.json';

let onigasmLoaded = false;

export async function highlightCodeSnippets(
  loader: any,
  language: ContractLanguage
): Promise<any> {
  let ftmLanguage = {
    func: funcTMLanguage,
    tact: tactTMLanguage,
  };

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
          content: ftmLanguage[language],
        };
      },
    });

    const grammars = new Map();
    grammars.set(language, `source.${language}`);
    monaco.languages.register({ id: language });
    monaco.editor.defineTheme('vs-theme-dark', vscodeOneDark);
    monaco.editor.setTheme('vs-theme-dark');

    const commentRules = {
      func: {
        lineComment: ';;',
        blockComment: ['{-', '-}'],
      },
      tact: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
      },
    };

    const languageConfiguration: monaco.languages.LanguageConfiguration = {
      comments: commentRules[language] as any,
    };
    monaco.languages.setLanguageConfiguration(language, languageConfiguration);

    wireTmGrammars(monaco, registry, grammars);
  });
}
