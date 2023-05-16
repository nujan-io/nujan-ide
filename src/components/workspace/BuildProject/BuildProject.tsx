import { useContractAction } from '@/hooks/contract.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { ABI, Tree } from '@/interfaces/workspace.interface';
import { buildTs } from '@/utility/typescriptHelper';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Select, message } from 'antd';
import Link from 'next/link';
import { FC, useEffect, useRef, useState } from 'react';
import { Cell } from 'ton-core';
import ContractInteraction from '../ContractInteraction';
import s from './BuildProject.module.scss';

interface Props {
  projectId: string;
  onCodeCompile: (codeBOC: string) => void;
}
const BuildProject: FC<Props> = ({ projectId, onCodeCompile }) => {
  const [isLoading, setIsLoading] = useState('');
  const [buildOutput, setBuildoutput] = useState<{
    contractBOC: string | null;
    dataCell: Cell | null;
  } | null>(null);
  const [abi, setABI] = useState<ABI[]>([]);
  const cellBuilderRef = useRef<HTMLIFrameElement>(null);
  const [tonConnector] = useTonConnectUI();

  const { Option } = Select;

  const {
    projectFiles,
    getFileByPath,
    getFileContent,
    updateProjectById,
    project,
  } = useWorkspaceActions();
  const { deployContract } = useContractAction();

  const activeProject = project(projectId);

  const onFormFinish = async ({ fileId }: { fileId: Tree['id'] }) => {
    const file = getProjectFiles().find((f) => f.id === fileId);
    setBuildoutput(null);
    if (!file?.id) {
      message.error('File not found');
      return;
    }
    setIsLoading('build');
  };

  const initDeploy = async () => {
    try {
      setIsLoading('deploy');
      await createStateInitCell();
    } catch (error: any) {
      console.log(error);
      setIsLoading('');
      if (typeof error === 'string') {
        message.error(error);
        return;
      }
    } finally {
    }
  };

  const deploy = async () => {
    try {
      const _contractAddress = await deployContract(
        activeProject?.contractBOC as string,
        buildOutput?.dataCell as any
      );
      if (!_contractAddress) {
        return;
      }

      updateProjectById(
        {
          contractAddress: _contractAddress,
        },
        projectId
      );
    } catch (error: any) {
      console.log(error);
    } finally {
      setIsLoading('');
    }
  };

  const createStateInitCell = async () => {
    if (!cellBuilderRef.current?.contentWindow) return;
    const stateInitContent = await getFileByPath(
      'stateInit.cell.ts',
      projectId
    );
    if (stateInitContent && !stateInitContent.content) {
      throw 'State init data is missing in file stateInit.cell.js';
    }
    if (!stateInitContent?.content?.includes('cell')) {
      throw 'cell variable is missing in file stateInit.cell.ts';
    }
    const jsOutout = await buildTs(
      { 'stateInit.cell.ts': stateInitContent?.content },
      'stateInit.cell.ts'
    );

    const finalJsoutput = jsOutout[0].code
      .replace(/^import\s+{/, 'const {')
      .replace(/}\s+from\s.+/, '} = window.TonCore;');

    cellBuilderRef.current.contentWindow.postMessage(
      {
        name: 'nujan-ton-ide',
        type: 'state-init-data',
        code: finalJsoutput,
      },
      '*'
    );
  };

  const getProjectFiles = () => {
    const _projectFiles = projectFiles(projectId);
    let files: Tree[] = [];
    if (!_projectFiles) {
      return [];
    }

    files = _projectFiles.filter(
      (file) =>
        file.type !== 'directory' &&
        /^(contracts\/\w+.fc)$/.test(file.path || '')
    );

    return files;
  };

  useEffect(() => {
    const handler = (
      event: MessageEvent<{ name: string; type: string; data: any }>
    ) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data?.type !== 'state-init-data' ||
        event.data?.name !== 'nujan-ton-ide'
      ) {
        return;
      }

      setBuildoutput((t: any) => {
        return {
          ...t,
          dataCell: event.data.data,
        };
      });
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    if (!buildOutput?.dataCell) return;
    deploy();
  }, [buildOutput?.dataCell]);

  return (
    <div className={s.root}>
      <h3 className={s.heading}>Deploy</h3>
      <iframe
        className={s.cellBuilderRef}
        ref={cellBuilderRef}
        src="/html/tonweb.html"
        sandbox="allow-scripts"
      />

      {activeProject?.contractAddress!! && (
        <div className={`${s.contractAddress} wrap`}>
          <Link
            href={`https://testnet.tonscan.org/address/${activeProject?.contractAddress}`}
            target="_blank"
          >
            View Deployed Contract
          </Link>
        </div>
      )}

      <Button
        type="primary"
        loading={isLoading == 'deploy'}
        onClick={initDeploy}
        disabled={!activeProject?.contractBOC}
      >
        Deploy
      </Button>
      {!activeProject?.contractBOC && (
        <p className={s.info}>Build your contract before deploy</p>
      )}
      <br />
      <br />

      {activeProject?.id && tonConnector && activeProject?.contractAddress && (
        <div className={s.contractInteraction}>
          <ContractInteraction
            contractAddress={activeProject?.contractAddress!!}
            projectId={projectId}
            abi={activeProject?.abi || []}
          />
        </div>
      )}
    </div>
  );
};

export default BuildProject;
