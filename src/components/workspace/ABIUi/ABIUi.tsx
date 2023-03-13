import { useContractAction } from '@/hooks/contract.hooks';
import { ABI, ABIParameter } from '@/interfaces/workspace.interface';
import { Button, Form, Input } from 'antd';
import { FC, useState } from 'react';
import s from './ABIUi.module.scss';

interface Props {
  abi: ABI;
  contractAddress: string;
}
const ABIUi: FC<Props> = ({ abi, contractAddress }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  const { callGetter } = useContractAction();

  const onSubmit = async (formValues: any) => {
    let stack = abi.parameters.map((param) => {
      return { type: param.type, value: formValues[param.name] };
    });
    try {
      setIsLoading(true);
      const getterReponse = await callGetter(
        contractAddress,
        abi.name,
        stack as any
      );
      setResponseMessage(getterReponse);
    } catch (error) {
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

        <Button type="default" htmlType="submit" loading={isLoading}>
          {abi.name}
        </Button>
        {responseMessage && (
          <div className={s.abiResponse}>Respose: {responseMessage}</div>
        )}
      </Form>
    </div>
  );
};

export default ABIUi;
