import { AppConfig } from '@/config/AppConfig';
import { listen } from '@codingame/monaco-jsonrpc';
import {
  CloseAction,
  ErrorAction,
  MessageConnection,
  MonacoLanguageClient,
  createConnection,
} from '@codingame/monaco-languageclient';
import { message } from 'antd';
import { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import ReconnectingWebSocket from 'reconnecting-websocket';

type Monaco = typeof monaco;

export const createLanguageClient = (
  connection: MessageConnection,
): MonacoLanguageClient => {
  return new MonacoLanguageClient({
    name: 'FunC Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ['func'],
      // disable the default error handler
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => CloseAction.DoNotRestart,
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(
          createConnection(connection, errorHandler, closeHandler),
        );
      },
    },
  });
};

export const startLSP = async (
  editor: editor.IStandaloneCodeEditor,
  monaco: Monaco,
  lspWebSocket: ReconnectingWebSocket | null,
) => {
  if (!AppConfig.lspServer) {
    return;
  }
  const { MonacoServices } = await import('@codingame/monaco-languageclient');

  lspWebSocket = createWebSocket(AppConfig.lspServer);
  listen({
    webSocket: lspWebSocket as WebSocket,
    onConnection: (connection) => {
      const languageClient = createLanguageClient(connection);
      const disposable = languageClient.start();
      connection.onClose(() => disposable.dispose());
    },
  });
  MonacoServices.install(monaco);
  monaco.editor.registerCommand(
    'func.copyToClipboard',
    (_, ...args: string[]) => {
      (async () => {
        try {
          await navigator.clipboard.writeText(args.join(', '));
          await message.info(`Copied ${args.join(', ')} to clipboard`);
        } catch (error) {
          await message.error(
            `Failed to copy to clipboard: ${(error as Error).message}`,
          );
        }
      })().catch(() => {});
    },
  );
};

export function createWebSocket(url: string): ReconnectingWebSocket {
  const socketOptions = {
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: Infinity,
    debug: false,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}
