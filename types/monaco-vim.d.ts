declare module 'monaco-vim' {
  export function initVimMode(
    editor: monaco.editor.IStandaloneCodeEditor,
    statusBar: HTMLElement,
    options?: { keyHandler?: Record<string, any>; override?: boolean },
  ): { dispose: () => void };
}
