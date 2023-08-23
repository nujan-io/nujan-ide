import { AppConfig } from '@/config/AppConfig';
import mixpanel from 'mixpanel-browser';

let isAnalyticsEnabled = AppConfig.analytics.IS_ENABLED;

let actions = {
  identify: (id: string) => {
    if (isAnalyticsEnabled) mixpanel.identify(id);
  },
  alias: (id: string) => {
    if (isAnalyticsEnabled) mixpanel.alias(id);
  },
  track: (name: string, props: any = {}) => {
    if (isAnalyticsEnabled) mixpanel.track(name, props);
  },
  people: {
    set: (props: any) => {
      if (isAnalyticsEnabled) mixpanel.people.set(props);
    },
  },
};

export const Analytics = actions;
