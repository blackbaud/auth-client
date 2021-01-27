//#region imports

import {
  BBOmnibarNavigation
} from './omnibar-navigation';

import {
  BBOmnibarNotificationsConfig
} from './omnibar-notifications-config';

import {
  BBOmnibarSearchArgs
} from './omnibar-search-args';

import {
  BBOmnibarSearchResults
} from './omnibar-search-results';

import {
  BBOmnibarServiceItem
} from './omnibar-service-item';

import {
  BBOmnibarTheme
} from './theming';

//#endregion

export interface BBOmnibarConfig {
  serviceName?: string;

  svcId?: string;

  envId?: string;

  leId?: string;

  nav?: BBOmnibarNavigation;

  legacy?: boolean;

  url?: string;

  onSearch?: (searchArgs: BBOmnibarSearchArgs) => Promise<BBOmnibarSearchResults>;

  services?: BBOmnibarServiceItem[];

  enableHelp?: boolean;

  notifications?: BBOmnibarNotificationsConfig;

  legacyKeepAliveUrl?: string;

  allowAnonymous?: boolean;

  theme?: BBOmnibarTheme;

  compactNavOnly?: boolean;

  navVersion?: string;

  hideResourceLinks?: boolean;

  verticalUrl?: string;
}
