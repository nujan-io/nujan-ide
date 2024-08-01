import { LogLevel, LogMethods, Logger } from '@tact-lang/compiler';
import EventEmitter from './eventEmitter';

const logLevelToMethodName: { [key in LogLevel]: keyof LogMethods | null } = {
  [LogLevel.NONE]: null,
  [LogLevel.ERROR]: 'error',
  [LogLevel.WARN]: 'warn',
  [LogLevel.INFO]: 'info',
  [LogLevel.DEBUG]: 'debug',
};

function getLoggingMethod(level: LogLevel): keyof LogMethods | null {
  return logLevelToMethodName[level];
}

export default class TactLogger extends Logger {
  private levelLevel: LogLevel;
  constructor(level: LogLevel = LogLevel.INFO) {
    super(level);
    this.levelLevel = level;
  }
  protected log(level: LogLevel, message: string | Error): void {
    if (this.levelLevel === LogLevel.NONE) {
      return;
    }

    message = message instanceof Error ? message.message : message;

    if (level > this.levelLevel) return;
    const loggingMethod = getLoggingMethod(level);
    if (!loggingMethod) return;

    EventEmitter.emit('LOG', {
      text: message,
      type: loggingMethod as Exclude<keyof LogMethods, 'debug' | 'warn'>,
      timestamp: new Date().toISOString(),
    });
  }
}
