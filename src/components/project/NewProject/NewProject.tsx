import AppIcon from '@/components/ui/icon';
import { useProjectServiceActions } from '@/hooks/ProjectService.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Button, Form, Input, message, Modal, Radio } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { FC, useState } from 'react';
import s from './NewProject.module.scss';

const NewProject: FC = () => {
  const [isActive, setIsActive] = useState(false);
  const { createNewProject } = useWorkspaceActions();
  const projectServiceAction = useProjectServiceActions();
  const [isLoading, setIsLoading] = useState(false);

  const [form] = useForm();

  const templatedList = [
    { label: 'Blank Contract', value: 'tonBlank' },
    { label: 'Counter Contract', value: 'tonCounter' },
    { label: 'Chat Bot Contract', value: 'chatBot' },
  ];

  const onFormFinish = async (values: any) => {
    try {
      setIsLoading(true);
      const response = await projectServiceAction.createProject({
        name: values.name,
        template: values.template,
        action: 'create-project',
      } as any);
      const { project, projectFiles } = response.data.data;
      createNewProject({ ...project }, projectFiles);
      form.resetFields();
      closeModal();
      message.success(`Project '${values.name}' created`);
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
