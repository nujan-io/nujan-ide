import AppIcon from '@/components/ui/icon';
import { UserContract, useContractAction } from '@/hooks/contract.hooks';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { LogType } from '@/interfaces/log.interface';
import {
  TactABIField,
  TactInputFields,
  TactType,
} from '@/interfaces/workspace.interface';
import { parseInputs } from '@/utility/abi';
import { MinusCircleOutlined } from '@ant-design/icons';
import { Address, TupleItem } from '@ton/core';
import { SandboxContract } from '@ton/sandbox';
import { Button, Form, Input, Switch } from 'antd';
import { Rule, RuleObject } from 'antd/es/form';
import { useForm } from 'antd/lib/form/Form';
import { FC, Fragment, useState } from 'react';
import { ABIUiProps } from './ABIUi';
import s from './ABIUi.module.scss';

function getValidtionRule(field: TactABIField) {
  let rules: Rule[] = [];
  if (field.type.kind === 'simple') {
    rules = [
      {
        required: !field.type.optional,
      },
      () => ({
        validator(_rule: RuleObject, value: string) {
          if (!value || field.type.kind !== 'simple') return Promise.resolve();
          let pattern = null;
          switch (field.type.type) {
            case 'int':
              pattern = /^-?[0-9]+(\.[0-9]+)?$/;
              break;
            case 'uint':
              pattern = /^[0-9]+(\.[0-9]+)?$/;
              break;
            case 'bool':
              pattern = /^(true|false)$/;
              break;
            case 'address':
              try {
                Address.parse(value);
              } catch {
                return Promise.reject('Invalid Address');
              }
              break;
            case 'string':
              break;
          }
          if (!pattern) return Promise.resolve();
          const result = pattern.test(value);
          if (!result) {
            return Promise.reject(`Invalid ${field.type.type}`);
          }

          return Promise.resolve();
        },
      }),
    ];
  }
  return rules;
}

export const renderField = (
  field: TactABIField,
  prefix: string[] = [],
  level = 0,
) => {
  const name = [...prefix, field.name];

  const fieldKind = field.type.kind;
  const isSwitch = fieldKind === 'simple' && field.type.type === 'bool';

  let inputFieldType = 'dict';
  if (field.type.kind === 'simple') {
    inputFieldType = field.type.type;
    if (field.type.format) {
      inputFieldType += ` : ${field.type.format}`;
    }
  }
  const itemStyle = {
    marginLeft: `${level * 5}px`,
    paddingLeft: '2px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const formListForDict = () => (
    <Form.List name={[...name, 'value']}>
      {(fieldCollection, { add, remove, move }) => (
        <div className={s.fieldList}>
          {fieldCollection.map(({ key, name: fieldName }, index) => {
            return (
              <div key={key} className={s.dictItem}>
                {field.fields?.map((subField, _i) => (
                  <Fragment key={subField.name}>
                    {renderField(
                      subField as TactABIField,
                      [fieldName.toString(), _i === 0 ? '0' : '1'],
                      level + 1,
                    )}
                  </Fragment>
                ))}
                <div className={s.actions}>
                  <Button
                    type="text"
                    onClick={() => {
                      move(index, index - 1);
                    }}
                    disabled={index === 0}
                    icon={<AppIcon name="AngleUp" />}
                  />
                  <Button
                    type="text"
                    onClick={() => {
                      move(index, index + 1);
                    }}
                    disabled={index === fieldCollection.length - 1}
                    icon={<AppIcon name="AngleDown" />}
                  />
                  <Button
                    type="text"
                    danger
                    icon={
                      <MinusCircleOutlined className="dynamic-delete-button" />
                    }
                    onClick={() => {
                      remove(index);
                    }}
                  />
                </div>
              </div>
            );
          })}
          <Button
            className={s.addMoreField}
            type="dashed"
            onClick={() => {
              add();
            }}
          >
            + {field.name}
          </Button>
        </div>
      )}
    </Form.List>
  );

  if (fieldKind === 'dict' && field.fields) {
    return formListForDict();
  } else if (fieldKind === 'simple' && Array.isArray(field.fields)) {
    return (
      <div key={name.join('.')} style={level > 0 ? itemStyle : {}}>
        {level >= 0 && <h3 className={s.structName}>{field.name}</h3>}
        {field.fields.map((subField) => (
          <Fragment key={subField.name}>
            {renderField(
              subField as TactABIField,
              [...prefix, field.name],
              level + 1,
            )}
          </Fragment>
        ))}
        <Form.Item
          name={[...name, '$$type']}
          initialValue={field.type.type}
          noStyle
        >
          <Input type="hidden" />
        </Form.Item>
      </div>
    );
  }

  const getInitialValue = () => {
    if (isSwitch) return false;
    if (field.type.defaultValue !== undefined) {
      return field.type.defaultValue;
    }
    return null;
  };

  return (
    <>
      <Form.Item
        key={name.join('.')}
        label={field.name}
        className={s.formItemABI}
        name={[...name, 'value']}
        initialValue={getInitialValue()}
        noStyle={field.type.defaultValue !== undefined}
        {...(fieldKind === 'simple' && field.type.type === 'bool'
          ? { valuePropName: 'checked' }
          : {})}
        rules={getValidtionRule(field)}
      >
        {isSwitch ? (
          <Switch />
        ) : (
          <Input
            placeholder={inputFieldType}
            type={field.type.defaultValue ? 'hidden' : 'text'}
          />
        )}
      </Form.Item>
      <Form.Item
        key={`${name.join('.')}-type`}
        name={[...name, 'type']}
        initialValue={fieldKind === 'simple' ? field.type.type : 'dict'}
        noStyle
      >
        <Input type="hidden" />
      </Form.Item>
    </>
  );
};

