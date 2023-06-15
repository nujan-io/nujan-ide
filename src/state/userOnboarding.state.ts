import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

interface UserOnboarding {
  stepIndex: number;
  run: boolean;
  tourActive: boolean;
}

export const userOnboardingState = atom<UserOnboarding>({
  key: 'userOnboardingState',
  default: {
    stepIndex: 0,
    run: true,
    tourActive: true,
  },
  effects_UNSTABLE: [persistAtom],
});
