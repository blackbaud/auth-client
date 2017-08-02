import { BBOmnibarNavigation } from './omnibar-navigation';
import { BBOmnibarNotificationsConfig } from './omnibar-notifications-config';
import { BBOmnibarSearchArgs } from './omnibar-search-args';
import { BBOmnibarSearchResults } from './omnibar-search-results';
import { BBOmnibarServiceItem } from './omnibar-service-item';

export class BBOmnibarConfig {
  public serviceName?: string;

  public svcId?: string;

  public envId?: string;

  public nav?: BBOmnibarNavigation;

  public experimental?: boolean;

  public url?: string;

  public onSearch?: (searchArgs: BBOmnibarSearchArgs) => Promise<BBOmnibarSearchResults>;

  public services?: BBOmnibarServiceItem[];

  public enableHelp?: boolean;

  public notifications?: BBOmnibarNotificationsConfig;
}
