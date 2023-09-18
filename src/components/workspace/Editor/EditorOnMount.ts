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

  // Supress typescript import errors
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    diagnosticCodesToIgnore: [2307],
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });
};
