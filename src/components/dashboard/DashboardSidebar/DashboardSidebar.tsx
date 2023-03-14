import { AppLogo } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { FC } from 'react';
import s from './DashboardSidebar.module.scss';

interface Props {
  className?: string;
}

const DashboardSidebar: FC<Props> = ({ className }) => {
  return (
    <div className={`${s.root} ${className}`}>
      <AppLogo className={s.brandLogo} />

      <div className={s.menuItems}>
        <div>
          <Link className={s.item} href="/">
            <AppIcon name="Project" /> <span className={s.label}>Projects</span>
          </Link>
          <div
            className={s.item}
            onClick={() => {
              signOut();
            }}
          >
            <AppIcon name="Logout" /> <span className={s.label}>Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
