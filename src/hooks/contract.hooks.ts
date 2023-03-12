import { AppConfig } from '@/config/AppConfig';
import { getHttpEndpoint, Network } from '@orbs-network/ton-access';
import { SendTransactionRequest } from '@tonconnect/sdk';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { message } from 'antd';
import { StateInit, TonClient } from 'ton';
import {
  beginCell,
  Cell,
  contractAddress,
  storeStateInit,
  toNano,
} from 'ton-core';

export function useContractAction() {
  const [tonConnector] = useTonConnectUI();

  return {
    deployContract,
    sendMessage,
  };
  async function deployContract(codeBOC: string, dataCell: any) {
    console.log('codeBOC', codeBOC, dataCell);
    let codeCell = Cell.fromBoc(Buffer.from(codeBOC, 'base64'))[0];

    // Amount to send to contract. Gas fee
    const value = toNano('0.002');

    const stateInit: StateInit = {
      code: codeCell,
      data: Cell.fromBoc(Buffer.from(dataCell as any, 'base64'))[0],
    };
    const _contractAddress = contractAddress(0, stateInit);
    console.log('_contractAddress', _contractAddress);
    const endpoint = await getHttpEndpoint({
      network: AppConfig.network as Network,
    });

    const client = new TonClient({ endpoint });

    if (await client.isContractDeployed(_contractAddress)) {
      message.error(
        'Contract is already deployed for same codebase and initial state. Update code or initial state.'
      );
      return _contractAddress.toString();
    }

    let initCell = beginCell().store(storeStateInit(stateInit)).endCell();

    const params: SendTransactionRequest = {
      validUntil: Date.now() + 1000000,
      messages: [
        {
          address: _contractAddress.toString(),
          amount: value.toString(),
          stateInit: initCell.toBoc().toString('base64'),
        },
      ],
    };
    try {
      const deployResponse = await tonConnector.sendTransaction(params);
      message.success('Contract Deployed');

      return _contractAddress.toString();
    } catch (error) {
      message.error('Not client');
    } finally {
    }
    return '';
  }

  async function sendMessage(dataCell: number, contractAddress: string) {
    const messageBody = Cell.fromBoc(Buffer.from(dataCell as any, 'base64'))[0];
    try {
      const params: SendTransactionRequest = {
        validUntil: Date.now() + 1000000,
        messages: [
          {
            address: contractAddress,
            amount: toNano('0.02').toString(),
            payload: messageBody.toBoc().toString('base64'),
          },
        ],
      };

      const response = await tonConnector.sendTransaction(params);
      console.log('sendMessage', response);
    } catch (error) {
      console.log(error, 'error');
    } finally {
      return '';
    }
  }
}
