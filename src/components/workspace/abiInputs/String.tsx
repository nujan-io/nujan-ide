import { Form, Input } from 'antd';
import { RuleObject } from 'antd/es/form';

interface Props {
  name?: string;
  placeholder?: string;
  className?: string;
}

const StringInput = ({
  name = 'abc',
  placeholder = 'abc',
  className = '',
}: Props) => {
  const rules = [
    { required: true },
    () => ({
      validator(_rule: RuleObject, value: string) {
        if (typeof value !== 'string') {
          return Promise.reject('Invalid value');
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

export default StringInput;
