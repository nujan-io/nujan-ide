import { FC } from 'react';
import {
  AiOutlineClose,
  AiOutlineFileAdd,
  AiOutlineFolderAdd,
  AiOutlineHome,
  AiOutlineProject,
} from 'react-icons/ai';
import { FiEdit2 } from 'react-icons/fi';

import { VscGist } from 'react-icons/vsc';

import { CiBeaker1 } from 'react-icons/ci';
import Plus from './Plus';

export type AppIconType =
  | 'Project'
  | 'Edit'
  | 'NewFile'
  | 'NewFolder'
  | 'Close'
  | 'Code'
  | 'Beaker'
  | 'Plus'
  | 'Home';

export interface AppIconInterface {
  name: AppIconType;
  className?: string;
}

const Components = {
  Project: AiOutlineProject,
  Edit: FiEdit2,
  NewFile: AiOutlineFileAdd,
  NewFolder: AiOutlineFolderAdd,
  Close: AiOutlineClose,
  Home: AiOutlineHome,
  Code: VscGist,
  Beaker: CiBeaker1,
  Plus,
};

const AppIcon: FC<AppIconInterface> = ({ name, className = '' }) => {
  if (typeof Components[name] !== undefined) {
    const Component = Components[name];
    return <Component className={className} />;
  }

  return <></>;
};

export default AppIcon;
