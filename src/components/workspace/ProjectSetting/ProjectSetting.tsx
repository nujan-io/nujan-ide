import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import { Form, Switch } from 'antd';
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
    workspaceAction.updateProjectById({ isPublic: status }, projectId);
  };

  return (
    <div className={s.root}>
      <Form.Item label="Is project public" valuePropName="checked">
        <Switch checked={isChecked} onChange={toggleProjectStatus} />
      </Form.Item>
    </div>
  );
};

export default ProjectSetting;
