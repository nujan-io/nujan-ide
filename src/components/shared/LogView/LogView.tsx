import { useLogActivity } from '@/hooks/logActivity.hooks';
import { LogType } from '@/interfaces/log.interface';
import { FC, createRef, useEffect } from 'react';
import s from './LogView.module.scss';

interface Props {
  type?: LogType | undefined;
  text?: string | undefined;
}

const LogView: FC<Props> = ({ type, text }) => {
  const { getLog } = useLogActivity();
  const logViewerRef = createRef<HTMLDivElement>();

  const formatTimestamp = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  useEffect(() => {
    if (!logViewerRef?.current) return;
    logViewerRef.current.scrollTo({
      top: logViewerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [getLog, logViewerRef]);

  return (
    <div className={s.root} ref={logViewerRef}>
      {getLog({ text, type }).map(({ type, text, timestamp }, index) => (
        <div
          key={index}
          className={`${s.item} ${s[`type__${type.toLowerCase()}`]}`}
        >
          <span>[{type}] - </span>
          <span
            className={`${s.text} wrap-text`}
            dangerouslySetInnerHTML={{ __html: text }}
          />
          <span className={s.timestamp}>{formatTimestamp(timestamp)}</span>
        </div>
      ))}
    </div>
  );
};

export default LogView;
