import AppIcon from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { MinusCircleOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Switch } from 'antd';
import { FormInstance } from 'antd/lib/form/Form';
import { FC, useEffect, useState } from 'react';
import OpenFile from '../OpenFile';
import s from './BuildProject.module.scss';

interface Props {
  info: string;
  projectId: string;
  type: 'deploy' | 'setter';
  form: FormInstance;
}

const { Option } = Select;

export const CellBuilderDataTypes = {
  Boolean: {
    type: 'Boolean',
    cellValue: 'storeBit(__)',
    value: 'true/false',
  },
  Uint: {
    type: 'Uint',
    cellValue: 'storeUint(__)',
    value: 'value, bits',
  },
  Int: {
    type: 'Int',
    cellValue: 'storeInt(__)',
    value: 'value, bits',
  },
  Coins: {
    type: 'Coins',
    cellValue: 'storeCoins(toNano(__))',
    value: 'in ton',
  },
  Address: {
    type: 'Address',
    cellValue: 'storeAddress(address("__"))',
    value: 'string',
  },
};

interface CellValues {
  type: string;
  value: string;
}

export const generateCellCode = (cellValues: CellValues[]) => {
  const cellCode = cellValues.reduce((code: string, cellValue: CellValues) => {
    const cellType = (CellBuilderDataTypes as any)[cellValue.type];
    const cellValueCode = cellType.cellValue.replace('__', cellValue.value);
    return code + '.' + cellValueCode;
  }, '');

  return `import { beginCell, address, toNano } from "@ton/core";

    const cell = beginCell()
           ${cellCode}
          .endCell();
    
    export default cell;`;
};

const CellBuilder: FC<Props> = ({ info, projectId, type, form }) => {
  const { project } = useWorkspaceActions();
  const [isCellBuilder, setIsCellBuilder] = useState(false);

  const activeProject = project(projectId);

  const getPlaceHolder = (key: number) => {
    return (
      (CellBuilderDataTypes as any)[form.getFieldValue('cell')[key]?.type]
        ?.value || 'value'
    );
  };

  useEffect(() => {
    form.setFieldsValue({
      cell: activeProject?.cellABI?.[type],
    });
  }, [isCellBuilder]);

  return (
    <div className={s.cellBuilder}>
      <p className={s.info}>
        - {info}
        <OpenFile
          projectId={projectId}
          name={type === 'deploy' ? 'stateInit.cell.ts' : 'message.cell.ts'}
          path={type === 'deploy' ? 'stateInit.cell.ts' : 'message.cell.ts'}
        />{' '}
        or use <b>{`"Cell Builder"`}</b>{' '}
        {type === 'deploy' && ' to send message'}
      </p>
      <Form.Item label="Use Cell Builder" valuePropName="checked">
        <Switch
          checked={isCellBuilder}
          onChange={(e) => {
            setIsCellBuilder(e);
          }}
        />
      </Form.Item>
      {isCellBuilder && (
        <Form.List name="cell">
          {(fields, { add, remove, move }, { errors }) => {
            return (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Form.Item
                    required={false}
                    key={key}
                    className={s.fieldGroup}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'type']}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                        },
                      ]}
                      noStyle
                    >
                      <Select placeholder="Data Type">
                        {Object.values(CellBuilderDataTypes).map(
                          (dataType, key) => (
                            <Option value={dataType.type} key={key}>
                              {dataType.type}
                            </Option>
                          )
                        )}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, next) => {
                        return true;
                      }}
                    >
                      {({ getFieldValue }) => {
                        return getFieldValue(['cell', index]) ? (
                          <Form.Item
                            {...restField}
                            name={[name, 'value']}
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                              {
                                required: true,
                                message: 'Please input value',
                              },
                            ]}
                            noStyle
                          >
                            <Input placeholder={getPlaceHolder(index)} />
                          </Form.Item>
                        ) : null;
                      }}
                    </Form.Item>
                    <div className={s.cellActions}>
                      <Button
                        type="text"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                        icon={<AppIcon name="AngleUp" />}
                      />
                      <Button
                        type="text"
                        onClick={() => move(index, index + 1)}
                        disabled={index === fields.length - 1}
                        icon={<AppIcon name="AngleDown" />}
                      />
                      <Button
                        type="text"
                        danger
                        icon={
                          <MinusCircleOutlined className="dynamic-delete-button" />
                        }
                        onClick={() => remove(name)}
                      />
                    </div>
                  </Form.Item>
                ))}
                <Form.Item>
                  <Button
                    className={s.addMoreField}
                    type="dashed"
                    onClick={() => add()}
                    icon={<AppIcon name="Plus" />}
                  >
                    Add field
                  </Button>

                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            );
          }}
        </Form.List>
      )}
    </div>
  );
};

export default CellBuilder;
