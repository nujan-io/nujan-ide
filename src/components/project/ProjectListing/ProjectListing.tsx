import AppIcon from '@/components/ui/icon';
import { useAuthAction } from '@/hooks/auth.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { Project } from '@/interfaces/workspace.interface';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';
import NewProject from '../NewProject';
import s from './ProjectListing.module.scss';

const ProjectListing: FC = () => {
  const { projects, deleteProject } = useWorkspaceActions();
  const { user } = useAuthAction();
  const [projectToDelete, setProjectToDelete] = useState<Project['id'] | null>(
    null
  );

  const deleteSelectedProject = async (
    e: React.MouseEvent,
    id: Project['id']
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(id);

    try {
      await deleteProject(id);
    } catch (error) {
    } finally {
      setProjectToDelete(null);
    }
  };

  return (
    <div className={s.root}>
      <div className={s.content}>
        <NewProject />
        {[...projects()].reverse().map((item) => (
          <Link
            href={`/project/${item.id}`}
            key={item.id}
            className={`${s.item} ${
              projectToDelete === item.id ? s.deleting : ''
            }`}
          >
            <Image
              src={`/images/icon/ton-protocol-logo-white.svg`}
              width={30}
              height={30}
              alt={''}
              className={s.platformIcon}
            />

            <div
              className={s.deleteProject}
              onClick={(e) => deleteSelectedProject(e, item.id)}
            >
              <AppIcon name="Delete" />
            </div>

            <span className={s.name}>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProjectListing;
