import { BBOmnibarNavigation } from './omnibar-navigation';

import { BBOmnibarTheme } from './theming';

export interface BBOmnibarUpdateArgs {
  theme?: BBOmnibarTheme;

  compactNavOnly?: boolean;

  nav?: BBOmnibarNavigation;

  help?: {
    url: string;
  };
}
