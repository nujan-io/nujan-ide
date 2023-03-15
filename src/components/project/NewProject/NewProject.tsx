import AppIcon from '@/components/ui/icon';
import { ProjectTemplate } from '@/constant/ProjectTemplate';
import { useProjectServiceActions } from '@/hooks/ProjectService.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Tree } from '@/interfaces/workspace.interface';
import { Button, Form, Input, Modal, Radio } from 'antd';
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
    { label: 'New Contract', value: 'tonBlank' },
    { label: 'Counter Contract', value: 'tonCounter' },
    { label: 'Chat Bot Contract', value: 'chatBot' },
  ];

  const onFormFinish = async (values: any) => {
    const template: Tree[] = (
      ProjectTemplate[values.template as 'tonBlank' | 'tonCounter'] as any
    )['func'];
    try {
      setIsLoading(true);
      const response = await projectServiceAction.createProject({
        name: values.name,
        template: values.template,
      });
      const data = response.data.data;
      createNewProject({ ...data }, template);
      form.resetFields();
      closeModal();
    } catch (error) {
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

          <Form.Item wrapperCol={{ offset: 10, span: 16 }}>
            <Button loading={isLoading} type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NewProject;
