import AppIcon from '@/components/ui/icon';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import fileSystem from '@/lib/fs';
import ZIP from '@/lib/zip';
import { Button, Tooltip } from 'antd';
import { FC, useState } from 'react';
import s from './DownloadProject.module.scss';

interface Props {
  path: string;
  title: string;
}

const DownloadProject: FC<Props> = ({ path, title }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { createLog } = useLogActivity();
  const download = () => {
    try {
      let fileName = path.split('/').pop();
      if (path === '/') {
        fileName = 'archive';
      }
      const zip = new ZIP(fileSystem);
      zip.bundleFilesAndDownload([path], `${fileName}.zip`);
    } catch (error) {
      if (error instanceof Error) {
        createLog(error.message, 'error');
      } else {
        createLog('Failed to download project', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip title={title}>
      <Button
        type="text"
        title={title}
        onClick={() => {
          download();
        }}
        disabled={isLoading}
        icon={<AppIcon name="Download" />}
        size="small"
        className={s.download}
      />
    </Tooltip>
  );
};

export default DownloadProject;
