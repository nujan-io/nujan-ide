import { FC } from 'react';
import {
  AiOutlineDelete,
  AiOutlineDownload,
  AiOutlineGoogle,
  AiOutlineHome,
  AiOutlineLogout,
  AiOutlineProject,
  AiOutlineReload,
} from 'react-icons/ai';
import { BsShare } from 'react-icons/bs';

import { BsFillPlayFill } from 'react-icons/bs';
import { FaRegClone } from 'react-icons/fa';
import { FiEdit2, FiEye } from 'react-icons/fi';
import { GoTriangleDown, GoTriangleRight, GoTriangleUp } from 'react-icons/go';
import { GrClear } from 'react-icons/gr';
import { HiDocumentText } from 'react-icons/hi';
import { MdFeedback } from 'react-icons/md';

import {
  Beaker,
  Build,
  Close,
  Code,
  GitHub,
  Import,
  Info,
  NewFile,
  NewFolder,
  Plus,
  Rocket,
  Setting,
  Telegram,
  Test,
} from './AppIconList';

export type AppIconType =
  | 'Project'
  | 'Edit'
  | 'NewFile'
  | 'NewFolder'
  | 'Close'
  | 'Code'
  | 'Beaker'
  | 'Plus'
  | 'Home'
  | 'AngleUp'
  | 'AngleDown'
  | 'AngleRight'
  | 'Test'
  | 'Google'
  | 'GitHub'
  | 'Logout'
  | 'Setting'
  | 'Clone'
  | 'Delete'
  | 'Play'
  | 'Document'
  | 'Feedback'
  | 'Telegram'
  | 'Info'
  | 'Build'
  | 'Rocket'
  | 'Eye'
  | 'Clear'
  | 'Download'
  | 'Import'
  | 'Reload'
  | 'Share';

export interface AppIconInterface {
  name: AppIconType;
  className?: string;
}

const Components = {
  Project: AiOutlineProject,
  Edit: FiEdit2,
  NewFile,
  NewFolder,
  Close: Close,
  Home: AiOutlineHome,
  Code,
  Beaker,
  AngleUp: GoTriangleUp,
  AngleDown: GoTriangleDown,
  AngleRight: GoTriangleRight,
  Test: Test,
  Google: AiOutlineGoogle,
  GitHub,
  Logout: AiOutlineLogout,
  Setting,
  Clone: FaRegClone,
  Plus,
  Delete: AiOutlineDelete,
  Play: BsFillPlayFill,
  Document: HiDocumentText,
  Feedback: MdFeedback,
  Telegram,
  Info,
  Build,
  Rocket,
  Eye: FiEye,
  Clear: GrClear,
  Download: AiOutlineDownload,
  Import,
  Reload: AiOutlineReload,
  Share: BsShare,
};

const AppIcon: FC<AppIconInterface> = ({ name, className = '' }) => {
  if (name in Components) {
    const Component = Components[name];
    return <Component className={className} />;
  }

  return <></>;
};

export default AppIcon;
