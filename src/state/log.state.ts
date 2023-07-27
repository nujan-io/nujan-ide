import { AppConfig } from '@/config/AppConfig';
import { LogEntry } from '@/interfaces/log.interface';
import { atom } from 'recoil';

const initState: LogEntry[] = [
  {
    text: `Welcome to the ${AppConfig.name}`,
    type: 'info',
    timestamp: new Date().toISOString(),
  },
];

export const logState = atom<LogEntry[]>({
  key: 'logState',
  default: initState,
});
