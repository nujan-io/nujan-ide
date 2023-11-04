import { Form, Input } from 'antd';
import { RuleObject } from 'antd/es/form';

interface Props {
  name?: string;
  placeholder?: string;
  className?: string;
}

const AmountInput = ({
  name = 'amount',
  placeholder = '123',
  className = '',
}: Props) => {
  const rules = [
    { required: true },
    () => ({
      validator(_rule: RuleObject, value: string) {
        if (!value) return Promise.resolve();
        const pattern = /^[0-9]+(\.[0-9]+)?$/;
        const result = pattern.test(value);
        if (!result) {
          return Promise.reject('Invalid Number');
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

export default AmountInput;
