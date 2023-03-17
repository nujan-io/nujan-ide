import { AppLogo } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useAuthAction } from '@/hooks/auth.hooks';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { FC } from 'react';
import s from './DashboardSidebar.module.scss';

interface Props {
  className?: string;
}

const DashboardSidebar: FC<Props> = ({ className }) => {
  const { logout } = useAuthAction();
  const [tonConnector] = useTonConnectUI();

  return (
    <div className={`${s.root} ${className}`}>
      <AppLogo className={s.brandLogo} />

      <div className={s.menuItems}>
        <div>
          <span className={s.name}>
            Welcome 👋
            {/* <br /> {session?.user?.name} */}
          </span>
        </div>
        <div className={`${s.item} ${s.logoutContainer}`}>
          <div>
            <div
              className={s.logout}
              onClick={() => {
                logout();
                if (tonConnector.connected) {
                  tonConnector.disconnect();
                }
              }}
            >
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
