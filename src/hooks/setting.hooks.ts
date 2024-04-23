import { SettingInterface } from '@/interfaces/setting.interface';
import { settingState } from '@/state/setting.state';
import { useRecoilState } from 'recoil';

export function useSettingAction() {
  const [setting, updateSetting] = useRecoilState(settingState);

  return {
    getSettingStateByKey,
    isContractDebugEnabled,
    toggleContractDebug,
    isFormatOnSave,
    toggleFormatOnSave,
    updateTonAmountForInteraction,
    getTonAmountForInteraction,
    isAutoBuildAndDeployEnabled,
    toggleAutoBuildAndDeploy,
  };

  function updateStateByKey(dataByKey: any) {
    updateSetting((oldState) => {
      return {
        ...oldState,
        ...(dataByKey as any),
      };
    });
  }

  function getSettingStateByKey(key: keyof SettingInterface) {
    return setting[key];
  }

  function isContractDebugEnabled() {
    return setting.contractDebug;
  }

  function toggleContractDebug(active: boolean = !setting.contractDebug) {
    return updateStateByKey({
      contractDebug: active,
    });
  }

  function isFormatOnSave() {
    return setting.formatOnSave;
  }

  function toggleFormatOnSave(active: boolean = !setting.formatOnSave) {
    return updateStateByKey({
      formatOnSave: active,
    });
  }

  function getTonAmountForInteraction() {
    return setting.tonAmountForInteraction || '0.05';
  }

  function updateTonAmountForInteraction(value: string, reset = false) {
    return updateStateByKey({
      tonAmountForInteraction: reset ? '0.05' : value,
    });
  }

  function isAutoBuildAndDeployEnabled() {
    return setting.autoBuildAndDeploy === undefined
      ? true
      : setting.autoBuildAndDeploy;
  }

  function toggleAutoBuildAndDeploy(
    active: boolean = !setting.autoBuildAndDeploy
  ) {
    return updateStateByKey({
      autoBuildAndDeploy: active,
    });
  }
}
