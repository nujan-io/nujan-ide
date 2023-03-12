import AppIcon from '@/components/ui/icon';
import Link from 'next/link';
import { FC } from 'react';
import s from './WorkspaceSidebar.module.scss';

export type WorkSpaceMenu = 'code' | 'build' | 'test-cases';
interface MenuItem {
  label: string;
  value: WorkSpaceMenu;
  icon: string;
}

interface Props {
  activeMenu: WorkSpaceMenu;
  onMenuClicked: (name: WorkSpaceMenu) => void;
}

const WorkspaceSidebar: FC<Props> = ({ activeMenu, onMenuClicked }) => {
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
  ];
  return (
    <div className={s.container}>
      <Link href="/project" className={`${s.action}`}>
        <AppIcon name="Home" />
        <span>Home</span>
      </Link>
      {menuItems.map((menu, i) => (
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
      ))}
    </div>
  );
};

export default WorkspaceSidebar;
