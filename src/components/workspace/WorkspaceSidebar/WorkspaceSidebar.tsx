import AppIcon from '@/components/ui/icon';
import { useProjectServiceActions } from '@/hooks/ProjectService.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import { message, Spin } from 'antd';
import Link from 'next/link';
import Router from 'next/router';
import { FC, useState } from 'react';
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
  const { isProjectEditable, createNewProject } = useWorkspaceActions();
  const { cloneProject } = useProjectServiceActions();
  const [isLoading, setIsLoading] = useState(false);
  const hasEditAccess = isProjectEditable(projectId as string);

  const menuItems: MenuItem[] = [
    {
      label: 'Code',
      value: 'code',
      icon: 'Code',
    },
    {
      label: 'Compile',
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

  const cloneCurrentProject = async () => {
    try {
      setIsLoading(true);
      const response = await cloneProject(projectId);
      const { project, projectFiles } = response.data.data;
      createNewProject({ ...project }, projectFiles);
      setTimeout(() => {
        Router.push(`/project/${project.id}`);
        message.success('Project cloned');
      }, 1000);
    } catch (error) {
      message.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

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
      {!hasEditAccess && (
        <div
          className={`${s.action} ${isLoading ? s.disabled : ''}`}
          onClick={cloneCurrentProject}
        >
          {!isLoading && <AppIcon name="Clone" className={s.clone} />}
          {isLoading && <Spin size="default" className={s.loader} />}
          <span>Clone Project</span>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSidebar;
