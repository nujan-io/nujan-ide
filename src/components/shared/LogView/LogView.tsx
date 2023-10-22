import { LogType } from '@/interfaces/log.interface';
import EventEmitter from '@/utility/eventEmitter';
import { FC, createRef, useRef } from 'react';
import { useEffectOnce } from 'react-use';

import 'xterm/css/xterm.css';

import s from './LogView.module.scss';

interface Props {
  type?: LogType | undefined;
  text?: string | undefined;
}

const LogView: FC<Props> = ({ type, text }) => {
  const logViewerRef = createRef<HTMLDivElement>();
  const isTerminalLoaded = useRef(false);

  const formatTimestamp = (timestamp: string | number | Date) => {
    if (!timestamp) return '\x1b[0m \x1b[0m';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const colorMap = {
    grey: '\x1b[38;5;243m',
    success: '\x1b[38;5;40m',
    error: '\x1b[38;5;196m',
    warning: '\x1b[38;5;226m',
    info: '\x1b[38;5;33m',
    reset: '\x1b[0m',
  };

  useEffectOnce(() => {
    let terminal: any | null = null;

    const initTerminal = async () => {
      if (!logViewerRef.current) return;
      const appTerminal = document.getElementById('app-terminal');

      if (appTerminal?.children.length === 1) {
        return;
      }

      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      terminal = new Terminal({
        fontSize: 17,
        cursorBlink: false,
        cursorStyle: 'bar',
        disableStdin: true,
      });
      const fitAddon = new FitAddon();

      terminal.loadAddon(fitAddon);

      terminal.open(appTerminal);
      fitAddon.fit();

      EventEmitter.on('LOG_CLEAR', (data) => {
        terminal.clear();
      });

      EventEmitter.on('LOG', (data) => {
        let timestamp = `${colorMap.grey} ${formatTimestamp(data.timestamp)} ${
          colorMap.reset
        }`;
        if (!data.timestamp) {
          timestamp = '';
        }
        terminal!!.writeln(
          `${(colorMap as any)[data.type]}${data.text}${
            colorMap.reset
          } ${timestamp}`
        );
      });
    };
    if (typeof window === 'undefined') {
      return;
    }
    if (!isTerminalLoaded.current && logViewerRef.current) {
      (isTerminalLoaded as any).current = true;
      initTerminal();
    }

    return () => {
      isTerminalLoaded.current = false;
      EventEmitter.off('LOG');
      EventEmitter.off('LOG_CLEAR');
      terminal?.dispose();
    };
  });

  return <div className={s.root} ref={logViewerRef} id="app-terminal"></div>;
};

export default LogView;
