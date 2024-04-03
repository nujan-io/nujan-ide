import { globalWorkspace } from '@/components/workspace/globalWorkspace';
import {
  ContractLanguage,
  InitParams,
  NetworkEnvironment,
  ParameterType,
  Project,
} from '@/interfaces/workspace.interface';
import { capitalizeFirstLetter, convertToText } from '@/utility/utils';
import { Config, Network } from '@orbs-network/ton-access';
import {
  Address,
  Cell,
  Contract,
  ContractProvider,
  SendMode,
  Sender,
  SenderArguments,
  TupleItem,
  beginCell,
  contractAddress,
  fromNano,
  storeStateInit,
  toNano,
} from '@ton/core';
import {
  SandboxContract,
  SendMessageResult,
  TreasuryContract,
} from '@ton/sandbox';
import { StateInit, TonClient } from '@ton/ton';
import { ITonConnect, SendTransactionRequest } from '@tonconnect/sdk';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { message } from 'antd';
import BN from 'bn.js';
import { useSettingAction } from './setting.hooks';

const getHttpEndpoint = ({ network }: Config) => {
  return `https://${
    network === 'testnet' ? 'testnet.' : ''
  }toncenter.com/api/v2/jsonRPC`;
};

export function useContractAction() {
  const [tonConnector] = useTonConnectUI();
  const { getTonAmountForInteraction } = useSettingAction();
  const tonAmountForInteraction = toNano(getTonAmountForInteraction());

  return {
    deployContract,
    sendMessage,
    callSetter,
    callGetter,
  };
  async function deployContract(
    codeBOC: string,
    dataCell: string,
    network: Network | Partial<NetworkEnvironment>,
    project: Project,
    initParams: InitParams[]
  ): Promise<{
    address: string;
    contract?: SandboxContract<UserContract>;
    logs?: string[];
  }> {
    const { sandboxBlockchain, sandboxWallet } = globalWorkspace;
    let codeCell = Cell.fromBoc(Buffer.from(codeBOC, 'base64'))[0];

    let sender: Sender | null = null;

    let stateInit: StateInit = {};
    if (project.language === 'tact') {
      const _contractInit = (window as any).contractInit;
      stateInit = {
        code: _contractInit.init.code,
        data: _contractInit.init.data,
      };
    } else {
      stateInit = {
        code: codeCell,
        data: Cell.fromBoc(Buffer.from(dataCell, 'base64'))[0],
      };
    }

    let messageParams = {};
    const _contractInit = (window as any).contractInit;
    let _userContract: any = null;

    if (initParams && initParams?.length > 0) {
      const hasQueryId = initParams?.findIndex(
        (item) => item.name == 'queryId'
      );
      const queryId = BigInt(0);
      if (hasQueryId > -1) {
        messageParams = {
          $$type: 'Deploy',
          queryId,
        };
      } else {
        messageParams = {
          $$type: 'Deploy',
        };
      }
    }

    if (project.language === 'tact' && network.toUpperCase() !== 'SANDBOX') {
      sender = new TonConnectSender(tonConnector.connector);
      const endpoint = await getHttpEndpoint({
        network: network?.toLocaleLowerCase() as Network,
      });

      const client = new TonClient({ endpoint });
      _userContract = client.open(_contractInit);
      client;
    } else if (
      network.toUpperCase() === 'SANDBOX' &&
      sandboxBlockchain &&
      project.language === 'tact'
    ) {
      _userContract = sandboxBlockchain.openContract(_contractInit);
      sender = sandboxWallet!!.getSender();
    }

    if (project.language === 'tact') {
      const response = await _userContract.send(
        sender,
        {
          value: tonAmountForInteraction,
        },
        messageParams
      );
      let logMessages: string[] = [];
      if (response) {
        logMessages = terminalLogMessages(
          [response],
          [_userContract as Contract]
        );
      }

      // create a code loop through array and check has error string
      for (let index = 0; index < logMessages.length; index++) {
        const element = logMessages[index];
        if (element.includes('Error')) {
          return {
            address: '',
            contract: _userContract,
            logs: logMessages,
          };
        }
      }

      return {
        address: _userContract.address.toString(),
        contract: _userContract,
        logs: logMessages,
      };
    }

    if (network.toUpperCase() === 'SANDBOX' && sandboxBlockchain) {
      const _userContract = UserContract.createForDeploy(
        stateInit.code as Cell,
        stateInit.data as Cell
      );
      const userContract = sandboxBlockchain.openContract(_userContract);
      const response = await userContract.sendData(
        sandboxWallet!!.getSender(),
        Cell.EMPTY,
        tonAmountForInteraction
      );
      if (network.toUpperCase() !== 'SANDBOX') {
        message.success('Contract Deployed');
      }
      return {
        address: _userContract.address.toString(),
        contract: userContract,
      };
    }

    const _contractAddress = contractAddress(0, stateInit);
    const endpoint = await getHttpEndpoint({
      network: network as Network,
    });

    const client = new TonClient({ endpoint });

    if (await client.isContractDeployed(_contractAddress)) {
      message.error(
        'Contract is already deployed for same codebase and initial state. Update code or initial state.'
      );
      return { address: _contractAddress.toString() };
    }

    let initCell = beginCell().store(storeStateInit(stateInit)).endCell();

    const params: SendTransactionRequest = {
      validUntil: Date.now() + 1000000,
      messages: [
        {
          address: _contractAddress.toString(),
          amount: tonAmountForInteraction.toString(),
          stateInit: initCell.toBoc().toString('base64'),
        },
      ],
    };
    try {
      const deployResponse = await tonConnector.sendTransaction(params);
      message.success('Contract Deployed');

      return { address: _contractAddress.toString() };
    } catch (error) {
      console.log('error', error);
      message.error('Not client');
    } finally {
    }
    return { address: _contractAddress.toString() };
  }

  async function sendMessage(
    dataCell: string,
    contractAddress: string,
    contract: SandboxContract<UserContract> | null = null,
    network: Network | Partial<NetworkEnvironment>,
    wallet: SandboxContract<TreasuryContract>
  ) {
    const _dataCell = Cell.fromBoc(Buffer.from(dataCell as any, 'base64'))[0];
    if (network.toUpperCase() === 'SANDBOX') {
      if (!contract) {
        message.error('Contract is not deployed');
        return;
      }
      const call = await contract.sendData(
        wallet.getSender(),
        _dataCell,
        tonAmountForInteraction
      );
      return;
    }
    try {
      const params: SendTransactionRequest = {
        validUntil: Date.now() + 1000000,
        messages: [
          {
            address: contractAddress,
            amount: tonAmountForInteraction.toString(),
            payload: _dataCell.toBoc().toString('base64'),
          },
        ],
      };

      const response = await tonConnector.sendTransaction(params);
    } catch (error) {
      console.log(error, 'error');
    } finally {
      return '';
    }
  }

  async function callSetter(
    contractAddress: string,
    methodName: string,
    contract: SandboxContract<UserContract> | null = null,
    language: ContractLanguage,
    kind?: string,
    stack?: TupleItem[],
    network?: Network | Partial<NetworkEnvironment>
  ): Promise<{ message: string; logs?: string[] } | undefined> {
    if (language === 'tact' && contract) {
      let sender: Sender | null = null;

      if (network === 'SANDBOX') {
        const { sandboxWallet } = globalWorkspace;
        sender = sandboxWallet!!.getSender();
      } else {
        sender = new TonConnectSender(tonConnector.connector);
      }

      let messageParams: any = {
        $$type: methodName,
      };
      if (kind === 'text') {
        messageParams = methodName || '';
      }
      stack?.forEach((item: any) => {
        switch (item.type) {
          case 'address':
            item.value = Address.parse(item.value);
            break;
          default:
            item.value = BigInt(item.value || 0);
            break;
        }
        messageParams = {
          ...messageParams,
          [item.name]: item.value,
        };
      });

      if (kind === 'empty') {
        messageParams = null;
      }
      if (kind === 'text' && Object.keys(messageParams).length === 0) {
        messageParams = '';
      }

      const response = await (contract as any).send(
        sender,
        { value: tonAmountForInteraction },
        messageParams
      );
      return {
        message: 'Message sent successfully',
        logs: terminalLogMessages([response], [contract as Contract]),
      };
    }
  }

  function parseInt(item: any, language: ContractLanguage) {
    if (language === 'tact') {
      return new BN(item.value.toString());
    }
    return BigInt((item as any).value);
  }

  async function callGetter(
    contractAddress: string,
    methodName: string,
    contract: SandboxContract<UserContract> | null = null,
    language: ContractLanguage,
    kind?: string,
    stack?: TupleItem[] | any,
    network?: Network | Partial<NetworkEnvironment>
  ): Promise<{ message: string; logs?: string[] } | undefined | any> {
    const parsedStack = stack?.map((item: any) => {
      switch (item.type as ParameterType) {
        case 'int':
          return {
            type: item.type,
            value: parseInt(item, language),
          };
        case 'address':
          return {
            type: 'slice',
            cell: beginCell()
              .storeAddress(Address.parse((item as any).value))
              .endCell(),
          };
        case 'bool':
          return {
            type: item.type,
            value: item.value === 'true',
          };
        default:
          return {
            type: item.type,
            value: Cell.fromBoc(
              Buffer.from((item as any).value.toString(), 'base64')
            )[0],
          };
      }
    });
    if (network === 'SANDBOX' && contract) {
      let responseValues = [];
      if (language === 'tact') {
        // convert getter function name as per script function name. Ex. counter will become getCounter
        const params = parsedStack?.map((item: any) => {
          switch (item.type) {
            case 'int':
              return item.value as any;
            default:
              return item.value;
          }
        });
        const _method = ('get' + capitalizeFirstLetter(methodName)) as any;
        const response = await (contract as any)[_method](...(params as any));
        responseValues.push({
          method: methodName,
          value: convertToText(response),
        });
      } else {
        const call = await contract.getData(methodName, parsedStack as any);
        while (call.stack.remaining) {
          responseValues.push(parseReponse(call.stack.pop()));
        }
      }
      return responseValues;
    }

    const endpoint = await getHttpEndpoint({
      network: network?.toLocaleLowerCase() as Network,
    });
    const client = new TonClient({ endpoint });
    const call = await client.runMethod(
      Address.parse(contractAddress),
      methodName,
      stack
    );

    const responseValues = [];
    while (call.stack.remaining) {
      responseValues.push(parseReponse(call.stack.pop()));
    }
    return responseValues;
  }
}

