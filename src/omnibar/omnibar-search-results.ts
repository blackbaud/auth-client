import { BBOmnibarSearchArgs } from './omnibar-search-args';
import { BBOmnibarSearchMoreResults } from './omnibar-search-more-results';
import { BBOmnibarSearchResultItem } from './omnibar-search-result-item';
import { BBOmnibarSearchResultsHtmlFields } from './omnibar-search-results-html-fields';

export interface BBOmnibarSearchResults {
  searchArgs: BBOmnibarSearchArgs;

  items: BBOmnibarSearchResultItem[];

  moreResults?: BBOmnibarSearchMoreResults;

  htmlFields?: BBOmnibarSearchResultsHtmlFields;
}
