import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Tree } from '@/interfaces/workspace.interface';
import { compileFunc } from '@ton-community/func-js';
import { Button, Form, message, Select } from 'antd';
import { FC, useState } from 'react';
import { Cell } from 'ton-core';
import s from './BuildProject.module.scss';

interface Props {
  projectId: string;
}
const BuildProject: FC<Props> = ({ projectId }) => {
  const [isLoading, setIsLoading] = useState('');
  const [funcStdLib, setFuncStdLib] = useState('');
  const [buildOutput, setBuildoutput] = useState<{
    contractBOC: string | null;
    dataCell: Cell | null;
  } | null>(null);

  const { Option } = Select;

  const { projectFiles, getFileByPath } = useWorkspaceActions();

  const onFormFinish = async ({ fileId }: { fileId: Tree['id'] }) => {
    const file = getProjectFiles().find((f) => f.id === fileId);
    setBuildoutput(null);
    if (!file?.id) {
      message.error('File not found');
      return;
    }
    if (!file.content) {
      message.error('Code missing from file');
      return;
    }
    setIsLoading('build');

    try {
      let stdLib: any = funcStdLib;

      if (stdLib == '') {
        stdLib = await fetch('/assets/ton/stdlib.fc');
        stdLib = await stdLib.text();
        setFuncStdLib(stdLib);
      }

      let result: any = await compileFunc({
        targets: ['stdlib.fc', file?.name],
        sources: (path) => {
          if (path === 'stdlib.fc') {
            return stdLib.toString();
          }
          const file = getFileByPath(path, projectId as string);
          return file?.content;
        },
      });

      if (result.status === 'error') {
        message.error(result.message);
        return;
      }

      setBuildoutput((t: any) => {
        return {
          ...t,
          contractBOC: result.codeBoc,
        };
      });
      message.success('Build successfull');
    } catch (error) {
      console.log('error', error);
      message.error('Something went wrong');
    } finally {
      setIsLoading('');
    }
  };

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
            { required: true, message: 'Please select your project file!' },
          ]}
        >
          <Select>
            {getProjectFiles().map((f, i) => (
              <Option key={i} value={f.id}>
                {f.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Button
          style={{ marginRight: '5px' }}
          type="primary"
          htmlType="submit"
          loading={isLoading == 'build'}
        >
          Build
        </Button>
      </Form>
    </div>
  );
};

export default BuildProject;
