import { AppLogo } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useUserOnboardingAction } from '@/hooks/userOnboarding.hooks';
import { FC } from 'react';
import s from './DashboardSidebar.module.scss';

interface Props {
  className?: string;
}

const DashboardSidebar: FC<Props> = ({ className }) => {
  const { startOnboarding } = useUserOnboardingAction();

  return (
    <div className={`${s.root} ${className}`}>
      <AppLogo className={`${s.brandLogo}`} />

      <div className={s.menuItems}>
        <div>
          <span className={`${s.name} ${s.item}`}>Welcome 👋</span>
          <span
            className={`${s.name} ${s.item}`}
            onClick={() => startOnboarding(0)}
          >
            <AppIcon name="Play" />
            Start help wizard
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
