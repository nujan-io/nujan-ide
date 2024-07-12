import TonAuth from '@/components/auth/TonAuth/TonAuth';
import { UserContract, useContractAction } from '@/hooks/contract.hooks';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import {
  ABIField,
  ABIFieldMessage,
  ABIParameter,
  CellABI,
  InitParams,
  NetworkEnvironment,
  Project,
} from '@/interfaces/workspace.interface';
import { Analytics } from '@/utility/analytics';
import { buildTs } from '@/utility/typescriptHelper';
import { delay, getFileExtension, tonHttpEndpoint } from '@/utility/utils';
import { Network } from '@orbs-network/ton-access';
import { Cell } from '@ton/core';
import { Blockchain, SandboxContract } from '@ton/sandbox';
import { CHAIN, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Form, Select } from 'antd';
import Link from 'next/link';
import React, { FC, useEffect, useRef, useState } from 'react';
import ContractInteraction from '../ContractInteraction';
import ExecuteFile from '../ExecuteFile/ExecuteFile';
import s from './BuildProject.module.scss';

import AppIcon from '@/components/ui/icon';
import { useSettingAction } from '@/hooks/setting.hooks';
import { TonClient } from '@ton/ton';
import { useForm } from 'antd/lib/form/Form';
import packageJson from 'package.json';
import {
  AddressInput,
  AmountInput,
  BoolInput,
  BufferInput,
  CellInput,
  NullInput,
  StringInput,
} from '../abiInputs';
import { globalWorkspace } from '../globalWorkspace';
import CellBuilder, { CellValues, generateCellCode } from './CellBuilder';

const blankABI = {
  getters: [],
  setters: [],
  initParams: [],
};

const fields = (type: string) => {
  if (
    type.includes('int') ||
    type == 'Int' ||
    type == 'bigint | number' ||
    type == 'number | bigint'
  )
    return AmountInput;
  switch (type) {
    case 'Address':
      return AddressInput;
    case 'Bool':
      return BoolInput;
    case 'Buffer':
      return BufferInput;
    case 'bigint':
    case 'number':
      return AmountInput;
    case 'string':
      return StringInput;
    case 'Cell':
    case 'Builder':
    case 'Slice':
      return CellInput;
    case 'null':
      return NullInput;
    default:
      return StringInput;
  }
};