export class UserContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createForDeploy(code: Cell, data: Cell) {
    const workchain = 0;
    const address = contractAddress(workchain, { code, data });
    return new UserContract(address, { code, data });
  }

  async sendData(
    provider: ContractProvider,
    via: Sender,
    body: Cell = Cell.EMPTY,
    amount: bigint
  ) {
    await provider.internal(via, {
      value: amount,
      bounce: false,
      body,
    });
  }

  async getData(
    provider: ContractProvider,
    methodName: string,
    stackInput: TupleItem[] = []
  ) {
    return provider.get(methodName, stackInput);
  }
}

function parseReponse(tupleItem: TupleItem) {
  if (tupleItem.type === 'null') return;

  if (['cell', 'slice', 'builder'].includes(tupleItem.type)) {
    const cell = (tupleItem as any).cell as Cell;
    try {
      if (cell.bits.length === 267) {
        return {
          type: 'address',
          value: cell.beginParse().loadAddress().toString(),
        };
      }
      return {
        type: 'base64',
        value: cell.toBoc().toString('base64'),
      };
    } catch (e) {
      console.log(e);
      // Ignore
    }
  } else if (tupleItem.type === 'int') {
    return { type: 'int', value: (tupleItem as any).value.toString() };
  } else {
    return { type: 'raw', value: String((tupleItem as any).value) };
  }
}

