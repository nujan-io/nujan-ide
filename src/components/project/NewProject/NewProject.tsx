import AppIcon from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { UploadOutlined } from '@ant-design/icons';
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
}

const NewProject: FC<Props> = ({ className = '', ui = 'icon' }) => {
  const [isActive, setIsActive] = useState(false);
  const { projects } = useWorkspaceActions();
  const { createProject } = useProjectActions();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { importURL, name: projectName } = router.query;

  const [form] = useForm();

  const language = [
    { label: 'Tact', value: 'tact', default: true },
    { label: 'Func', value: 'func' },
  ];

  const templatedList = [
    { label: 'Blank Contract', value: 'tonBlank' },
    { label: 'Counter Contract', value: 'tonCounter' },
    // { label: 'NFT Contract', value: 'nft', lang: 'tact' },

    { label: 'Import Contract', value: 'import' },

    // { label: 'Chat Bot Contract', value: 'chatBot' },
  ];

  const importOptions = [
    { label: 'From Github', value: 'github', default: true },
    { label: 'From local', value: 'local' },
  ];

  const onFormFinish = async (values: any) => {
    const { name: projectName, importType, githubUrl, language } = values;
    let files: Tree[] = [];

    try {
      setIsLoading(true);
      if (projects().findIndex((p) => p.name == projectName) >= 0) {
        throw `Project '${projectName}' already exists`;
      }

      if (importType === 'github') {
        files = await downloadRepo(githubUrl);
      }

      const projectId = await createProject(
        projectName,
        language,
        values.template,
        values?.file?.file,
        files
      );

      form.resetFields();
      closeModal();
      Analytics.track('Create project', {
        platform: 'IDE',
        type: `TON - ${language}`,
        sourceType: importType,
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
    if (!importURL || (!form && !isActive)) {
      return;
    }

    form.setFieldsValue({
      template: 'import',
      importType: 'github',
      githubUrl: importURL || '',
      name: projectName || '',
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

  const projectImport = (fieldGetter: any) => (
    <div className="">
      <Form.Item
        label="Import Type"
        name="importType"
        className={s.formItem}
        rules={[{ required: true }]}
      >
        <Radio.Group options={importOptions} optionType="button" />
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) =>
          prevValues.importType !== currentValues.importType
        }
      >
        {() =>
          fieldGetter('importType') === 'local' ? (
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
          ) : (
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
          )
        }
      </Form.Item>
    </div>
  );

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
      <Tooltip title="New Project" placement="bottom">
        <div
          className={`${s.root} ${className} onboarding-new-project}`}
          onClick={() => setIsActive(true)}
        >
          {ui === 'icon' && <AppIcon name="Plus" className={s.newIcon} />}
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
        <span className={s.title}>New Project</span>
        <Form
          form={form}
          className={s.form}
          layout="vertical"
          onFinish={onFormFinish}
          autoComplete="off"
          initialValues={{ template: 'tonCounter', language: 'tact' }}
          requiredMark="optional"
          onFieldsChange={(changedField) => {
            if (changedField[0].value === 'import') {
              form.setFieldsValue({ importType: 'github' });
            }
          }}
        >
          <div className="top-header">
            <Form.Item
              label="Name"
              name="name"
              className={s.formItem}
              rules={[
                { required: true, message: 'Please input your project name!' },
              ]}
            >
              <Input placeholder="Ex. Counter" />
            </Form.Item>

            <Form.Item
              label="Language"
              name="language"
              className={s.formItem}
              rules={[{ required: true }]}
            >
              <Radio.Group options={language} optionType="button" />
            </Form.Item>
          </div>

          <Form.Item
            label="Select Template/Import"
            name="template"
            className={`${s.formItem} template-selector`}
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
              getFieldValue('template') === 'import'
                ? projectImport(getFieldValue)
                : null
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
