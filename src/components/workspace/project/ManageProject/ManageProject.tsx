import { NewProject } from '@/components/project';
import { Tooltip } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import { Button, Modal, Select, message } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';
import s from './ManageProject.module.scss';

const ManageProject: FC = () => {
  const { project, projects, deleteProject } = useWorkspaceActions();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const router = useRouter();
  const { id: projectId } = router.query;

  const getLanguageInitial = (language: string | undefined) => {
    const languageInitial = language?.split('')?.[0]?.toUpperCase();
    if (!languageInitial) return 'F - ';
    return languageInitial + ' - ';
  };

  const deleteSelectedProject = async (id: Project['id']) => {
    try {
      await deleteProject(id);
      setCurrentProject(null);
      setIsDeleteConfirmOpen(false);
      router.push('/');
    } catch (error) {
      message.error('Failed to delete project');
    } finally {
    }
  };

  const openProject = (id: Project['id']) => {
    if (!id) return;
    const selectedProject = project(id as string);
    if (!selectedProject) {
      message.error('Project not found');
      return;
    }
    setCurrentProject(selectedProject);
    router.push(`/project/${selectedProject?.id}`);
  };

  useEffect(() => {
    if (!projectId || currentProject?.id == projectId) return;
    openProject(projectId as string);
  }, [projectId]);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.heading}>Projects</span>
        <div className={s.options}>
          <NewProject />
          <Tooltip title="Delete Project" placement="bottom">
            <div
              className={`${s.deleteProject} ${
                !currentProject ? s.disabled : ''
              }`}
              onClick={(e) => currentProject && setIsDeleteConfirmOpen(true)}
            >
              <AppIcon name="Delete" />
            </div>
          </Tooltip>
        </div>
      </div>
      <div className={s.projects}>
        <Select
          showSearch
          className="w-100 select-search-input-dark"
          value={currentProject?.id}
          onChange={(_project) => openProject(_project)}
          notFoundContent="No project found"
          filterOption={(inputValue, option) => {
            return option?.title
              .toLowerCase()
              .includes(inputValue.toLowerCase());
          }}
        >
          {[...projects()].reverse().map((project) => (
            <Select.Option
              key={project.id}
              value={project.id}
              title={project.name}
            >
              <span>{getLanguageInitial(project?.language)}</span>
              {project.name}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Modal
        className="modal-delete-project"
        open={isDeleteConfirmOpen}
        closable={false}
        footer={null}
      >
        <span className={s.modalTitle}>
          <AppIcon name="Info" /> Delete my <b>`{currentProject?.name}`</b>{' '}
          Project?
        </span>
        <div className={s.modalDescription}>
          <p>
            <b>Are you sure you want to delete?</b>
          </p>
          <div className={s.checklist}>
            <span>- This action is irreversable!</span>
            <span>- All files and folders will be deleted.</span>
          </div>
        </div>
        <div className={s.actions}>
          <Button
            className={`${s.btnAction} ${s.cancel}`}
            type="primary"
            onClick={() => setIsDeleteConfirmOpen(false)}
          >
            <AppIcon name="Close" className={s.icon} />
            Cancel
          </Button>
          <Button
            className={s.btnAction}
            type="primary"
            danger
            onClick={() => deleteSelectedProject(currentProject?.id!!)}
          >
            <AppIcon name="Delete" />
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageProject;
