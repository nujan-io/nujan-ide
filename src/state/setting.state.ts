import { SettingInterface } from '@/interfaces/setting.interface';
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

export const settingState = atom<SettingInterface>({
  key: 'settingState',
  default: {
    contractDebug: true,
    formatOnSave: false,
    autoBuildAndDeploy: true,
    tonAmountForInteraction: '0.05',
  },
  effects_UNSTABLE: [persistAtom],
});
