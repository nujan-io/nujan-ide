import EventEmitterDefault from 'eventemitter3';

const eventEmitter = new EventEmitterDefault();

const EventEmitter = {
  on: (event: any, fn: (...args: any[]) => void) => eventEmitter.on(event, fn),
  once: (event: any, fn: (...args: any[]) => void) =>
    eventEmitter.once(event, fn),
  off: (event: any, fn?: ((...args: any[]) => void) | undefined) =>
    eventEmitter.off(event, fn),
  emit: (event: any, payload: any) => eventEmitter.emit(event, payload),
};

Object.freeze(EventEmitter);

export default EventEmitter;
