import { BBOmnibarSearchArgs } from './omnibar-search-args';
import { BBOmnibarSearchMoreResults } from './omnibar-search-more-results';
import { BBOmnibarSearchResultItem } from './omnibar-search-result-item';
import { BBOmnibarSearchResultsHtmlFields } from './omnibar-search-results-html-fields';

export class BBOmnibarSearchResults {
  public searchArgs: BBOmnibarSearchArgs;

  public items: BBOmnibarSearchResultItem[];

  public moreResults?: BBOmnibarSearchMoreResults;

  public htmlFields?: BBOmnibarSearchResultsHtmlFields;
}
