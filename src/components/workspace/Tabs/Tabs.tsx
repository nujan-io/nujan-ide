import AppIcon from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Tree } from '@/interfaces/workspace.interface';
import { fileTypeFromFileName } from '@/utility/utils';
import { FC } from 'react';
import s from './Tabs.module.scss';

interface Props {
  projectId: string;
}

const Tabs: FC<Props> = ({ projectId }) => {
  const { openedFiles, openFile, closeFile } = useWorkspaceActions();
  const openedFilesList = openedFiles();

  const updateActiveTab = (node: Tree) => {
    openFile(node.id, projectId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    closeFile(id);
  };

  if (openedFilesList.length === 0) {
    return <></>;
  }
  return (
    <div className={s.container}>
      <div className={s.tabList}>
        {openedFilesList.map((item) => (
          <div
            onClick={() => updateActiveTab(item)}
            className={`${s.item} 
            file-icon
            ${item.name.split('.').pop()}-lang-file-icon
            ${fileTypeFromFileName(item.name)}-lang-file-icon
               ${item.isOpen ? s.isActive : ''}
              `}
            key={item.id}
          >
            {item.name}
            <span className={s.close} onClick={(e) => closeTab(e, item.id!)}>
              <AppIcon name="Close" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
