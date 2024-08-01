import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';

interface GlobalWorkspace {
  sandboxBlockchain: Blockchain | null;
  sandboxWallet: SandboxContract<TreasuryContract> | null;
  getDebugLogs: () => string[];
}

export const globalWorkspace: GlobalWorkspace = {
  sandboxBlockchain: null,
  sandboxWallet: null,
  getDebugLogs: () => {
    if (!globalWorkspace.sandboxBlockchain) {
      return [];
    }
    const blockchain = globalWorkspace.sandboxBlockchain as Blockchain;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (blockchain.executor as any).debugLogs ?? [];
  },
};
