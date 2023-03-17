import { AuthInterface } from '@/interfaces/auth.interface';
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

export const authState = atom<AuthInterface>({
  key: 'authState',
  default: {
    id: '',
    walletAddress: '',
    token: '',
  },
  effects_UNSTABLE: [persistAtom],
});
