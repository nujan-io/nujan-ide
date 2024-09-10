import { useFileTab } from '@/hooks';
import { FC } from 'react';
import s from './OpenFile.module.scss';

interface Props {
  path: string;
  name: string;
}

const OpenFile: FC<Props> = ({ path, name }) => {
  const { open } = useFileTab();

  return (
    <span
      className={s.root}
      onClick={() => {
        open(name, path);
      }}
    >
      {name}
    </span>
  );
};

export default OpenFile;
