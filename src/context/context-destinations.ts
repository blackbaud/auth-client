import { BBContextDestinationsContext } from './context-destinations-context';

import { BBContextDestinationsItem } from './context-destinations-item';

export interface BBContextDestinations {
  context?: BBContextDestinationsContext;

  items?: BBContextDestinationsItem[];
}
