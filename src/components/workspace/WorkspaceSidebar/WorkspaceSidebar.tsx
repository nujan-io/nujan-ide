import { AppLogo, Tooltip } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { AppData } from '@/constant/AppData';
import { useAuthAction } from '@/hooks/auth.hooks';
import { useSettingAction } from '@/hooks/setting.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import { Form, Popover, Switch } from 'antd';
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
  const { isContractDebugEnabled, toggleContractDebug } = useSettingAction();

  const hasEditAccess = isProjectEditable(projectId as string, user);

  const menuItems: MenuItem[] = [
    {
      label: 'Code',
      value: 'code',
      icon: 'Code',
    },
    {
      label: 'Build & Deploy',
      value: 'build',
      icon: 'Beaker',
    },
    {
      label: 'Unit Test',
      value: 'test-cases',
      icon: 'Test',
    },
  ];

  const settingContent = () => (
    <div>
      <div className={s.settingItem}>
        <Form.Item
          style={{ marginBottom: 0 }}
          label="Debug Contract"
          valuePropName="checked"
        >
          <Switch
            checked={isContractDebugEnabled()}
            onChange={(toggleState) => {
              toggleContractDebug(toggleState);
            }}
          />
        </Form.Item>
        <p>
          *{' '}
          <small>
            Contract rebuild and redeploy <br /> required after an update
          </small>
        </p>
      </div>
    </div>
  );

  return (
    <div className={s.container}>
      <div>
        <AppLogo className={`${s.brandLogo}`} href="/" />
        {menuItems.map((menu, i) => {
          if (menu.private && !hasEditAccess) {
            return;
          }
          return (
            <Tooltip key={i} title={menu.label} placement="right">
              <div
                className={`${s.action} ${
                  activeMenu === menu.value ? s.isActive : ''
                } ${!projectId ? s.disabled : ''}`}
                onClick={() => projectId && onMenuClicked(menu.value)}
              >
                <AppIcon className={s.icon} name={menu.icon as any} />
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div>
        {AppData.socials.map((menu, i) => (
          <Tooltip key={i} title={menu.label} placement="right">
            <Link href={menu.url} className={`${s.action}`} target="_blank">
              <AppIcon className={s.icon} name={menu.icon as any} />
            </Link>
          </Tooltip>
        ))}
        <Popover placement="rightTop" title="Setting" content={settingContent}>
          <div className={`${s.action}`}>
            <AppIcon className={s.icon} name="Setting" />
          </div>
        </Popover>
      </div>
    </div>
  );
};

export default WorkspaceSidebar;
