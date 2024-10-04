import AppIcon, { AppIconType } from '@/components/ui/icon';
import cn from 'clsx';
import React, { FC } from 'react';

import { Tooltip } from 'antd';
import s from './FileTree.module.scss';

export type actionsTypes = 'Edit' | 'NewFile' | 'NewFolder' | 'Close';

interface Props {
  className?: string;
  allowedActions: actionsTypes[];
  onRename?: () => void;
  onNewFile?: () => void;
  onNewDirectory?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

const ItemAction: FC<Props> = ({
  className,
  allowedActions,
  onRename,
  onNewFile,
  onNewDirectory,
  onDelete,
  onShare,
}) => {
  const rootClassName = cn(s.actionRoot, className, 'actions');
  const handleOnClick = (
    e: React.MouseEvent,
    action: (() => void) | undefined,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!action) return;
    action();
  };

  const actionList = [
    {
      title: 'Edit',
      label: 'Edit',
      action: onRename,
    },
    {
      title: 'NewFile',
      label: 'New File',
      action: onNewFile,
    },
    {
      title: 'NewFolder',
      label: 'New Folder',
      action: onNewDirectory,
    },
    {
      title: 'Share',
      label: 'Share',
      action: onShare,
    },
    {
      title: 'Close',
      label: 'Delete',
      action: onDelete,
    },
  ];

  return (
    <div className={rootClassName}>
      {actionList.map((item, i) => {
        if (!allowedActions.includes(item.title as actionsTypes)) {
          return <React.Fragment key={i} />;
        }
        return (
          <Tooltip title={item.label} key={i}>
            <span
              onClick={(e) => {
                handleOnClick(e, item.action);
              }}
            >
              <AppIcon name={item.title as AppIconType} />
            </span>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default ItemAction;
