export type LogType = 'success' | 'info' | 'warning' | 'error';
export enum LogOptions {
  Success = 'success',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export interface LogEntry {
  text: string;
  type: LogType;
  timestamp: string;
}
