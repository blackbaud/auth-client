import { BBOmnibarNavigation } from './omnibar-navigation';
import { BBOmnibarNotificationsConfig } from './omnibar-notifications-config';
import { BBOmnibarSearchArgs } from './omnibar-search-args';
import { BBOmnibarSearchResults } from './omnibar-search-results';
import { BBOmnibarServiceItem } from './omnibar-service-item';

export interface BBOmnibarConfig {
  serviceName?: string;

  svcId?: string;

  envId?: string;

  nav?: BBOmnibarNavigation;

  legacy?: boolean;

  url?: string;

  onSearch?: (searchArgs: BBOmnibarSearchArgs) => Promise<BBOmnibarSearchResults>;

  services?: BBOmnibarServiceItem[];

  enableHelp?: boolean;

  notifications?: BBOmnibarNotificationsConfig;

  legacyKeepAliveUrl?: string;

  allowAnonymous?: boolean;
}