class TonConnectSender implements Sender {
  public provider: ITonConnect;
  readonly address?: Address;

  constructor(provider: ITonConnect) {
    this.provider = provider;
    if (provider.wallet)
      this.address = Address.parse(provider.wallet?.account.address);
    else this.address = undefined;
  }

  async send(args: SenderArguments): Promise<void> {
    if (
      !(
        args.sendMode === undefined ||
        args.sendMode == SendMode.PAY_GAS_SEPARATELY
      )
    ) {
      throw new Error(
        'Deployer sender does not support `sendMode` other than `PAY_GAS_SEPARATELY`'
      );
    }

    await this.provider.sendTransaction({
      validUntil: Date.now() + 5 * 60 * 1000,
      messages: [
        {
          address: args.to.toString(),
          amount: args.value.toString(),
          payload: args.body?.toBoc().toString('base64'),
          stateInit: args.init
            ? beginCell()
                .storeWritable(storeStateInit(args.init))
                .endCell()
                .toBoc()
                .toString('base64')
            : undefined,
        },
      ],
    });
  }
}

// Credit for below log message parsing: https://github.com/tact-lang/tact-by-example/blob/main/src/routes/(examples)/%2Blayout.svelte
function terminalLogMessages(
  results: SendMessageResult[] = [],
  contractInstances: Contract[]
) {
  const messages = [];
  for (const result of results) {
    for (const transaction of result.transactions) {
      if (
        transaction.inMessage?.info.type == 'internal' ||
        transaction.inMessage?.info.type == 'external-in'
      ) {
        if (transaction.inMessage?.info.type == 'internal') {
          if (transaction.debugLogs) {
            const splittedLog = transaction.debugLogs.split('\n');
            for (let i = 0; i < splittedLog.length; i++) {
              messages.push(splittedLog[i]);
            }
          }
          if (transaction.description.type == 'generic') {
            if (transaction.description.computePhase.type == 'vm') {
              // get the computational result of the transaction
              const compute = transaction.description.computePhase;
              if (compute.exitCode == 4294967282) compute.exitCode = -14;
              messages.push(
                `Transaction Executed: ${
                  compute.success ? 'success' : 'error'
                }, ` +
                  `Exit Code: ${compute.exitCode}, Gas: ${shorten(
                    compute.gasFees,
                    'coins'
                  )}`
              );
              let foundError = false;
              for (const contractInstance of contractInstances) {
                if (
                  transaction.inMessage?.info.dest.equals(
                    contractInstance.address
                  )
                ) {
                  if (compute.exitCode == -14) compute.exitCode = 13;
                  const message =
                    contractInstance?.abi?.errors?.[compute.exitCode]?.message;
                  if (message) {
                    messages.push(`🔴 Error message: ${message}\n`);
                    foundError = true;
                  }
                }
              }
              if (!foundError) {
                const knownErrors: { [code: number]: { message: string } } = {
                  [-14]: { message: `Out of gas error` },
                  2: { message: `Stack undeflow` },
                  3: { message: `Stack overflow` },
                  4: { message: `Integer overflow` },
                  5: { message: `Integer out of expected range` },
                  6: { message: `Invalid opcode` },
                  7: { message: `Type check error` },
                  8: { message: `Cell overflow` },
                  9: { message: `Cell underflow` },
                  10: { message: `Dictionary error` },
                  13: { message: `Out of gas error` },
                  32: { message: `Method ID not found` },
                  34: { message: `Action is invalid or not supported` },
                  37: { message: `Not enough TON` },
                  38: { message: `Not enough extra-currencies` },
                  128: { message: `Null reference exception` },
                  129: { message: `Invalid serialization prefix` },
                  130: { message: `Invalid incoming message` },
                  131: { message: `Constraints error` },
                  132: { message: `Access denied` },
                  133: { message: `Contract stopped` },
                  134: { message: `Invalid argument` },
                  135: { message: `Code of a contract was not found` },
                  136: { message: `Invalid address` },
                  137: {
                    message: `Masterchain support is not enabled for this contract`,
                  },
                };
                const message = knownErrors[compute.exitCode]?.message;
                if (message) {
                  messages.push(`Error message: ${message}`);
                  foundError = true;
                }
              }
            }
          }
        }
        for (let i = 0; i < transaction.outMessagesCount; i++) {
          const outMessage = transaction.outMessages.get(i);
          if (outMessage?.info.type == 'external-out') {
            if (outMessage.info.dest == null) {
              const name = messageName(outMessage.body, contractInstances);
              messages.push(
                `Log emitted: ${name}, from ${shorten(outMessage.info.src)}`
              );
            }
          }
        }
        for (const event of transaction.events) {
          if (event.type == 'message_sent') {
            const name = messageName(event.body, contractInstances);
            messages.push(
              `Message sent: ${name}, from ${shorten(event.from)}, to ${shorten(
                event.to
              )}, ` +
                `value ${shorten(event.value, 'coins')}, ${
                  event.bounced ? '' : 'not '
                }bounced`
            );
          }
        }
      }
    }
  }
  return messages;
}

function messageName(body: Cell, contractInstances: Contract[]): string {
  try {
    const slice = body.beginParse();
    let op = slice.loadInt(32);
    if (op == 0) {
      return `"${slice.loadStringTail()}"`;
    }
    if (op < 0) op += 4294967296;
    for (const contractInstance of contractInstances) {
      for (const type of contractInstance?.abi?.types ?? []) {
        if (op == type.header) return type.name;
      }
    }
    if (op == 0xffffffff) {
      return 'error';
    }
    return `unknown (0x${op.toString(16)})`;
  } catch (e) {}
  return 'empty';
}

function shorten(
  long: Address | bigint,
  format: 'default' | 'coins' = 'default'
) {
  if (long instanceof Address) {
    return `${long.toString().slice(0, 4)}..${long.toString().slice(-4)}`;
  }
  if (typeof long == 'bigint') {
    if (format == 'default') return long.toString();
    if (format == 'coins') return fromNano(long);
  }
}
