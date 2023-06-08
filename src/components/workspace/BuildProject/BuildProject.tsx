import TonAuth from '@/components/auth/TonAuth/TonAuth';
import { useContractAction } from '@/hooks/contract.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { NetworkEnvironment } from '@/interfaces/workspace.interface';
import { buildTs } from '@/utility/typescriptHelper';
import { Network } from '@orbs-network/ton-access';
import {
  Blockchain,
  SandboxContract,
  TreasuryContract,
} from '@ton-community/sandbox';
import { CHAIN, useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Form, Select, message } from 'antd';
import Link from 'next/link';
import { FC, useEffect, useRef, useState } from 'react';
import { Cell } from 'ton-core';
import ContractInteraction from '../ContractInteraction';
import ExecuteFile from '../ExecuteFile/ExecuteFile';
import s from './BuildProject.module.scss';
interface Props {
  projectId: string;
  onCodeCompile: (codeBOC: string) => void;
}
const BuildProject: FC<Props> = ({ projectId, onCodeCompile }) => {
  const [isLoading, setIsLoading] = useState('');
  const [environment, setEnvironment] = useState<NetworkEnvironment>('SANDBOX');
  const [buildOutput, setBuildoutput] = useState<{
    contractBOC: string | null;
    dataCell: Cell | null;
  } | null>(null);
  const cellBuilderRef = useRef<HTMLIFrameElement>(null);
  const [tonConnector] = useTonConnectUI();
  const chain = tonConnector.wallet?.account.chain;
  const [sandboxBlockchain, setSandboxBlockchain] = useState<Blockchain | null>(
    null
  );
  const [contract, setContract] = useState<any>('');
  const [sandboxWallet, setSandboxWallet] =
    useState<SandboxContract<TreasuryContract>>();

  const { Option } = Select;

  const {
    projectFiles,
    getFileByPath,
    updateProjectById,
    project,
    activeFile,
  } = useWorkspaceActions();

  const currentActiveFile = activeFile(projectId as string);

  const { deployContract } = useContractAction();

  const activeProject = project(projectId);

  const initDeploy = async () => {
    try {
      if (!tonConnector.connected && environment !== 'SANDBOX') {
        throw 'Please connect wallet';
      }
      if (chain && environment !== 'SANDBOX' && CHAIN[environment] !== chain) {
        throw `Please connect wallet to ${environment}`;
      }
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
      const { address: _contractAddress, contract } = await deployContract(
        activeProject?.contractBOC as string,
        buildOutput?.dataCell as any,
        environment.toLowerCase() as Network,
        sandboxBlockchain,
        sandboxWallet!!
      );
      if (!_contractAddress) {
        return;
      }
      if (contract) {
        setContract(contract);
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
      throw 'State init data is missing in file stateInit.cell.ts';
    }
    if (!stateInitContent?.content?.includes('cell')) {
      throw 'cell variable is missing in file stateInit.cell.ts';
    }
    try {
      const jsOutout = await buildTs(
        {
          'stateInit.cell.ts': stateInitContent?.content,
          'cell.ts': 'import cell from "./stateInit.cell.ts"; cell;',
        },
        'cell.ts'
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
    } catch (error: any) {
      if (error.message.includes("'default' is not exported by ")) {
        throw "'default' is not exported by stateInit.cell.ts";
      }
      message.error('Something went wrong. Check browser console for details.');
      throw error;
    }
  };

  const createSandbox = async () => {
    const blockchain = await Blockchain.create();
    const wallet = await blockchain.treasury('user');
    setSandboxWallet(wallet);
    setSandboxBlockchain(blockchain);
  };

  useEffect(() => {
    if (environment === 'SANDBOX') {
      createSandbox();
    }
  }, []);

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
    if (!buildOutput?.dataCell || !isLoading) return;
    deploy();
  }, [buildOutput?.dataCell]);

  return (
    <div className={s.root}>
      <h3 className={s.heading}>Build & Deploy</h3>
      <iframe
        className={s.cellBuilderRef}
        ref={cellBuilderRef}
        src="/html/tonweb.html"
        sandbox="allow-scripts"
      />
      <Form.Item label="Environment" className={s.formItem}>
        <Select
          defaultValue="SANDBOX"
          onChange={(value) => setEnvironment(value as NetworkEnvironment)}
          options={[
            { value: 'SANDBOX', label: 'Sandbox' },
            { value: 'TESTNET', label: 'Testnet' },
            { value: 'MAINNET', label: 'Mainnet' },
          ]}
        />
      </Form.Item>

      {environment !== 'SANDBOX' && <TonAuth />}

      <div className={s.actionWrapper}>
        <ExecuteFile
          file={currentActiveFile}
          projectId={projectId as string}
          label={environment === 'SANDBOX' ? 'Run' : 'Build'}
          onCompile={() => {
            if (environment == 'SANDBOX') {
              initDeploy();
            }
          }}
        />
        {environment !== 'SANDBOX' && (
          <Button
            type="primary"
            loading={isLoading == 'deploy'}
            onClick={initDeploy}
            disabled={!currentActiveFile || !activeProject?.contractBOC}
          >
            Deploy
          </Button>
        )}
      </div>
      {!activeProject?.contractBOC && (
        <p className={s.info}>Build your contract before deploy</p>
      )}

      {activeProject?.contractAddress!! && environment !== 'SANDBOX' && (
        <div className={`${s.contractAddress} wrap`}>
          <Link
            href={`https://${
              chain === CHAIN.TESTNET ? 'testnet.' : ''
            }tonscan.org/address/${activeProject?.contractAddress}`}
            target="_blank"
          >
            View Deployed Contract
          </Link>
        </div>
      )}

      {activeProject?.id && tonConnector && activeProject?.contractAddress && (
        <div className={s.contractInteraction}>
          <ContractInteraction
            contractAddress={activeProject?.contractAddress!!}
            projectId={projectId}
            abi={activeProject?.abi || []}
            network={environment}
            contract={contract}
            wallet={sandboxWallet!!}
          />
        </div>
      )}
    </div>
  );
};

export default BuildProject;
