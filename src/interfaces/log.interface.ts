export type LogType = 'success' | 'info' | 'warning' | 'error';

export interface LogEntry {
  text: string;
  type: LogType;
  timestamp: string;
}
