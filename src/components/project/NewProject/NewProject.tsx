import AppIcon from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Radio, Upload, message } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { FC, useState } from 'react';

import { useProjectActions } from '@/hooks/project.hooks';
import s from './NewProject.module.scss';

const NewProject: FC = () => {
  const [isActive, setIsActive] = useState(false);
  const { projects } = useWorkspaceActions();
  const { createProject } = useProjectActions();
  const [isLoading, setIsLoading] = useState(false);

  const [form] = useForm();

  const templatedList = [
    { label: 'Blank Contract', value: 'tonBlank' },
    { label: 'Counter Contract', value: 'tonCounter' },
    { label: 'Import Contract', value: 'import' },
    // { label: 'Chat Bot Contract', value: 'chatBot' },
  ];

  const onFormFinish = async (values: any) => {
    const projectName = values.name;

    try {
      setIsLoading(true);
      if (projects().findIndex((p) => p.name == projectName) >= 0) {
        throw `Project '${projectName}' already exists`;
      }

      createProject(projectName, values.template, values?.file?.file);

      form.resetFields();
      closeModal();
      message.success(`Project '${projectName}' created`);
    } catch (error) {
      let messageText = 'Error in creating project';
      if (typeof error === 'string') {
        messageText = error;
      }
      message.error(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsActive(false);
  };

  return (
    <>
      <div className={`${s.root}`} onClick={() => setIsActive(true)}>
        <span>
          {' '}
          <AppIcon name="Plus" className={s.newIcon} /> <br />
          New Project
        </span>
      </div>
      <Modal open={isActive} onCancel={closeModal} footer={null}>
        <span className={s.title}>New Project</span>
        <Form
          form={form}
          className={s.form}
          layout="vertical"
          onFinish={onFormFinish}
          autoComplete="off"
          initialValues={{ template: 'tonCounter' }}
          requiredMark="optional"
        >
          <Form.Item
            label="Name"
            name="name"
            className={s.formItem}
            rules={[
              { required: true, message: 'Please input your project name!' },
            ]}
          >
            <Input placeholder="Ex. NFT Project" />
          </Form.Item>

          <Form.Item
            label="Select Template"
            name="template"
            className={s.formItem}
          >
            <Radio.Group options={templatedList} optionType="button" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.template !== currentValues.template
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('template') === 'import' ? (
                <div>
                  <Form.Item
                    label="Select contract zip file"
                    name="file"
                    className={s.formItem}
                    rules={[{ required: true }]}
                  >
                    <Upload
                      accept=".zip"
                      multiple={false}
                      maxCount={1}
                      beforeUpload={(file) => {
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Select File</Button>
                    </Upload>
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>

          <Form.Item>
            <Button
              className={s.btnAction}
              loading={isLoading}
              type="primary"
              htmlType="submit"
            >
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NewProject;
