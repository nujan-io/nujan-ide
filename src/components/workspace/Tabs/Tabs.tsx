import AppIcon from '@/components/ui/icon';
import { useFileTab } from '@/hooks';
import { useProject } from '@/hooks/projectV2.hooks';
import fileSystem from '@/lib/fs';
import EventEmitter from '@/utility/eventEmitter';
import { fileTypeFromFileName } from '@/utility/utils';
import { FC, useEffect } from 'react';
import s from './Tabs.module.scss';

const Tabs: FC = () => {
  const { fileTab, open, close, syncTabSettings, updateFileDirty } =
    useFileTab();
  const { activeProject, setActiveProject } = useProject();

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
    (async () => {
      // If the active project is a temp project, the file tab is active and file does not exist
      if (activeProject?.path?.includes('temp')) {
        setActiveProject('non-existing-dir');
        try {
          if (!fileTab.active) {
            return;
          }
          await fileSystem.exists(fileTab.active);
        } catch (error) {
          syncTabSettings({ items: [], active: null });
        }
      }
    })();
  }, []);

  useEffect(() => {
    EventEmitter.on('FILE_SAVED', onFileSave);
    return () => {
      EventEmitter.off('FILE_SAVED', onFileSave);
    };
  }, [updateFileDirty]);

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
