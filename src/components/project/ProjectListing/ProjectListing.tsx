import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';
import NewProject from '../NewProject';
import s from './ProjectListing.module.scss';

const ProjectListing: FC = () => {
  const { projects } = useWorkspaceActions();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={s.root}>
      <NewProject />
      {isLoaded &&
        [...projects()].reverse().map((item, i) => (
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
  );
};

export default ProjectListing;
