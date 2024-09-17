import AppIcon from '@/components/ui/icon';
import { useFileTab } from '@/hooks';
import { useProject } from '@/hooks/projectV2.hooks';
import EventEmitter from '@/utility/eventEmitter';
import { fileTypeFromFileName } from '@/utility/utils';
import { FC, useEffect } from 'react';
import s from './Tabs.module.scss';

const Tabs: FC = () => {
  const { fileTab, open, close, syncTabSettings, updateFileDirty } =
    useFileTab();
  const { activeProject } = useProject();

  const closeTab = (e: React.MouseEvent, filePath: string) => {
    e.preventDefault();
    e.stopPropagation();
    close(filePath);
  };

  const onFileSave = ({ filePath }: { filePath: string }) => {
    updateFileDirty(filePath, false);
  };

  useEffect(() => {
    syncTabSettings();
  }, [activeProject]);

  useEffect(() => {
    EventEmitter.on('FILE_SAVED', onFileSave);
  }, []);

  if (fileTab.items.length === 0) {
    return <></>;
  }
  return (
    <div className={s.container}>
      <div className={s.tabList}>
        {fileTab.items.map((item) => (
          <div
            onClick={() => {
              open(item.name, item.path);
            }}
            className={`${s.item} 
            file-icon
            ${item.name.split('.').pop()}-lang-file-icon
            ${fileTypeFromFileName(item.name)}-lang-file-icon
               ${item.path === fileTab.active ? s.isActive : ''}
              `}
            key={item.path}
          >
            {item.name}
            <span
              className={`${s.close} ${item.isDirty ? s.isDirty : ''}`}
              onClick={(e) => {
                closeTab(e, item.path);
              }}
            >
              <span className={s.fileDirtyIcon}></span>
              <AppIcon name="Close" className={s.closeIcon} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
