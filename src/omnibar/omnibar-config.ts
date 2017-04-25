import { BBOmnibarNavigation } from './omnibar-navigation';
import { BBOmnibarSearchArgs } from './omnibar-search-args';
import { BBOmnibarSearchResults } from './omnibar-search-results';

export class BBOmnibarConfig {
  public serviceName?: string;

  public svcId?: string;

  public envId?: string;

  public nav?: BBOmnibarNavigation;

  public experimental?: boolean;

  public url?: string;

  public onSearch?: (searchArgs: BBOmnibarSearchArgs) => Promise<BBOmnibarSearchResults>;
}
