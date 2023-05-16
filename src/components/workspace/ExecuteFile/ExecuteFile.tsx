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

  const allowedFile = ['ts', 'fc'];

  const buildFile = async () => {
    try {
      const fileExtension = file.name.split('.').pop();
      switch (fileExtension) {
        case 'ts':
          const code = await compileTsFile(file, projectId);
          console.log('code--', code);
          break;
        case 'fc':
          const response = await compileFuncProgram(file, projectId);
          console.log('response', response);
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
        Run
      </Button>
    </>
  );
};

export default ExecuteFile;
