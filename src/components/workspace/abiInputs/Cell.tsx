import { Cell } from '@ton/core';
import { Form, Input } from 'antd';
import { RuleObject } from 'antd/es/form';

interface Props {
  name?: string;
  placeholder?: string;
  className?: string;
}

const CellInput = ({
  name = 'buffer',
  placeholder = 'HEX or base64 serialized cell',
  className = '',
}: Props) => {
  const rules = [
    { required: true },
    () => ({
      validator(_rule: RuleObject, value: string) {
        if (!value) return Promise.resolve();
        // first try to parse as hex. if fails, try to parse as base64
        try {
          Cell.fromBoc(Buffer.from(value, 'hex'));
        } catch {
          try {
            Cell.fromBase64(value);
          } catch {
            return Promise.reject('Invalid');
          }
        }

        return Promise.resolve();
      },
    }),
  ];
  return (
    <Form.Item name={name} rules={rules} className={className}>
      <Input placeholder={placeholder} />
    </Form.Item>
  );
};

export default CellInput;
