import { Tooltip } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useProject } from '@/hooks/projectV2.hooks';
import { IGitWorkerMessage, InitRepo } from '@/interfaces/git.interface';
import GitManager from '@/lib/git';
import EventEmitter from '@/utility/eventEmitter';
import { Button, Collapse } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';
import s from './ManageGit.module.scss';

interface IFileCollection {
  path: string;
  status: 'U' | 'A' | 'M' | 'D';
  staged: boolean;
}

const ManageGit: FC = () => {
  const workerRef = useRef<Worker>();
  const { activeProject } = useProject();
  const [isGitInitialized, setIsGitInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fileCollection, setFileCollection] = useState<IFileCollection[]>([]);

  const initGit = () => {
    if (!activeProject?.path) {
      console.log('Project path not found');
      return;
    }

    const workerMessage: IGitWorkerMessage<InitRepo> = {
      type: 'init',
      payload: {
        data: {
          projectPath: activeProject.path,
        },
      },
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
    }
  };

  const getFilesToCommit = () => {
    workerRef.current?.postMessage({
      type: 'getFilesToCommit',
      payload: { data: { projectPath: activeProject?.path } },
    });
  };

  const handleFiles = (
    filePath: string,
    action: 'add' | 'unstage',
    all = false,
  ) => {
    if (!activeProject?.path) return;

    let files = [];
    if (all) {
      const filterType = action === 'add' ? 'changed' : 'staged';
      files = filterdFiles(filterType).map((file) => ({ path: file.path }));
      if (files.length === 0) return;
    } else {
      files = [{ path: filePath }];
    }

    workerRef.current?.postMessage({
      type: action === 'add' ? 'addFiles' : 'unstageFile',
      payload: {
        data: { files, projectPath: activeProject.path },
      },
    });
  };

  const filterdFiles = (type: 'staged' | 'changed') => {
    if (type === 'staged') {
      return fileCollection.filter((file) => file.staged);
    }
    return fileCollection.filter((file) => !file.staged);
  };

  const onMount = async () => {
    if (!activeProject?.path) return;
    const git = new GitManager();
    const _isInitialized = await git.isInitialized(activeProject.path);
    setIsGitInitialized(_isInitialized);
    if (_isInitialized) {
      getFilesToCommit();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    onMount();
    workerRef.current = new Worker(
      new URL('@/workers/git.ts', import.meta.url),
      {
        type: 'module',
      },
    );
    workerRef.current.onmessage = (e) => {
      const { type, projectPath } = e.data;

      if (type === 'GIT_INITIALIZED') {
        EventEmitter.emit('RELOAD_PROJECT_FILES', projectPath);
        setIsGitInitialized(true);
      } else if (type === 'FILES_TO_COMMIT') {
        setFileCollection(e.data.payload);
      }
      const actionsForReload = [
        'GIT_INITIALIZED',
        'FILES_ADDED',
        'FILE_UNSTAGED',
      ];
      if (actionsForReload.includes(type)) {
        getFilesToCommit();
      }
    };
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error);
    };
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  if (!activeProject?.path || isLoading) {
    return <></>;
  }

  const renderCategoryWiseFiles = (
    files: IFileCollection[],
    staged: boolean,
  ) => {
    return (
      <ul>
        {files.map((file) => (
          <li key={file.path} className={s.fileItem}>
            <div className={s.fileDetails}>
              {file.path.split('/').pop()}{' '}
              <span className={s.filePath}>
                {file.path.split('/').slice(0, -1).join('/')}
              </span>
            </div>
            <Tooltip title={staged ? 'Unstage file' : 'Stage file'}>
              <span
                className={s.action}
                onClick={() => {
                  handleFiles(file.path, staged ? 'unstage' : 'add');
                }}
              >
                <AppIcon name={staged ? 'Minus' : 'Plus2'} />
              </span>
            </Tooltip>

            <div className={s.actionWrapper}>{file.status}</div>
          </li>
        ))}
      </ul>
    );
  };

  const renderFiles = () => {
    if (!fileCollection.length) {
      return <div>No changes</div>;
    }
    const stagedFiles = filterdFiles('staged');
    const unstagedFiles = filterdFiles('changed');
    const header = (staged = false) => {
      return (
        <div className={s.collapseHeader}>
          {staged ? 'Staged' : 'Changes'}
          <Tooltip title={staged ? 'Unstage all' : 'Stage all'}>
            <span
              className={s.action}
              onClick={() => {
                handleFiles('none', staged ? 'unstage' : 'add', true);
              }}
            >
              <AppIcon name={staged ? 'Minus' : 'Plus2'} />
            </span>
          </Tooltip>
        </div>
      );
    };
    return (
      <div>
        <Collapse
          className={s.collapse}
          defaultActiveKey={['1', '2']}
          bordered={false}
        >
          {stagedFiles.length > 0 && (
            <Collapse.Panel
              header={header(true)}
              className={s.collapsePanel}
              key="1"
            >
              {renderCategoryWiseFiles(stagedFiles, true)}
            </Collapse.Panel>
          )}

          <Collapse.Panel
            header={header(false)}
            className={s.collapsePanel}
            key="2"
          >
            {renderCategoryWiseFiles(unstagedFiles, false)}
          </Collapse.Panel>
        </Collapse>
      </div>
    );
  };

  return (
    <div className={s.root}>
      {!isGitInitialized && (
        <Button
          type="primary"
          className={`item-center-align w-100`}
          onClick={() => {
            initGit();
          }}
        >
          <AppIcon name="GitBranch" /> Initialize Git
        </Button>
      )}
      {isGitInitialized && renderFiles()}
    </div>
  );
};

export default ManageGit;
