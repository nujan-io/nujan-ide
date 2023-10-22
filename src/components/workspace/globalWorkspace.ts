import {
  Blockchain,
  SandboxContract,
  TreasuryContract,
} from '@ton-community/sandbox';

interface GlobalWorkspace {
  sandboxBlockchain: Blockchain | null;
  sandboxWallet: SandboxContract<TreasuryContract> | null;
}

export const globalWorkspace: GlobalWorkspace = {
  sandboxBlockchain: null,
  sandboxWallet: null,
};
