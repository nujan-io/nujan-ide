import type { TonCore } from '@ton/core';
import { Contract } from '@ton/core';
import { WebContainer } from '@webcontainer/api';

export {};

declare global {
  interface Window {
    contractInit?: Contract;
    MonacoEnvironment: {
      getWorkerUrl: (moduleId: string, label: string) => string;
    };
    webcontainerInstance: WebContainer | null | undefined;
    TonCore: TonCore;
  }
}
