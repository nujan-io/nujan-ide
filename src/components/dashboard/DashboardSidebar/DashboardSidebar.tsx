import { AppLogo } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { signOut, useSession } from 'next-auth/react';
import { FC } from 'react';
import s from './DashboardSidebar.module.scss';

interface Props {
  className?: string;
}

const DashboardSidebar: FC<Props> = ({ className }) => {
  const { clearWorkSpace } = useWorkspaceActions();
  const { data: session } = useSession();

  const logout = () => {
    clearWorkSpace();
    signOut();
  };

  return (
    <div className={`${s.root} ${className}`}>
      <AppLogo className={s.brandLogo} />

      <div className={s.menuItems}>
        <div>
          <span className={s.name}>
            Welcome,
            <br /> {session?.user?.name}
          </span>
        </div>
        <div className={`${s.item} ${s.logoutContainer}`}>
          <div>
            <div className={s.logout} onClick={logout}>
              <AppIcon name="Logout" />
              <span className={s.label}>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
