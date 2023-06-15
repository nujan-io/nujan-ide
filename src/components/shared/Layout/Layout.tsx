import { FC, useEffect, useState } from 'react';
import UserOnboardingWizard from '../UserOnboardingWizard';
import s from './Layout.module.scss';

interface Props {
  className?: string;
  children: React.ReactNode;
}
export const Layout: FC<Props> = ({ className, children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return <></>;
  }
  return (
    <>
      <UserOnboardingWizard />
      <main className={s.root}>{children}</main>
    </>
  );
};

export default Layout;
