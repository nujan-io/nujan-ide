import AppIcon from '@/components/ui/icon';
import cn from 'clsx';
import React, { FC } from 'react';

import s from './FileTree.module.scss';

type actionsTypes = 'Edit' | 'NewFile' | 'NewFolder' | 'Close';

interface Props {
  className?: string;
  allowedActions: actionsTypes[];
  onRename?: () => void;
  onNewFile?: () => void;
  onNewDirectory?: () => void;
  onDelete?: () => void;
}

const ItemAction: FC<Props> = ({
  className,
  allowedActions,
  onRename,
  onNewFile,
  onNewDirectory,
  onDelete,
}) => {
  const rootClassName = cn(s.actionRoot, className, 'actions');
  const handleOnClick = (e: React.MouseEvent, action: any) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const actionList = [
    {
      title: 'Edit',
      action: onRename,
    },
    {
      title: 'NewFile',
      action: onNewFile,
    },
    {
      title: 'NewFolder',
      action: onNewDirectory,
    },
    {
      title: 'Close',
      action: onDelete,
    },
  ];

  return (
    <div className={rootClassName}>
      {actionList.map((item, i) => {
        if (!allowedActions.includes(item.title as any)) {
          return <React.Fragment key={i} />;
        }
        return (
          <span key={i} onClick={(e) => handleOnClick(e, item.action)}>
            <AppIcon name={item.title as any} />
          </span>
        );
      })}
    </div>
  );
};

export default ItemAction;
