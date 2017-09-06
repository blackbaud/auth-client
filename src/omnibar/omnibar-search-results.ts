import { BBOmnibarSearchArgs } from './omnibar-search-args';
import { BBOmnibarSearchMoreResults } from './omnibar-search-more-results';
import { BBOmnibarSearchResultItem } from './omnibar-search-result-item';

export class BBOmnibarSearchResults {
  public searchArgs: BBOmnibarSearchArgs;

  public items: BBOmnibarSearchResultItem[];

  public moreResults?: BBOmnibarSearchMoreResults;
}
