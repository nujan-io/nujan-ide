import AppIcon from '@/components/ui/icon';
import { useAuthAction } from '@/hooks/auth.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import Link from 'next/link';
import { FC } from 'react';
import s from './WorkspaceSidebar.module.scss';

export type WorkSpaceMenu = 'code' | 'build' | 'test-cases' | 'setting';
interface MenuItem {
  label: string;
  value: WorkSpaceMenu;
  icon: string;
  private?: boolean;
}

interface Props {
  activeMenu: WorkSpaceMenu;
  onMenuClicked: (name: WorkSpaceMenu) => void;
  projectId: Project['id'];
}

const WorkspaceSidebar: FC<Props> = ({
  activeMenu,
  onMenuClicked,
  projectId,
}) => {
  const { isProjectEditable } = useWorkspaceActions();
  const { user } = useAuthAction();

  const hasEditAccess = isProjectEditable(projectId as string, user);

  const menuItems: MenuItem[] = [
    {
      label: 'Code',
      value: 'code',
      icon: 'Code',
    },
    {
      label: 'Deploy',
      value: 'build',
      icon: 'Beaker',
    },
    {
      label: 'Test Cases',
      value: 'test-cases',
      icon: 'TestCases',
    },
    {
      label: 'Setting',
      value: 'setting',
      icon: 'Setting',
      private: true,
    },
  ];

  return (
    <div className={s.container}>
      <Link href="/project" className={`${s.action}`}>
        <AppIcon name="Home" />
        <span>Home</span>
      </Link>
      {menuItems.map((menu, i) => {
        if (menu.private && !hasEditAccess) {
          return;
        }
        return (
          <div
            key={i}
            className={`${s.action} ${
              activeMenu === menu.value ? s.isActive : ''
            }`}
            onClick={() => onMenuClicked(menu.value)}
          >
            <AppIcon name={menu.icon as any} />
            <span>{menu.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default WorkspaceSidebar;
