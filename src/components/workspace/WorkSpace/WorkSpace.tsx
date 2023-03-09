import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import Router, { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';
import FileTree from '../tree/FileTree';
import WorkspaceSidebar from '../WorkspaceSidebar';
import { WorkSpaceMenu } from '../WorkspaceSidebar/WorkspaceSidebar';
import s from './WorkSpace.module.scss';

const WorkSpace: FC = () => {
  const workspaceAction = useWorkspaceActions();
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<WorkSpaceMenu>('code');
  const [isLoaded, setIsLoaded] = useState(false);

  const { id: projectId, tab } = router.query;

  useEffect(() => {
    if (!projectId) {
      return;
    }
    if (workspaceAction.projectFiles(projectId as string).length === 0) {
      Router.push('/project');
    }
  }, [projectId]);

  useEffect(() => {
    if (tab) {
      setActiveMenu(tab as WorkSpaceMenu);
    }
    setIsLoaded(true);
  }, [tab]);

  return (
    <div className={`${s.root} show-file-icons`}>
      <div className={s.sidebar}>
        <WorkspaceSidebar
          activeMenu={activeMenu}
          onMenuClicked={(name) => {
            setActiveMenu(name);
            router.replace({
              query: { ...router.query, tab: name },
            });
          }}
        />
      </div>
      <div className={s.tree}>
        <FileTree projectId={projectId as string} />
      </div>
    </div>
  );
};

export default WorkSpace;
