import { Skeleton } from '@/components/ui';
import { AppConfig } from '@/config/AppConfig';
import { useProjectServiceActions } from '@/hooks/ProjectService.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Router from 'next/router';
import { FC, useEffect, useState } from 'react';
import NewProject from '../NewProject';
import s from './ProjectListing.module.scss';

const ProjectListing: FC = () => {
  const { projects, setProjects } = useWorkspaceActions();
  const { listProjects } = useProjectServiceActions();
  const [isLoading, setIsLoadeding] = useState(true);
  const { data: session } = useSession();

  const loadProjects = async () => {
    try {
      const projects = (await listProjects())?.data?.data;
      setProjects(projects);
    } catch (error) {
    } finally {
      setIsLoadeding(false);
    }
  };

  useEffect(() => {
    if (!session) {
      Router.push(AppConfig.loginPath);
    }
  }, [session]);

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className={s.root}>
      <Skeleton isLoading={isLoading} />
      {!isLoading && (
        <div className={s.content}>
          <NewProject />
          {[...projects()].reverse().map((item, i) => (
            <Link href={`/project/${item.id}`} key={item.id} className={s.item}>
              <Image
                src={`/images/icon/ton-protocol-logo-white.svg`}
                width={30}
                height={30}
                alt={''}
                className={s.platformIcon}
              />

              <span className={s.name}>{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectListing;
