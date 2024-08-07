import { LogEntry } from '@/interfaces/log.interface';
import EventEmitterDefault from 'eventemitter3';

const eventEmitter = new EventEmitterDefault();

export interface EventEmitterPayloads {
  ONBOARDING_NEW_PROJECT: { projectName: string };
  LOG_CLEAR: undefined;
  LOG: LogEntry;
  ON_SPLIT_DRAG_END: { position?: number };
  SAVE_FILE: undefined | { fileId: string; content: string };
  FORCE_UPDATE_FILE: string;
  FILE_SAVED: { fileId: string };
  TEST_CASE_LOG: string;
}

const EventEmitter = {
  on: <K extends keyof EventEmitterPayloads>(
    event: K,
    fn: (payload: EventEmitterPayloads[K]) => void,
  ) => eventEmitter.on(event, fn),
  once: <K extends keyof EventEmitterPayloads>(
    event: K,
    fn: (payload: EventEmitterPayloads[K]) => void,
  ) => eventEmitter.once(event, fn),
  off: <K extends keyof EventEmitterPayloads>(
    event: K,
    fn?: (payload: EventEmitterPayloads[K]) => void,
  ) => eventEmitter.off(event, fn),
  emit: <K extends keyof EventEmitterPayloads>(
    event: K,
    payload: EventEmitterPayloads[K] | null = null,
  ) => eventEmitter.emit(event, payload),
};
Object.freeze(EventEmitter);

export default EventEmitter;
