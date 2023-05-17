import { AppLogo } from '@/components/ui';
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
      </div>
    </div>
  );
};

export default DashboardSidebar;
