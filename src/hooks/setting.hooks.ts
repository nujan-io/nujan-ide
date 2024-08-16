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
    updateEditorMode,
  };

  function updateStateByKey(dataByKey: Partial<SettingInterface>) {
    updateSetting((oldState) => {
      return {
        ...oldState,
        ...dataByKey,
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
    updateStateByKey({
      contractDebug: active,
    });
  }

  function isFormatOnSave() {
    return setting.formatOnSave;
  }

  function toggleFormatOnSave(active: boolean = !setting.formatOnSave) {
    updateStateByKey({
      formatOnSave: active,
    });
  }

  function getTonAmountForInteraction() {
    return setting.tonAmountForInteraction ?? '0.05';
  }

  function updateTonAmountForInteraction(value: string, reset = false) {
    updateStateByKey({
      tonAmountForInteraction: reset ? '0.05' : value,
    });
  }

  function isAutoBuildAndDeployEnabled() {
    return setting.autoBuildAndDeploy ?? true;
  }

  function toggleAutoBuildAndDeploy(
    active: boolean = !setting.autoBuildAndDeploy,
  ) {
    updateStateByKey({
      autoBuildAndDeploy: active,
    });
  }

  function updateEditorMode(mode: 'default' | 'vim') {
    updateStateByKey({
      editorMode: mode,
    });
  }
}
