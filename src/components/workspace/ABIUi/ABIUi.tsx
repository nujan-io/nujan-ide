import { UserContract, useContractAction } from '@/hooks/contract.hooks';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import {
  ABIField,
  ABIParameter,
  ContractLanguage,
  NetworkEnvironment,
} from '@/interfaces/workspace.interface';
import { SandboxContract } from '@ton/sandbox';
import { Button, Form, Input, Select } from 'antd';
import { FC, useState } from 'react';
import s from './ABIUi.module.scss';

const { Option } = Select;
interface Props {
  abi: ABIField;
  contractAddress: string;
  network: NetworkEnvironment;
  contract: SandboxContract<UserContract> | null;
  language?: ContractLanguage;
  type: 'Getter' | 'Setter';
}
const ABIUi: FC<Props> = ({
  abi,
  contractAddress,
  network,
  contract = null,
  language = 'func',
  type,
}) => {
  const possiblesTypes = abi.parameters.map((item) => {
    if (['cell', 'slice'].includes(item.type)) {
      return [item.type, 'address'];
    }
    if (typeof item.type === 'string') {
      return [item.type];
    }
    return [(item.type as any).type];
  });

  const [isLoading, setIsLoading] = useState(false);
  const { createLog } = useLogActivity();

  const { callGetter, callSetter } = useContractAction();

  const onSubmit = async (formValues: any) => {
    let stack = Object.values(formValues).map((param: any) => {
      const formField: any = Object.entries(param);
      const { type, value } = formField[0][1];
      if (language === 'tact') {
        return { type, value, name: formField[0][0] };
      } else {
        const { type, value } = Object.values(param)[0] as any;
        return { type: type, value: value };
      }
    });
    try {
      setIsLoading(true);

      const callableFunction = type === 'Getter' ? callGetter : callSetter;

      const response = await callableFunction(
        contractAddress,
        abi.name,
        contract as any,
        language,
        abi?.kind,
        stack as any,
        network,
      );

      if (response?.logs) {
        for (const log of response?.logs) {
          createLog(log, response?.status || 'info');
        }
      } else {
        createLog(JSON.stringify(response));
      }
    } catch (error: any) {
      console.log('error', error);
      if (error.message.includes('no healthy nodes for')) {
        createLog(
          'No healthy nodes for this network. Redeploy your contract.',
          'error',
        );
        return;
      }
      if (error.message.includes('Invalid magic')) {
        createLog('Invalid magic(type)', 'error');
        return;
      }
      createLog(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${s.root} ${s[type]}`}>
      <Form className={`${s.form} app-form`} onFinish={onSubmit}>
        {abi.parameters.map((item: ABIParameter, i: number) => {
          if (item.name === 'queryId') {
            return (
              <Form.Item
                noStyle
                key={i}
                name={[i, item.name, 'type']}
                className={`${s.formItemABI} ${s.formItemType}}`}
                rules={[{ message: 'Please select type' }]}
              >
                <Input type="hidden" value={0} />
              </Form.Item>
            );
          }
          return (
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
                <Input
                  placeholder={`${item.name}: ${
                    typeof item.type === 'string'
                      ? item.type
                      : (item.type as any).type
                  }`}
                />
              </Form.Item>
            </div>
          );
        })}

        <Button
          className={`${s.btnAction} bordered-gradient`}
          type="default"
          htmlType="submit"
          loading={isLoading}
        >
          {abi.name || '-- fallback method --'}
        </Button>
      </Form>
    </div>
  );
};

export default ABIUi;
