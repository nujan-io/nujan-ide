import { AppConfig } from '@/config/AppConfig';
import mixpanel from 'mixpanel-browser';

const isAnalyticsEnabled = AppConfig.analytics.IS_ENABLED;

const actions = {
  identify: (id: string) => {
    if (isAnalyticsEnabled) mixpanel.identify(id);
  },
  alias: (id: string) => {
    if (isAnalyticsEnabled) mixpanel.alias(id);
  },
  track: (name: string, props: Record<string, unknown> = {}) => {
    if (isAnalyticsEnabled) mixpanel.track(name, props);
  },
  people: {
    set: (props: Record<string, unknown>) => {
      if (isAnalyticsEnabled) mixpanel.people.set(props);
    },
  },
};

export const Analytics = actions;
