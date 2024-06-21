import { vscodeOneDark } from '@/assets/vscode-one-dark';
import { ContractLanguage } from '@/interfaces/workspace.interface';
import { wireTmGrammars } from 'monaco-editor-textmate';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { Registry } from 'monaco-textmate';
import { loadWASM } from 'onigasm';
import funcTMLanguage from '../assets/ton/func/tmLanguage.json';
import tactTMLanguage from '../assets/ton/tact/tmLanguage.json';
import typeScriptTMLanguage from '../assets/typescript/tmLanguage.json';

let onigasmLoaded = false;

export async function highlightCodeSnippets(
  loader: any,
  _language: ContractLanguage,
): Promise<any> {
  let ftmLanguage = {
    func: funcTMLanguage,
    tact: tactTMLanguage,
    typescript: typeScriptTMLanguage,
  };

  if (!onigasmLoaded) {
    try {
      await loadWASM(
        'https://cdn.jsdelivr.net/npm/onigasm@2.2.5/lib/onigasm.wasm',
      );
      onigasmLoaded = true;
    } catch {}
  }

  await (loader as any).init().then((monaco: any) => {
    for (const [key, value] of Object.entries(ftmLanguage)) {
      const language = key as ContractLanguage;
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

      const autoPairingRules = {
        func: {},
        tact: {
          surroundingPairs: [
            { open: '{', close: '}' },
            { open: '(', close: ')' },
            { open: '<', close: '>' },
            { open: '"', close: '"' },
          ],
          autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '(', close: ')' },
            { open: '<', close: '>' },
            { open: '"', close: '"', notIn: ['string', 'comment'] },
          ],
        },
      };

      let languageConfiguration: monaco.languages.LanguageConfiguration = {
        comments: commentRules[language] as any,
        indentationRules: {
          decreaseIndentPattern: /^\s*\}.*$/,
          increaseIndentPattern: /^.*\{[^}]*$/,
        },
      };

      if (language === 'tact') {
        languageConfiguration = {
          ...languageConfiguration,
          ...autoPairingRules.tact,
        };
      }

      monaco.languages.setLanguageConfiguration(
        language,
        languageConfiguration,
      );
      wireTmGrammars(monaco, registry, grammars);
    }

    monaco.editor.defineTheme('vs-theme-dark', vscodeOneDark);
    monaco.editor.setTheme('vs-theme-dark');
  });
}
