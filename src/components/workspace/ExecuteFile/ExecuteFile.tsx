import { useProjectActions } from '@/hooks/project.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project, Tree } from '@/interfaces/workspace.interface';
import { Button, message } from 'antd';
import { FC } from 'react';
import s from './ExecuteFile.module.scss';

type ButtonClick =
  | React.MouseEvent<HTMLButtonElement, MouseEvent>
  | React.MouseEvent<HTMLAnchorElement, MouseEvent>;
interface Props {
  file: Tree | undefined;
  projectId: Project['id'];
  onCompile?: () => void;
  onClick?: (e: ButtonClick, data: string) => void;
  label?: string;
  description?: string;
  allowedFile: string[];
}
const ExecuteFile: FC<Props> = ({
  file,
  projectId,
  onCompile,
  onClick,
  label = 'Compile',
  description = '',
  allowedFile = [],
}) => {
  const { compileTsFile } = useWorkspaceActions();
  const { compileFuncProgram } = useProjectActions();
  const fileExtension = file?.name?.split('.').slice(1).join('.');

  const buildFile = async (e: ButtonClick) => {
    if (!file) return;
    try {
      switch (fileExtension) {
        case 'ts':
          const code = await compileTsFile(file, projectId);
          break;
        case 'spec.ts':
          if (!onClick || !file.path) return;
          onClick(e, file.path);
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
    if (fileExtension === undefined) return false;
    return allowedFile.includes(fileExtension as string);
  };

  return (
    <div className={s.root}>
      {description && <p className={s.desc}>{description}</p>}
      <Button
        type="primary"
        className={`${s.action} w-100`}
        disabled={!isFileAllowed()}
        onClick={buildFile}
        title={`${label}: ${file?.name}`}
      >
        {label} {file ? file.name : '<no file selected>'}
      </Button>
    </div>
  );
};

export default ExecuteFile;
