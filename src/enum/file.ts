export enum FileType {
  JavaScript = 'javascript',
  TypeScript = 'typescript',
  TypeScriptReact = 'typescriptreact',
  JavaScriptReact = 'javascriptreact',
  HTML = 'html',
  CSS = 'css',
  C = 'c',
  FC = 'func',
  TACT = 'tact',
  Cpp = 'cpp',
  Rust = 'rust',
  Wat = 'wat',
  Wasm = 'wasm',
  Directory = 'directory',
  Log = 'log',
  x86 = 'x86',
  Markdown = 'markdown',
  Cretonne = 'cretonne',
  JSON = 'json',
  DOT = 'dot',
  TOML = 'toml',
  Unknown = 'unknown',
}

/* eslint-disable @typescript-eslint/prefer-literal-enum-member */
export enum FileExtensionToFileType {
  js = FileType.JavaScript,
  ts = FileType.TypeScript,
  tsx = FileType.TypeScriptReact,
  jsx = FileType.JavaScriptReact,
  rs = FileType.Rust,
  fc = FileType.FC,
  tact = FileType.TACT,
  json = FileType.JSON,
}
/* eslint-enable @typescript-eslint/prefer-literal-enum-member */
