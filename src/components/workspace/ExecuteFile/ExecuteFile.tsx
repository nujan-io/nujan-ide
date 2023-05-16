import AppIcon from '@/components/ui/icon';
import { useProjectActions } from '@/hooks/project.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project, Tree } from '@/interfaces/workspace.interface';
import { Button, message } from 'antd';
import { FC } from 'react';
import s from './ExecuteFile.module.scss';

interface Props {
  file: Tree;
  projectId: Project['id'];
}
const ExecuteFile: FC<Props> = ({ file, projectId }) => {
  const { compileTsFile } = useWorkspaceActions();
  const { compileFuncProgram } = useProjectActions();
  const fileExtension = file.name.split('.').pop();

  const allowedFile = ['fc'];

  const buildFile = async () => {
    try {
      switch (fileExtension) {
        case 'ts':
          const code = await compileTsFile(file, projectId);
          break;
        case 'fc':
          const response = await compileFuncProgram(file, projectId);
          message.success('Compiled successfully');
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
    if (file.name.split('.').pop() === undefined) return false;
    return allowedFile.includes(file.name.split('.').pop() as string);
  };

  return (
    <>
      <Button
        className={s.tsAction}
        disabled={!isFileAllowed()}
        onClick={() => {
          buildFile();
        }}
      >
        <AppIcon name="Play" />
        {fileExtension === 'fc' ? 'Compile' : 'Run'}
      </Button>
    </>
  );
};

export default ExecuteFile;
