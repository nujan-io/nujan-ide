import AppIcon from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import { Button, Form, message, Switch } from 'antd';
import { FC, useState } from 'react';
import s from './ProjectSetting.module.scss';

interface Props {
  projectId: Project['id'];
}

const ProjectSetting: FC<Props> = ({ projectId }) => {
  const workspaceAction = useWorkspaceActions();
  const project = workspaceAction.project(projectId);
  const [isChecked, setIsChecked] = useState(project?.isPublic);

  const toggleProjectStatus = (status: boolean) => {
    setIsChecked(status);
    workspaceAction.updateProjectById(
      { isPublic: status } as Project,
      projectId,
    );
  };

  const copyURL = async () => {
    const { protocol, host, pathname } = window.location;
    const url = protocol + '//' + host + '/' + pathname;
    await navigator.clipboard.writeText(url);
    await message.info('Copied to clipboard');
  };

  return (
    <div className={s.root}>
      <Form.Item label="Is project public" valuePropName="checked">
        <Switch checked={isChecked} onChange={toggleProjectStatus} />
      </Form.Item>
      <p>
        <small>
          You can make your project public if want to make it shareable anywhere
        </small>
      </p>
      <Button
        onClick={() => {
          copyURL().catch(() => {});
        }}
        className={s.copy}
      >
        <AppIcon name="Clone" className={s.icon} />
        Copy URL
      </Button>
    </div>
  );
};

export default ProjectSetting;
