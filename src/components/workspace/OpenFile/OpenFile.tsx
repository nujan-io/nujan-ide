import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { FC } from 'react';
import s from './OpenFile.module.scss';

interface Props {
  path: string;
  name: string;
  projectId: string;
}

const OpenFile: FC<Props> = ({ path, name, projectId }) => {
  const { openFileByPath } = useWorkspaceActions();

  return (
    <span
      className={s.root}
      onClick={() => {
        openFileByPath(path, projectId);
      }}
    >
      {name}
    </span>
  );
};

export default OpenFile;
