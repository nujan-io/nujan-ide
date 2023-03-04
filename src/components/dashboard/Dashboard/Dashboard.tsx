import { DashboardSidebar } from '@/components/dashboard';
import { ProjectListing } from '@/components/project';
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
      <div className={`${s.column} ${s.contentContainer}`}>
        <h2 className={s.heading}>Recent Projects:</h2>
        <ProjectListing />
      </div>
    </div>
  );
};

export default Dashboard;
