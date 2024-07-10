import { useUserOnboardingAction } from '@/hooks/userOnboarding.hooks';
import { FC, useEffect, useState } from 'react';
import s from './Layout.module.scss';

interface Props {
  className?: string;
  children: React.ReactNode;
}
export const Layout: FC<Props> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { onboarding } = useUserOnboardingAction();
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <></>;
  }
  return (
    <>
      {/* <UserOnboardingWizard /> */}
      <main
        className={`${s.root} ${
          onboarding().tourActive ? 'onboarding-active' : ''
        }`}
      >
        {children}
      </main>
    </>
  );
};

export default Layout;
