import { AppLogo } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useUserOnboardingAction } from '@/hooks/userOnboarding.hooks';
import Link from 'next/link';
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
          <Link
            className={`${s.name} ${s.item}`}
            href="https://docs.nujan.io/"
            target="_blank"
          >
            <AppIcon name="Document" />
            Documentation
          </Link>
          <Link
            className={`${s.name} ${s.item}`}
            href="https://docs.google.com/forms/d/e/1FAIpQLScrneLuw7qST4FhgEEdUK3c2wXBTn0WmiTBZyMOMi_xnXvRDA/viewform"
            target="_blank"
          >
            <AppIcon name="Feedback" className={s.icon} />
            Share Feedback
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
