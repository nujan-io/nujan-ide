import { userOnboardingSteps } from '@/constant/UserOnboardingSteps';
import { useUserOnboardingAction } from '@/hooks/userOnboarding.hooks';
import EventEmitter, { EventEmitterPayloads } from '@/utility/eventEmitter';
import { delay } from '@/utility/utils';
import { useRouter } from 'next/router';
import { FC, useEffect } from 'react';
import ReactJoyride, { ACTIONS, CallBackProps, EVENTS } from 'react-joyride';

const UserOnboardingWizard: FC = () => {
  const {
    onboarding,
    stepIndex,
    updateStepIndex,
    startOnboarding,
    stopOnboarding,
  } = useUserOnboardingAction();

  const router = useRouter();

  const callBack = async (data: CallBackProps) => {
    if (
      data.action === ACTIONS.SKIP ||
      (data.type === EVENTS.TOUR_END && onboarding().tourActive)
    ) {
      stopOnboarding();
      return;
    }
    if (
      data.action === ACTIONS.NEXT &&
      userOnboardingSteps.steps[data.index].afterEvent
    ) {
      const afterEvent =
        userOnboardingSteps.steps[data.index].afterEvent ?? null;

      if (afterEvent && afterEvent in EventEmitter) {
        EventEmitter.emit(afterEvent as keyof EventEmitterPayloads);
      }
      // Adding delay so that onboarding wizard should render after popup is opened
      await delay(500);
    }
    if (
      data.action === ACTIONS.NEXT &&
      userOnboardingSteps.steps[data.index].name === 'codeEditor'
    ) {
      await router.replace(
        `/project/${router.query.id as string}?tab=build`,
        undefined,
        {
          shallow: true,
        },
      );
    }
    if (data.action === ACTIONS.NEXT && data.type === EVENTS.STEP_AFTER) {
      updateStepIndex(data.index + 1);
    }
  };

  useEffect(() => {
    if (
      router.query.tab !== 'build' &&
      router.pathname === '/project/[id]' &&
      onboarding().tourActive
    ) {
      startOnboarding(2);
    }
  }, [router, onboarding, startOnboarding]);

  useEffect(() => {
    // updateStepIndex(0);
  }, []);

  return (
    <ReactJoyride
      stepIndex={stepIndex()}
      run={onboarding().run}
      continuous
      showProgress
      hideCloseButton
      showSkipButton
      hideBackButton
      steps={userOnboardingSteps.steps}
      styles={{
        options: userOnboardingSteps.styleConfiguration.options,
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipContent: {
          padding: '20px 0',
        },
      }}
      locale={{ last: 'Done', skip: 'Quit the wizard' }}
      callback={(data) => {
        callBack(data).catch(() => {});
      }}
    />
  );
};

export default UserOnboardingWizard;