interface Props {
  projectId: string;
  onCodeCompile: (codeBOC: string) => void;
  contract: unknown;
  updateContract: (contractInstance: unknown) => void;
}
const BuildProject: FC<Props> = ({ projectId, contract, updateContract }) => {
  const [isLoading, setIsLoading] = useState('');
  const { createLog } = useLogActivity();
  const [environment, setEnvironment] = useState<NetworkEnvironment>('SANDBOX');
  const [buildOutput, setBuildoutput] = useState<{
    contractBOC: string | null;
    dataCell: Cell | null;
  } | null>(null);
  const cellBuilderRef = useRef<HTMLIFrameElement>(null);
  const [contractABI, setContractABI] = useState<{
    getters: ABIField[];
    setters: ABIField[];
    initParams: InitParams[];
  }>(blankABI);
  const [selectedContract, setSelectedContract] = useState<string | undefined>(
    undefined,
  );

  const { isAutoBuildAndDeployEnabled } = useSettingAction();

  const [tonConnector] = useTonConnectUI();
  const chain = tonConnector.wallet?.account.chain;
  const connectedWalletAddress = useTonAddress();

  const { sandboxBlockchain } = globalWorkspace;
  const tactVersion = packageJson.dependencies['@tact-lang/compiler'].replace(
    '^',
    '',
  );

  const [deployForm] = useForm();

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

  const contractsToDeploy = () => {
    return projectFiles(projectId)
      .filter((f) => {
        const _fileExtension = getFileExtension(f.name || '');
        return (
          f.path?.startsWith('dist') &&
          ['abi'].includes(_fileExtension as string)
        );
      })
      .map((f) => {
        return {
          id: f.id,
          name: f.name
            .replace('.abi', '')
            .replace('tact_', '')
            .replace('func_', ''),
          path: f.path,
        };
      });
  };

  const cellBuilder = (info: string) => {
    if (!activeProject?.language || activeProject.language !== 'func')
      return <></>;
    return (
      <CellBuilder
        form={deployForm}
        info={info}
        projectId={projectId}
        type="deploy"
      />
    );
  };

  const deployView = () => {
    const _contractsToDeploy = contractsToDeploy();

    if (_contractsToDeploy.length === 0) {
      return;
    }

    return (
      <>
        <hr />
        <Form
          className={`${s.form} app-form`}
          form={deployForm}
          onFinish={(values) => {
            initDeploy(values as FormValues).catch(() => {});
          }}
          onValuesChange={(changedValues) => {
            if (Object.hasOwn(changedValues, 'contract')) {
              updateSelectedContract(changedValues.contract);
            }
          }}
        >
          <Form.Item
            name="contract"
            className={s.formItem}
            rules={[{ required: true, message: 'Please select contract' }]}
          >
            <Select
              placeholder="Select a contract"
              className="w-100"
              allowClear
            >
              {_contractsToDeploy.map((f) => (
                <Select.Option key={f.id} value={f.path} title={f.path}>
                  {f.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {cellBuilder('Update initial contract state in ')}
          <div>
            {contractABI.initParams.map((item, index) => {
              if (item.name === 'queryId')
                return <React.Fragment key={index} />;
              const Field = fields(item.type);
              return (
                <Field
                  key={index}
                  className={s.formItem}
                  name={item.name}
                  placeholder={`${item.name}: ${item.type}${
                    item.optional ? '?' : ''
                  }`}
                  rules={[{ required: !item.optional }]}
                />
              );
            })}
          </div>
          <Button
            type="primary"
            htmlType="submit"
            // loading={isLoading == 'deploy'}
            disabled={selectedContract === undefined}
            className="w-100 item-center-align ant-btn-primary-gradient"
          >
            <AppIcon name="Rocket" />
            {activeProject?.contractAddress ? 'Redeploy' : 'Deploy'}
          </Button>
        </Form>
      </>
    );
  };

  interface FormValues {
    [key: string]: string | number | boolean | bigint | undefined;
    queryId?: string;
    cell?: string;
    contract?: string;
  }

  const initDeploy = async (formValues: FormValues) => {
    const _temp = { ...formValues };

    let initParams = '';
    if (_temp.queryId) {
      delete _temp.queryId;
    }
    if (_temp.cell) {
      delete _temp.cell;
    }
    const initParamsData = contractABI.initParams;
    let parametrsType: Record<string, string> = {};
    parametrsType = initParamsData.reduce(
      (acc, curr) => ((acc[curr.name] = curr.type), acc),
      {} as Record<string, string>,
    );

    for (const [key, value] of Object.entries(_temp)) {
      const type = parametrsType[key];
      if (key === 'contract') {
        continue;
      }
      if (
        type.includes('int') ||
        type == 'Int' ||
        type == 'bigint | number' ||
        type == 'number | bigint'
      ) {
        initParams += `BigInt(${value}),`;
        continue;
      }
      switch (type) {
        case 'Address':
          initParams += `window.TonCore.Address.parse('${value}'),`;
          continue;
        case 'Bool':
          initParams += `${!!value},`;
          continue;
        default:
          initParams += `${value},`;
      }
    }
    initParams = initParams.slice(0, -1);
    if (formValues.cell) {
      initParams = formValues.cell;
    }

    try {
      if (!tonConnector.connected && environment !== 'SANDBOX') {
        throw new Error('Please connect wallet');
      }
      if (chain && environment !== 'SANDBOX' && CHAIN[environment] !== chain) {
        throw new Error(`Please connect wallet to ${environment}`);
      }
      setIsLoading('deploy');
      await createStateInitCell(initParams);
    } catch (error) {
      setIsLoading('');
      if (typeof error === 'string') {
        createLog(error, 'error');
        return;
      }
      if (error instanceof Error) {
        createLog(error.message, 'error');
        return;
      }
    }
  };

  const deploy = async () => {
    createLog(`Deploying contract ...`, 'info');
    const contractBOCPath = selectedContract?.replace('.abi', '.code.boc');
    const contractBOC = await getFileByPath(contractBOCPath, projectId);
    if (!contractBOC?.content) {
      throw new Error('Contract BOC is missing. Rebuild the contract.');
    }
    try {
      if (sandboxBlockchain && environment === 'SANDBOX') {
        const blockchain = await Blockchain.create();
        globalWorkspace.sandboxBlockchain = blockchain;

        const wallet = await blockchain.treasury('user');
        globalWorkspace.sandboxWallet = wallet;
        createLog(
          `Sandbox account created. Address: <i>${wallet.address.toString()}</i>`,
          'info',
          false,
        );
      }
      const {
        address: _contractAddress,
        contract,
        logs,
      } = await deployContract(
        contractBOC.content,
        buildOutput?.dataCell as unknown as string,
        environment.toLowerCase() as Network,
        activeProject!,
        contractABI.initParams,
      );

      Analytics.track('Deploy project', {
        platform: 'IDE',
        type: 'TON-func',
        environment: environment.toLowerCase(),
      });
      createLog(
        `Contract deployed on <b><i>${environment}</i></b> <br /> Contract address: ${_contractAddress}}`,
        'success',
      );

      for (let i = 0; i < (logs ?? []).length; i++) {
        if (!logs?.[i]) continue;
        createLog(logs[i], 'info', false);
      }

      if (!_contractAddress) {
        return;
      }
      if (contract) {
        updateContract(contract);
      }

      updateProjectById(
        {
          contractAddress: _contractAddress,
        } as Project,
        projectId,
      );
    } catch (error) {
      console.log(error, 'error');
      const errorMessage = (error as Error).message.split('\n');
      for (const message of errorMessage) {
        createLog(message, 'error', true, true);
      }
    } finally {
      setIsLoading('');
    }
  };

  const createStateInitCell = async (initParams = '') => {
    if (!selectedContract) {
      throw new Error('Please select contract');
    }
    const contractScriptPath = selectedContract.replace('.abi', '.ts');
    if (!cellBuilderRef.current?.contentWindow) return;
    const contractScript = await getFileByPath(contractScriptPath, projectId);
    if (activeProject?.language === 'tact' && !contractScript?.content) {
      throw new Error('Contract script is missing. Rebuild the contract.');
    }

    try {
      let jsOutout = [{ code: '' }];

      if (activeProject?.language == 'tact') {
        jsOutout = await buildTs(
          {
            'tact.ts': contractScript?.content ?? '',
          },
          'tact.ts',
        );
      } else {
        const stateInitContent = await getFileByPath(
          'stateInit.cell.ts',
          projectId,
        );
        let cellCode = '';
        if (stateInitContent && !stateInitContent.content && !initParams) {
          throw new Error(
            'State init data is missing in file stateInit.cell.ts',
          );
        }
        if (initParams) {
          cellCode = generateCellCode(initParams as unknown as CellValues[]);
          updateProjectById(
            {
              cellABI: { deploy: initParams as CellABI },
            } as Project,
            projectId,
          );
        } else {
          cellCode = stateInitContent?.content ?? '';
        }

        jsOutout = await buildTs(
          {
            'stateInit.cell.ts': cellCode,
            'cell.ts': 'import cell from "./stateInit.cell.ts"; cell;',
          },
          'cell.ts',
        );
      }

      const finalJsoutput = fromJSModule(jsOutout[0].code);

      const contractName = extractContractName(selectedContract);

      if (activeProject?.language == 'tact') {
        const _code = `async function main() {
          ${finalJsoutput}
          const contractInit  = await ${contractName}.fromInit(${initParams});
          return contractInit;
        } return main()`;
        //  TODO: Find a better solution may be worker or js sandbox
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const contractInit = await new Function(_code)();
        window.contractInit = contractInit;
        deploy().catch(() => {});
        return;
      }

      cellBuilderRef.current.contentWindow.postMessage(
        {
          name: 'nujan-ton-ide',
          type: 'state-init-data',
          code: finalJsoutput,
          language: activeProject?.language,
          contractName: activeProject?.contractName,
          initParams,
        },
        '*',
      );
    } catch (error) {
      setIsLoading('');
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('object is not defined')) {
        throw new Error('Rebuild contract first');
      }
      if (errorMessage.includes("'default' is not exported by ")) {
        throw new Error("'default' is not exported by stateInit.cell.ts");
      }
      if (errorMessage) {
        createLog(errorMessage, 'error');
        return;
      }
      throw error;
    }
  };

  const isContractInteraction = () => {
    let isValid =
      activeProject?.id && activeProject.contractAddress ? true : false;
    if (environment === 'SANDBOX') {
      isValid = isValid && globalWorkspace.sandboxBlockchain ? true : false;
    }
    return isValid;
  };

  const updateABI = async () => {
    if (!selectedContract) {
      setContractABI(blankABI);
      return;
    }
    const contractABIFile = await getFileByPath(selectedContract, projectId);

    if (!contractABIFile?.content) {
      createLog('Contract ABI is missing. Rebuild the contract.', 'error');
      return;
    }
    const contractABI = JSON.parse(contractABIFile.content || '{}');
    if (
      activeProject?.language === 'tact' &&
      Array.isArray(contractABI?.getters)
    ) {
      contractABI.getters = (contractABI?.getters as ABIField[]).map((item) => {
        return {
          name: item.name,
          parameters:
            item.arguments ??
            [].map((parameter: ABIParameter) => {
              return {
                name: parameter.name,
                type: parameter.type,
                format: parameter.format,
                optional: parameter.optional,
              };
            }),
        };
      });
      const setters: ABIField[] = [];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (contractABI?.receivers as ABIField[])?.forEach((item) => {
        if (!item.message || item.message.type === 'Deploy') {
          return;
        }
        if (item.message.kind) {
          if (item.message.kind !== 'typed') {
            setters.push({
              name: item.message.text,
              parameters: [],
              kind: item.message.kind,
            });
            return;
          }
          const singleItem = contractABI.types.find(
            (type: ABIFieldMessage) =>
              item.message && type.name === item.message.type,
          );

          const singleField: ABIField = {
            name: singleItem.name,
            parameters: singleItem.fields.map(
              (parameter: { type: ABIParameter; name: string }) => {
                return {
                  name: parameter.name,
                  type: parameter.type.type,
                  format: parameter.type.format,
                  optional: parameter.type.optional,
                  kind: item.message ? item.message.kind : undefined,
                };
              },
            ),
          };
          setters.push(singleField);
        }
      });

      contractABI.setters = setters;
    }

    setContractABI({
      getters: contractABI.getters || [],
      setters: contractABI.setters || [],
      initParams: contractABI.initParams || [],
    });
  };

  const getConnectedWallet = () => {
    let _connectedWalletAddress =
      environment === 'SANDBOX' &&
      globalWorkspace.sandboxWallet?.address.toString();

    if (environment !== 'SANDBOX' && connectedWalletAddress) {
      _connectedWalletAddress = connectedWalletAddress;
    }
    if (!_connectedWalletAddress) {
      return <></>;
    }

    return (
      <div className={`${s.connectedWallet} wrap-text`}>
        Connected Wallet: <span>{_connectedWalletAddress}</span>
      </div>
    );
  };

  const updatNetworkEnvironment = (network: NetworkEnvironment) => {
    updateProjectById(
      {
        network,
      } as Project,
      projectId,
    );
    setEnvironment(network);
  };

  const updateSelectedContract = (contract: string) => {
    if (!contract) return;
    setSelectedContract(contract);
    updateProjectById(
      {
        selectedContract: contract,
      } as Project,
      projectId,
    );
  };

  const extractContractName = (currentContractName: string) => {
    return currentContractName
      .replace('dist/', '')
      .replace('.abi', '')
      .replace('tact_', '')
      .replace('func_', '');
  };

  const fromJSModule = (jsModuleCode: string) => {
    return jsModuleCode
      .replace(/^import\s+{/, 'const {')
      .replace(/}\s+from\s.+/, '} = window.TonCore;')
      .replace(/^\s*export\s+\{[^}]*\};\s*/m, '');
  };

  const getSelectedContractJsBuild = async (
    currentContractName: string,
    language: 'tact' | 'func',
    supressErrors = false,
  ) => {
    const contractScriptPath = currentContractName.replace('.abi', '.ts');
    const contractScript = await getFileByPath(contractScriptPath, projectId);
    if (language === 'tact' && !contractScript?.content) {
      if (supressErrors) {
        return;
      }
      throw new Error('Contract script is missing. Rebuild the contract.');
    }

    const jsOutout = await buildTs(
      {
        'tact.ts': contractScript?.content ?? '',
      },
      'tact.ts',
    );

    const finalJsoutput = fromJSModule(jsOutout[0].code);

    return { finalJsoutput };
  };

  const updateContractInstance = async () => {
    if (
      !selectedContract ||
      !activeProject?.contractAddress ||
      activeProject.language !== 'tact' ||
      window.contractInit
    ) {
      return;
    }

    if (activeProject.contractAddress && environment == 'SANDBOX') {
      return;
    }

    const output = await getSelectedContractJsBuild(
      selectedContract,
      'tact',
      true,
    );
    if (!output) return;

    const contractName = extractContractName(selectedContract);

    const _code = `async function main() {
      ${output.finalJsoutput}
      const contractInit  = await ${contractName}.fromAddress(window.TonCore.Address.parse('${activeProject.contractAddress}'));
      return contractInit;
    } return main()`;
    //  TODO: Find a better solution may be worker or js sandbox
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const contractInit = await new Function(_code)();
    window.contractInit = contractInit;

    const endpoint = tonHttpEndpoint({
      network: environment.toLocaleLowerCase() as Network,
    });

    const client = new TonClient({ endpoint });
    const _userContract = client.open(contractInit);
    updateContract(_userContract);
  };

  useEffect(() => {
    updateABI().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContract, contract]);

  useEffect(() => {
    try {
      updateContractInstance().catch(() => {});
    } catch (e) {
      /* empty */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContract]);

  useEffect(() => {
    if (activeProject?.network) {
      setEnvironment(activeProject.network);
    }
    if (activeProject?.selectedContract) {
      setSelectedContract(activeProject.selectedContract);
      deployForm.setFieldsValue({ contract: activeProject.selectedContract });
    }
    const handler = (
      event: MessageEvent<{
        name: string;
        type: string;
        data: { data: Cell } | null;
        error: string;
      }>,
    ) => {
      if (
        typeof event.data !== 'object' ||
        event.data.type !== 'state-init-data' ||
        event.data.name !== 'nujan-ton-ide'
      ) {
        return;
      }
      if (event.data.error) {
        setIsLoading('');
        createLog(event.data.error, 'error');
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setBuildoutput((t: any) => {
        const oldState = typeof t === 'object' ? t : {};
        return {
          ...oldState,
          dataCell: event.data.data ?? '//',
        };
      });
    };

    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
    };
  }, []);

  useEffect(() => {
    if (!buildOutput?.dataCell || !isLoading) {
      return;
    }
    deploy().catch(() => {});
  }, [buildOutput?.dataCell]);

  return (
    <div className={`${s.root} onboarding-build-deploy`}>
      <h3 className={s.heading}>Build & Deploy</h3>
      <iframe
        className={`${s.cellBuilderRef} cell-builder-ref`}
        ref={cellBuilderRef}
        src="/html/tonweb.html"
        sandbox="allow-scripts  allow-same-origin"
      />
      <Form.Item
        label="Environment"
        className={`${s.formItem} select-search-input-dark`}
      >
        <Select
          value={environment}
          onChange={(value) => {
            updatNetworkEnvironment(value as NetworkEnvironment);
          }}
          options={[
            { value: 'SANDBOX', label: 'Sandbox' },
            { value: 'TESTNET', label: 'Testnet' },
            { value: 'MAINNET', label: 'Mainnet' },
          ]}
        />
      </Form.Item>

      {environment !== 'SANDBOX' && <TonAuth />}
      {getConnectedWallet()}

      <div className={s.actionWrapper}>
        <ExecuteFile
          file={currentActiveFile}
          projectId={projectId as string}
          icon="Build"
          label={
            environment === 'SANDBOX' && activeProject?.language !== 'tact'
              ? 'Build'
              : 'Build'
          }
          description={`- Select a contract to build <br /> 
            ${
              isAutoBuildAndDeployEnabled()
                ? '- Auto-build and deploy is enabled for Sandbox and can be changed in settings. <br />'
                : ''
            }
            ${
              activeProject?.language === 'tact' &&
              '<br />- Tact version: ' + tactVersion
            }
            `}
          allowedFile={['fc', 'tact']}
          onCompile={() => {
            if (
              environment == 'SANDBOX' &&
              activeProject?.language === 'tact'
            ) {
              if (!isAutoBuildAndDeployEnabled()) return;
              delay(100)
                .then(() => {
                  deployForm.submit();
                })
                .catch(() => {});
            }
          }}
        />
        {deployView()}
      </div>

      {activeProject?.contractAddress && environment !== 'SANDBOX' && (
        <div className={`${s.contractAddress} wrap`}>
          <Link
            href={`https://${
              chain === CHAIN.TESTNET ? 'testnet.' : ''
            }tonscan.org/address/${activeProject.contractAddress}`}
            target="_blank"
          >
            <AppIcon name="Eye" /> View Deployed Contract
          </Link>
        </div>
      )}

      {isContractInteraction() && (
        <div className={s.contractInteraction}>
          <ContractInteraction
            contractAddress={activeProject?.contractAddress ?? ''}
            projectId={projectId}
            abi={contractABI}
            network={environment}
            contract={contract as SandboxContract<UserContract> | null}
            language={activeProject?.language}
          />
        </div>
      )}
    </div>
  );
};

export default BuildProject;
