import { LogEntry, LogType } from '@/interfaces/log.interface';
import { logState } from '@/state/log.state';
import EventEmitter from '@/utility/eventEmitter';
import { useRecoilState } from 'recoil';

export function useLogActivity() {
  const [log, setLog] = useRecoilState(logState);

  function getLog(filter: Partial<LogEntry> | null = null): LogEntry[] {
    if (filter === null || Object.values(filter).every((value) => !value)) {
      return log;
    }

    return log.filter((entry) => {
      return Object.keys(filter).every((key) => {
        const filterValue = filter[key as keyof LogEntry];
        const entryValue = entry[key as keyof LogEntry];
        return (
          filterValue === undefined ||
          (filterValue === '' && entryValue === '') ||
          (Array.isArray(filterValue) && filterValue.length === 0) ||
          (filterValue !== '' &&
            entryValue.toLowerCase().includes(filterValue.toLowerCase()))
        );
      });
    });
  }

  function createLog(
    text: string,
    type: LogType = 'info',
    allowDuplicate = true,
    disableTimestamp = false,
  ): void {
    if (
      !allowDuplicate &&
      log.some((entry) => entry.text === text && entry.type === type)
    ) {
      return;
    }
    const logEntry: LogEntry = {
      text,
      type,
      timestamp: !disableTimestamp ? new Date().toISOString() : '',
    };
    EventEmitter.emit('LOG', logEntry);
    setLog((oldLog) => {
      return [...oldLog, logEntry];
    });
  }

  function clearLog(): void {
    EventEmitter.emit('LOG_CLEAR');
    setLog([]);
  }

  return { getLog, createLog, clearLog };
}
