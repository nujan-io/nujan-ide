import { settingState } from '@/state/setting.state';
import { useRecoilState } from 'recoil';

export function useSettingAction() {
  const [setting, updateSetting] = useRecoilState(settingState);

  return {
    isContractDebugEnabled,
    toggleContractDebug,
  };

  function updateStateByKey(dataByKey: any) {
    updateSetting((oldState) => {
      return {
        ...oldState,
        ...(dataByKey as any),
      };
    });
  }

  function isContractDebugEnabled() {
    return setting.contractDebug;
  }

  function toggleContractDebug(active: boolean = !setting.contractDebug) {
    return updateStateByKey({
      contractDebug: active,
    });
  }
}
