import { UserContract, useContractAction } from '@/hooks/contract.hooks';
import {
  ABI,
  ABIParameter,
  NetworkEnvironment,
} from '@/interfaces/workspace.interface';
import { objectToJSON } from '@/utility/utils';
import { SandboxContract } from '@ton-community/sandbox';
import { Button, Form, Input, message } from 'antd';
import { FC, useState } from 'react';
import { TupleItem } from 'ton-core';
import s from './ABIUi.module.scss';

interface Props {
  abi: ABI;
  contractAddress: string;
  network: NetworkEnvironment;
  contract: SandboxContract<UserContract> | null;
}
const ABIUi: FC<Props> = ({
  abi,
  contractAddress,
  network,
  contract = null,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<TupleItem | null>(
    null
  );

  const { callGetter } = useContractAction();

  const onSubmit = async (formValues: any) => {
    let stack = abi.parameters.map((param) => {
      return { type: param.type, value: formValues[param.name] };
    });
    try {
      setIsLoading(true);
      setResponseMessage(null);

      const getterReponse = await callGetter(
        contractAddress,
        abi.name,
        contract as any,
        stack as any,
        network
      );

      if (getterReponse) {
        setResponseMessage(objectToJSON(getterReponse as any));
      }
    } catch (error: any) {
      if (error.message.includes('no healthy nodes for')) {
        message.error(
          'No healthy nodes for this network. Redeploy your contract.'
        );
      }
      console.log('error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={s.root}>
      <Form className={s.form} onFinish={onSubmit}>
        {abi.parameters.map((item: ABIParameter, i: number) => (
          <Form.Item
            key={i}
            name={item.name}
            className={s.formItemABI}
            rules={[{ required: true }]}
          >
            <Input placeholder={`${item.name}:${item.type}`} />
          </Form.Item>
        ))}

        <Button
          className={s.btnAction}
          type="default"
          htmlType="submit"
          loading={isLoading}
        >
          {abi.name}
        </Button>
        {responseMessage && (
          <div className={s.abiResponse}>{JSON.stringify(responseMessage)}</div>
        )}
      </Form>
    </div>
  );
};

export default ABIUi;
