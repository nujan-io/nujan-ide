import { DashboardSidebar } from '@/components/dashboard';
import { AppLogo } from '@/components/ui';
import { FC } from 'react';
import s from './Dashboard.module.scss';

const Dashboard: FC = () => {
  return (
    <div className={s.root}>
      <div className={s.onlyDesktop}>
        <AppLogo />
        <span className={s.label}>
          Only desktop screen is supported at the moment.
        </span>
      </div>
      <DashboardSidebar className={s.column} />
    </div>
  );
};

export default Dashboard;
