import { LogEntry, LogType } from '@/interfaces/log.interface';
import { logState } from '@/state/log.state';
import { useRecoilState } from 'recoil';

export function useLogActivity() {
  const [log, setLog] = useRecoilState(logState);

  function getLog(filter: Partial<LogEntry> | null = null): LogEntry[] {
    if (filter === null) {
      return log;
    }
    return log.filter((entry: LogEntry) => {
      return Object.keys(filter).every(
        (key) => entry[key as keyof LogEntry] === filter[key as keyof LogEntry]
      );
    });
  }

  function createLog(text: string, type: LogType = 'info'): void {
    const logEntry: LogEntry = {
      text,
      type,
      timestamp: new Date().toISOString(),
    };
    setLog((oldLog) => [...oldLog, logEntry]);
  }

  return { getLog, createLog };
}
