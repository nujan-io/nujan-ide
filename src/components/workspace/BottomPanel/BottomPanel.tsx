import { MigrateToUnifiedFS } from '@/components/project';
import { LogView } from '@/components/shared';
import { Tooltip } from '@/components/ui';
import AppIcon from '@/components/ui/icon';
import { useLogActivity } from '@/hooks/logActivity.hooks';
import { LogOptions, LogType } from '@/interfaces/log.interface';
import { debounce } from '@/utility/utils';
import { Input, Select } from 'antd';
import { FC, useState } from 'react';
import s from './BottomPanel.module.scss';

type logType = LogType | 'all';
export interface Filter {
  counter: number;
  text: string;
  type: logType;
}

const BottomPanel: FC = () => {
  const { clearLog } = useLogActivity();

  const [filter, setFilter] = useState<Filter>({
    counter: 0,
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
    updateFilter({
      counter: filter.counter + 1,
      text: searchTerm as string,
    });
  }, 200);

  return (
    <div className={s.root}>
      <div className={s.tabsContainer}>
        <div className={s.tab}>LOG</div>
        <div className={s.actions}>
          <MigrateToUnifiedFS />
          <Input
            className={s.filterText}
            onChange={(e) => {
              filterLogs(e.target.value);
            }}
            placeholder="Filter logs by text"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateFilter({ counter: filter.counter + 1 });
              }
            }}
          />
          <Select
            style={{ width: 150 }}
            defaultValue="all"
            onChange={(value: logType) => {
              updateFilter({ type: value });
            }}
            options={logList}
          />
          <Tooltip title="Clear log" placement="left">
            <span className={s.clearLog} onClick={clearLog}>
              <AppIcon name="Clear" className={s.icon} />
            </span>
          </Tooltip>
        </div>
      </div>
      <LogView filter={filter} />
    </div>
  );
};

export default BottomPanel;
