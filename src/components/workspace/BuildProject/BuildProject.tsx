import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Tree } from '@/interfaces/workspace.interface';
import { Form, Select } from 'antd';
import { FC } from 'react';
import s from './BuildProject.module.scss';

interface Props {
  projectId: string;
}
const BuildProject: FC<Props> = ({ projectId }) => {
  const { projectFiles } = useWorkspaceActions();

  const onFormFinish = async ({ fileId }: { fileId: string }) => {};

  const getProjectFiles = () => {
    const _projectFiles = projectFiles(projectId);
    let files: Tree[] = [];
    if (!_projectFiles) {
      return [];
    }

    files = _projectFiles.filter(
      (file) =>
        !file.parent && file.type !== 'directory' && file.name.includes('.fc')
    );

    return files;
  };

  return (
    <div className={s.root}>
      <h3 className={s.heading}>Build & Deploy</h3>
      <Form
        className={s.form}
        layout="vertical"
        onFinish={onFormFinish}
        autoComplete="off"
      >
        <Form.Item
          label="Select file to build"
          name="fileId"
          className={s.formItem}
          rules={[
            { required: true, message: 'Please input your project name!' },
          ]}
        >
          <Select>
            {getProjectFiles().map((f, i) => (
              <Select.Option key={i} value={f.id}>
                {f.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </div>
  );
};

export default BuildProject;
