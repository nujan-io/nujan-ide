import { ProjectTemplate } from '@/components/template';
import { AppConfig } from '@/config/AppConfig';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import { Analytics } from '@/utility/analytics';
import EventEmitter from '@/utility/eventEmitter';
import { Blockchain } from '@ton-community/sandbox';
import { Spin } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';
import Split from 'react-split';
import { useEffectOnce } from 'react-use';
import * as TonCore from 'ton-core';
import BottomPanel from '../BottomPanel/BottomPanel';
import BuildProject from '../BuildProject';
import Editor from '../Editor';
import ProjectSetting from '../ProjectSetting';
import Tabs from '../Tabs';
import TestCases from '../TestCases';
import WorkspaceSidebar from '../WorkspaceSidebar';
import { WorkSpaceMenu } from '../WorkspaceSidebar/WorkspaceSidebar';
import { globalWorkspace } from '../globalWorkspace';
import { ManageProject } from '../project';
import FileTree from '../tree/FileTree';
import ItemAction from '../tree/FileTree/ItemActions';
import s from './WorkSpace.module.scss';

const WorkSpace: FC = () => {
  const workspaceAction = useWorkspaceActions();
  const { createLog, clearLog } = useLogActivity();

  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<WorkSpaceMenu>('code');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsloading] = useState(false);
  const [contract, setContract] = useState<any>('');

  const { id: projectId, tab } = router.query;

  const activeFile = workspaceAction.activeFile(projectId as string);
  const activeProject = workspaceAction.project(projectId as string);

  const commitItemCreation = (type: string, name: string) => {
    workspaceAction.createNewItem('', name, type, projectId as string);
  };

  const createSandbox = async (force: boolean = false) => {
    if (globalWorkspace.sandboxBlockchain && !force) {
      return;
    }
    const blockchain = await Blockchain.create();
    globalWorkspace.sandboxBlockchain = blockchain;
  };

  useEffect(() => {
    if (activeProject) {
      createLog(`Project '${activeProject?.name}' is opened`);
    }
    createSandbox();
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        EventEmitter.emit('SAVE_FILE', () => {});
      }
    });
    const originalConsoleLog = console.log;

    console.log = (...args) => {
      // console.trace(args);
      originalConsoleLog(...args); // Call the original console.log
      const _log = args.join(' ');
      if (!_log.includes('DEBUG') || activeProject?.language === 'tact') {
        return;
      }
      const splittedLog = _log.split('\n');
      for (let i = 0; i < splittedLog.length; i++) {
        createLog(splittedLog[i], 'info', true, true);
      }
    };

    Analytics.track('Project Opened', {
      platform: 'IDE',
      type: 'TON-func',
    });

    return () => {
      console.log = originalConsoleLog;
      try {
        document.removeEventListener('keydown', () => {});

        clearLog();
      } catch (error) {}
    };
  }, []);

  useEffect(() => {
    if (tab) {
      setActiveMenu(tab as WorkSpaceMenu);
    }
  }, [tab]);

  useEffectOnce(() => {
    setIsLoaded(true);
    (window as any).TonCore = TonCore;
  });

  return (
    <div className={`${s.root} show-file-icons`}>
      <div className={`${s.sidebar} onboarding-workspace-sidebar`}>
        <WorkspaceSidebar
          activeMenu={activeMenu}
          projectId={projectId as string}
          onMenuClicked={(name) => {
            setActiveMenu(name);
            router.replace({
              query: { ...router.query, tab: name },
            });
          }}
        />
      </div>
      <Split
        className={s.splitHorizontal}
        minSize={250}
        gutterSize={4}
        sizes={[5, 95]}
        onDragEnd={() => {
          EventEmitter.emit('ON_SPLIT_DRAG_END', () => {});
        }}
      >
        <div className={s.tree}>
          {activeMenu === 'setting' && (
            <ProjectSetting projectId={projectId as Project['id']} />
          )}
          {isLoaded && activeMenu === 'code' && (
            <div className="onboarding-file-explorer">
              <span className={s.heading}>Explorer</span>
              <ManageProject />
              {activeProject && (
                <div className={s.globalAction}>
                  <span>{AppConfig.name} IDE</span>
                  <ItemAction
                    className={`${s.visible}`}
                    allowedActions={['NewFile', 'NewFolder']}
                    onNewFile={() => commitItemCreation('file', 'new file')}
                    onNewDirectory={() =>
                      commitItemCreation('directory', 'new folder')
                    }
                  />
                </div>
              )}

              {isLoading && (
                <Spin tip="Loading" size="default" className={s.loader}>
                  <div className="content" />
                </Spin>
              )}
              <FileTree projectId={projectId as string} />
            </div>
          )}
          {activeMenu === 'build' && globalWorkspace.sandboxBlockchain && (
            <BuildProject
              projectId={projectId as string}
              onCodeCompile={(_codeBOC) => {}}
              contract={contract}
              updateContract={(contractInstance) => {
                setContract(contractInstance);
              }}
            />
          )}
          {activeMenu === 'test-cases' && (
            <div className={s.testCaseArea}>
              <TestCases projectId={projectId as string} />
            </div>
          )}
        </div>
        <div className={`${s.workArea} onboarding-code-editor`}>
          {isLoaded && (
            <>
              <Split
                className={s.splitVertical}
                minSize={50}
                gutterSize={4}
                sizes={[80, 20]}
                direction="vertical"
                onDragEnd={() => {
                  EventEmitter.emit('ON_SPLIT_DRAG_END', () => {});
                }}
              >
                <div>
                  <div className={s.tabsWrapper}>
                    <Tabs projectId={projectId as string} />
                  </div>

                  <div style={{ height: '100%' }}>
                    {isLoaded && !projectId && !activeFile && (
                      <ProjectTemplate />
                    )}
                    {activeFile && (
                      <Editor
                        file={activeFile as any}
                        projectId={projectId as string}
                      />
                    )}
                  </div>
                </div>
                <div>
                  <BottomPanel />
                </div>
              </Split>
            </>
          )}
        </div>
      </Split>
    </div>
  );
};

export default WorkSpace;
