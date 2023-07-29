import { LogEntry } from '@/interfaces/log.interface';
import { atom } from 'recoil';

export const logState = atom<LogEntry[]>({
  key: 'logState',
  default: [],
});
