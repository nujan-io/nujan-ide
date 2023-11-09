import { LogView } from '@/components/shared';
import { Tooltip } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { LogOptions, LogType } from '@/interfaces/log.interface';
import { debounce } from '@/utility/utils';
import { FC, useState } from 'react';
import { useEffectOnce } from 'react-use';
import s from './BottomPanel.module.scss';

type logType = LogType | 'all';
interface Filter {
  text: string;
  type: logType;
}

const BottomPanel: FC = () => {
  const { clearLog } = useLogActivity();
  const [isLoaded, setIsLoaded] = useState(false);

  const [filter, setFilter] = useState<Filter>({
    text: '',
    type: 'all',
  });

  const filterLogType = { all: 'all', ...LogOptions };

  const logList = Object.values(filterLogType).map((type) => {
    return {
      value: type,
      label: type.toLocaleUpperCase(),
    };
  });

  const updateFilter = (newFilter: Partial<Filter>) => {
    setFilter((current) => {
      return { ...current, ...newFilter };
    });
  };

  const filterLogs = debounce((searchTerm) => {
    setFilter({ text: searchTerm, type: filter.type });
  }, 200);

  useEffectOnce(() => {
    setIsLoaded(true);
  });

  return (
    <div className={s.root}>
      <div className={s.tabsContainer}>
        <div className={s.tab}>LOG</div>
        <div className={s.actions}>
          {/* <Input
            className={s.filterText}
            onChange={(e) => filterLogs(e.target.value)}
            placeholder="Filter logs by text"
          />
          <Select
            style={{ width: 115 }}
            defaultValue="all"
            onChange={(value: logType) => updateFilter({ type: value })}
            options={logList}
          /> */}
          <Tooltip title="Clear log" placement="left">
            <span className={s.clearLog} onClick={clearLog}>
              <AppIcon name="Clear" className={s.icon} />
            </span>
          </Tooltip>
        </div>
      </div>
      <LogView
        text={filter?.text || undefined}
        type={filter.type !== 'all' ? filter.type : undefined}
      />
    </div>
  );
};

export default BottomPanel;
