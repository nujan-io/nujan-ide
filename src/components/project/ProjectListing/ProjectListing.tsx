import Image from 'next/image';
import Link from 'next/link';
import { FC } from 'react';
import NewProject from '../NewProject';
import s from './ProjectListing.module.scss';

const ProjectListing: FC = () => {
  return (
    <div className={s.root}>
      <NewProject />
      {Array(7)
        .fill('')
        .map((item, i) => (
          <Link href={`/project/${i + 1}`} key={i} className={s.item}>
            <Image
              src={`/images/icon/ton-protocol-logo-white.svg`}
              width={30}
              height={30}
              alt={item.platform}
              className={s.platformIcon}
            />

            <span className={s.name}>Project name {i + 1}</span>
          </Link>
        ))}
    </div>
  );
};

export default ProjectListing;
