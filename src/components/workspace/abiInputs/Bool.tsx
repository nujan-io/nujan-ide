import { Form, Switch } from 'antd';
import { RuleObject } from 'antd/es/form';

interface Props {
  name?: string;
  placeholder: string;
  className?: string;
}

const BoolInput = ({ name = 'b', placeholder, className = '' }: Props) => {
  const rules = [
    // { required: true },
    () => ({
      validator(_rule: RuleObject, value: string) {
        console.log('value', value);
        if (typeof !!value !== 'boolean')
          return Promise.reject('Not a boolean');
        return Promise.resolve();
      },
    }),
  ];
  return (
    <Form.Item
      name={name}
      label={placeholder.split(':')[0]}
      rules={rules}
      className={className}
      valuePropName="checked"
    >
      <Switch />
    </Form.Item>
  );
};

export default BoolInput;