type TactABI = Omit<ABIUiProps, 'abi'> & {
  abi: TactType;
};

const TactABIUi: FC<TactABI> = ({
  abi,
  contractAddress,
  network,
  contract = null,
  type,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { callGetter, callSetter } = useContractAction();
  const { createLog } = useLogActivity();
  const [form] = useForm();

  const getItemHeading = (item: TactType) => {
    if (item.type?.kind === 'simple') {
      if (item.type.type === 'text') {
        return `"${item.name}"`;
      }
    }
    return item.name;
  };

  const hasFormErrors = () => {
    return (
      !form.isFieldsTouched() ||
      form.getFieldsError().some(({ errors }) => errors.length > 0)
    );
  };

  const onSubmit = async (formValues: TactInputFields, fieldName: string) => {
    try {
      const parsedInputsValues = Object.values(await parseInputs(formValues));
      setLoading(fieldName);
      const callableFunction = type === 'Getter' ? callGetter : callSetter;

      const response = await callableFunction(
        contractAddress,
        fieldName,
        contract as SandboxContract<UserContract>,
        'tact',
        '',
        parsedInputsValues as TupleItem[],
        network,
      );

      if (Array.isArray(response)) {
        createLog(JSON.stringify(response));
      } else if (response?.logs) {
        for (const log of response.logs) {
          createLog(
            log,
            response.status ? (response.status as LogType) : 'info',
          );
        }
      } else {
        createLog(JSON.stringify(response));
      }
    } catch (error) {
      if ((error as Error).message.includes('no healthy nodes for')) {
        createLog(
          'No healthy nodes for this network. Redeploy your contract.',
          'error',
        );
        return;
      }
      if (error instanceof Error) {
        createLog(error.message, 'error');
        return;
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`${s.root} ${s.tact} ${s[type]}`}>
      <Form
        key={abi.name}
        form={form}
        className={`${s.form} ${s.nestedForm} app-form`}
        layout="vertical"
        onFinish={(values) => {
          onSubmit(values, abi.name).catch(() => {});
        }}
      >
        <h4 className={s.abiHeading}>{getItemHeading(abi)}:</h4>
        {abi.params.map((field) => (
          <Fragment key={field.name}>
            {renderField(field as TactABIField, [], type === 'Setter' ? -1 : 0)}
          </Fragment>
        ))}
        <Form.Item shouldUpdate noStyle>
          {() => (
            <Button
              className={`${s.btnAction} bordered-gradient`}
              type="default"
              htmlType="submit"
              disabled={abi.params.length > 0 && hasFormErrors()}
              loading={loading === abi.name}
            >
              {type === 'Getter' ? 'Call' : 'Send'}
            </Button>
          )}
        </Form.Item>
      </Form>
    </div>
  );
};

export default TactABIUi;
