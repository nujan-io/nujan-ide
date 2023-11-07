import { NewProject } from '@/components/project';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Select } from 'antd';
import { useRouter } from 'next/router';
import { FC, useEffect, useState } from 'react';
import s from './ManageProject.module.scss';

const ManageProject: FC = () => {
  const { projects, deleteProject } = useWorkspaceActions();
  const router = useRouter();
  const { id: projectId } = router.query;
  const [currentProject, setCurrentProject] = useState<string | null>(
    projectId as string
  );

  useEffect(() => {
    if (router && currentProject) {
      router.push(`/project/${currentProject}`);
    }
  }, [currentProject, router]);

  return (
    <div className={s.root}>
      <div className={s.header}>
        <span className={s.heading}>Projects</span>
        <div className={s.options}>
          <NewProject />
        </div>
      </div>
      <div className={s.projects}>
        <Select
          showSearch
          className="w-100 select-search-input-dark"
          defaultActiveFirstOption
          value={currentProject}
          onChange={(value) => setCurrentProject(value)}
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
              {project.name}
            </Select.Option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default ManageProject;
