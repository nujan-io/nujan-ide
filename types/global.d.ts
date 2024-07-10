import type { TonCore } from '@ton/core';
import { Contract } from '@ton/core';

export {};

declare global {
  interface Window {
    contractInit?: Contract;
    MonacoEnvironment: {
      getWorkerUrl: (moduleId: string, label: string) => string;
    };
    webcontainerInstance: WebContainer;
    TonCore: TonCore;
  }
}
