import { userOnboardingState } from '@/state/userOnboarding.state';
import { useRecoilState } from 'recoil';

export function useUserOnboardingAction() {
  const [userOnboarding, setUserOnboarding] =
    useRecoilState(userOnboardingState);

  return {
    onboarding,
    stepIndex,
    updateStepIndex,
    startOnboarding,
    stopOnboarding,
  };

  function onboarding() {
    return userOnboarding;
  }

  function stepIndex() {
    return userOnboarding.stepIndex;
  }

  function updateStepIndex(stepIndex: number) {
    setUserOnboarding({
      ...userOnboarding,
      stepIndex,
    });
  }

  function startOnboarding(stepIndex: number = -1) {
    setUserOnboarding({
      ...userOnboarding,
      stepIndex: stepIndex >= 0 ? stepIndex : onboarding().stepIndex,
      run: true,
      tourActive: true,
    });
  }

  function stopOnboarding() {
    setUserOnboarding({
      ...userOnboarding,
      tourActive: false,
      run: false,
    });
  }
}
