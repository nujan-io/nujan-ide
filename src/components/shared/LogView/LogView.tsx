import { useLogActivity } from '@/hooks/logActivity.hooks';
import s from './LogView.module.scss';

const LogView = () => {
  const { getLog } = useLogActivity();

  const formatTimestamp = (timestamp: string | number | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={s.root}>
      {getLog().map(({ type, text, timestamp }, index) => (
        <div
          key={index}
          className={`${s.item} ${s[`type__${type.toLowerCase()}`]}`}
        >
          <span>[{type}] : </span>
          <span className={s.text}>{text}</span>
          <span className={s.timestamp}>{formatTimestamp(timestamp)}</span>
        </div>
      ))}
    </div>
  );
};

export default LogView;
