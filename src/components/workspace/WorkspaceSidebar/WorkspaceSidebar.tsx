import AppIcon from '@/components/ui/icon';
import { useSession } from 'next-auth/react';
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
}

const WorkspaceSidebar: FC<Props> = ({ activeMenu, onMenuClicked }) => {
  const { data: session } = useSession();

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
  return (
    <div className={s.container}>
      <Link href="/project" className={`${s.action}`}>
        <AppIcon name="Home" />
        <span>Home</span>
      </Link>
      {menuItems.map((menu, i) => {
        if (menu.private && !(session?.user as any)?.id) {
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
