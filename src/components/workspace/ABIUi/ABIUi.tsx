import { UserContract, useContractAction } from '@/hooks/contract.hooks';
import {
  ABI,
  ABIParameter,
  NetworkEnvironment,
} from '@/interfaces/workspace.interface';
import { objectToJSON } from '@/utility/utils';
import { SandboxContract } from '@ton-community/sandbox';
import { Button, Form, Input, Select, message } from 'antd';
import { FC, useState } from 'react';
import { TupleItem } from 'ton-core';
import s from './ABIUi.module.scss';

const { Option } = Select;
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
  const possiblesTypes = abi.parameters.map((item) => {
    if (['cell', 'slice'].includes(item.type)) {
      return [item.type, 'address'];
    }
    return [item.type];
  });

  const [isLoading, setIsLoading] = useState(false);

  const [responseMessage, setResponseMessage] = useState<TupleItem | null>(
    null
  );

  const { callGetter } = useContractAction();

  const onSubmit = async (formValues: any) => {
    let stack = Object.values(formValues).map((param: any) => {
      const { type, value } = Object.values(param)[0] as any;
      return { type: type, value: value };
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
      console.log('error', error);
      if (error.message.includes('no healthy nodes for')) {
        message.error(
          'No healthy nodes for this network. Redeploy your contract.'
        );
        return;
      }
      if (error.message.includes('Invalid magic')) {
        message.error('Invalid magic(type)');
        return;
      }
      message.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={s.root}>
      <Form className={s.form} onFinish={onSubmit}>
        {abi.parameters.map((item: ABIParameter, i: number) => (
          <div key={i}>
            <Form.Item
              name={[i, item.name, 'type']}
              className={`${s.formItemABI} ${s.formItemType}}`}
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select placeholder="select type">
                {possiblesTypes[i].map((type, _j) => (
                  <Option key={`${i}-${_j}`} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name={[i, item.name, 'value']}
              className={s.formItemABI}
              rules={[{ required: true, message: 'Please input value' }]}
            >
              <Input placeholder={`${item.name}:${item.type}`} />
            </Form.Item>
          </div>
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
