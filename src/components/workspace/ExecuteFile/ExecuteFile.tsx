import { useProjectActions } from '@/hooks/project.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project, Tree } from '@/interfaces/workspace.interface';
import { Button, message } from 'antd';
import { FC } from 'react';
import s from './ExecuteFile.module.scss';

interface Props {
  file: Tree | undefined;
  projectId: Project['id'];
  onCompile?: () => void;
  label?: string;
}
const ExecuteFile: FC<Props> = ({
  file,
  projectId,
  onCompile,
  label = 'Compile',
}) => {
  const { compileTsFile } = useWorkspaceActions();
  const { compileFuncProgram } = useProjectActions();
  const fileExtension = file?.name?.split('.').pop();

  const allowedFile = ['fc'];

  const buildFile = async () => {
    if (!file) return;
    try {
      switch (fileExtension) {
        case 'ts':
          const code = await compileTsFile(file, projectId);
          break;
        case 'fc':
          const response = await compileFuncProgram(file, projectId);
          if (onCompile) {
            onCompile();
          }
          message.success('Built successfully');
          break;
      }
    } catch (error) {
      if (typeof error === 'string') {
        message.error(error);
        return;
      }
      message.error(
        'Something went wrong. Check browser console for more details'
      );
      console.log('error', error);
    }
  };

  const isFileAllowed = () => {
    if (!file) return false;
    if (file.name.split('.').pop() === undefined) return false;
    return allowedFile.includes(file.name.split('.').pop() as string);
  };

  return (
    <>
      <Button
        type="primary"
        className={s.tsAction}
        disabled={!isFileAllowed()}
        onClick={() => {
          buildFile();
        }}
        title={label === 'Deploy' ? 'Build and Deploy' : 'Build'}
      >
        {label} {file ? file.name : '<no file selected>'}
      </Button>
    </>
  );
};

export default ExecuteFile;
