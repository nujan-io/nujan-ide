import { Form, Input } from 'antd';
import { RuleObject } from 'antd/es/form';

interface Props {
  name?: string;
  placeholder?: string;
  className?: string;
}

const BufferInput = ({
  name = 'buffer',
  placeholder = 'HEX or base64 bytes',
  className = '',
}: Props) => {
  const rules = [
    { required: true },
    () => ({
      validator(_rule: RuleObject, value: string) {
        if (!value) return Promise.resolve();
        // first try to parse as hex. if fails, try to parse as base64
        try {
          Buffer.from(value, 'hex');
        } catch {
          try {
            Buffer.from(value, 'base64');
          } catch {
            return Promise.reject('Invalid Buffer');
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

export default BufferInput;
