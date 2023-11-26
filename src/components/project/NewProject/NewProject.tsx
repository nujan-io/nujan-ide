import AppIcon, { AppIconType } from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Button, Form, Input, Modal, Radio, Upload, message } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { FC, useEffect, useState } from 'react';

import { Tooltip } from '@/components/ui';
import { useProjectActions } from '@/hooks/project.hooks';
import { Tree } from '@/interfaces/workspace.interface';
import { Analytics } from '@/utility/analytics';
import EventEmitter from '@/utility/eventEmitter';
import { downloadRepo } from '@/utility/gitRepoDownloader';
import { useRouter } from 'next/router';
import s from './NewProject.module.scss';

interface Props {
  className?: string;
  ui?: 'icon' | 'button';
  projectType?: 'default' | 'local' | 'git';
  label?: string;
  icon?: AppIconType;
  heading?: string;
  active?: boolean;
}

const NewProject: FC<Props> = ({
  className = '',
  ui = 'icon',
  projectType = 'default',
  label = 'Create',
  icon = 'Plus',
  heading = 'New Project',
  active = false,
}) => {
  const [isActive, setIsActive] = useState(active);
  const { projects } = useWorkspaceActions();
  const { createProject } = useProjectActions();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { importURL, name: projectName, lang: importLanguage } = router.query;

  const [form] = useForm();

  const language = [
    { label: 'Tact', value: 'tact', default: true },
    { label: 'Func', value: 'func' },
  ];

  const templatedList = [
    { label: 'Blank Contract', value: 'tonBlank' },
    { label: 'Counter Contract', value: 'tonCounter' },
  ];

  const onFormFinish = async (values: any) => {
    const { name: projectName, githubUrl, language } = values;
    let files: Tree[] = [];

    try {
      setIsLoading(true);
      if (projects().findIndex((p) => p.name == projectName) >= 0) {
        throw `Project '${projectName}' already exists`;
      }

      if (projectType === 'git') {
        files = await downloadRepo(githubUrl);
      }

      const projectId = await createProject(
        projectName,
        language,
        values.template || 'import',
        values?.file?.file,
        files
      );

      form.resetFields();
      closeModal();
      Analytics.track('Create project', {
        platform: 'IDE',
        type: `TON - ${language}`,
        sourceType: projectType,
        template: values.template,
      });
      message.success(`Project '${projectName}' created`);
      router.push(`/project/${projectId}`);
    } catch (error: any) {
      let messageText = 'Error in creating project';
      if (typeof error === 'string') {
        messageText = error;
      } else {
        messageText = error?.message || messageText;
      }
      message.error(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!importURL || !active) {
      return;
    }

    form.setFieldsValue({
      template: 'import',
      githubUrl: importURL || '',
      name: projectName || '',
      language: importLanguage || 'func',
    });
    setIsActive(true);
    const finalQueryParam = router.query;
    delete finalQueryParam.importURL;
    delete finalQueryParam.name;
    router.replace({ query: finalQueryParam });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importURL, projectName, form]);

  const closeModal = () => {
    setIsActive(false);
  };

  useEffect(() => {
    EventEmitter.on('ONBOARDOING_NEW_PROJECT', () => {
      setIsActive(true);
    });
    return () => {
      EventEmitter.off('ONBOARDOING_NEW_PROJECT');
    };
  }, []);

  return (
    <>
      <Tooltip title={heading} placement="bottom">
        <div
          className={`${s.root} ${className} onboarding-new-project`}
          onClick={() => setIsActive(true)}
        >
          {ui === 'icon' && <AppIcon name={icon} className={s.newIcon} />}
          {ui === 'button' && (
            <Button
              type="primary"
              className={`ant-btn-primary-gradient item-center-align w-100`}
            >
              <AppIcon name="Plus" className={s.newIcon} /> Create a new project
            </Button>
          )}
        </div>
      </Tooltip>

      <Modal
        className="onboarding-new-project-form"
        open={isActive}
        onCancel={closeModal}
        footer={null}
      >
        <span className={s.title}>{heading}</span>
        <Form
          form={form}
          className={`${s.form} app-form`}
          layout="vertical"
          onFinish={onFormFinish}
          autoComplete="off"
          initialValues={{ template: 'tonCounter', language: 'tact' }}
          requiredMark="optional"
        >
          <div className="top-header">
            <Form.Item
              name="name"
              className={s.formItem}
              rules={[
                { required: true, message: 'Please input your project name!' },
              ]}
            >
              <Input placeholder="Project name" />
            </Form.Item>

            <Form.Item
              label="Language"
              name="language"
              className={`${s.formItem} ${s.optionSelection}`}
              rules={[{ required: true }]}
            >
              <Radio.Group options={language} optionType="button" />
            </Form.Item>
          </div>

          {projectType === 'default' && (
            <Form.Item
              label="Select Template"
              name="template"
              className={`${s.formItem} ${s.optionSelection} template-selector`}
            >
              <Radio.Group options={templatedList} optionType="button" />
            </Form.Item>
          )}

          {projectType === 'local' && (
            <Form.Item
              label="Select contract zip file"
              name="file"
              className={s.formItem}
              rules={[{ required: true }]}
            >
              <Upload.Dragger
                accept=".zip"
                multiple={false}
                maxCount={1}
                beforeUpload={(file) => {
                  return false;
                }}
              >
                <div className={s.fileUploadLabel}>
                  <AppIcon name="Download" className={s.icon} />
                  <b>Choose a file</b> <span>or drag it here</span>
                </div>
              </Upload.Dragger>
            </Form.Item>
          )}

          {projectType === 'git' && (
            <Form.Item
              label="Github Repository URL"
              name="githubUrl"
              className={s.formItem}
              rules={[
                {
                  required: true,
                  message: 'Please input your Github Repository URL',
                },
              ]}
            >
              <Input placeholder="Ex. https://github.com/nujan-io/ton-contracts/" />
            </Form.Item>
          )}

          <Form.Item className={s.btnActionContainer}>
            <Button
              className={`${s.btnAction} ant-btn-primary-gradient item-center-align`}
              loading={isLoading}
              type="primary"
              htmlType="submit"
            >
              <AppIcon name={icon} /> {label}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default NewProject;
