import { LogView } from '@/components/shared';
import { FC } from 'react';
import s from './BottomPanel.module.scss';

const BottomPanel: FC = () => {
  return (
    <div className={s.root}>
      <div className={s.tab}>Terminal</div>
      <LogView />
    </div>
  );
};

export default BottomPanel;
