//#region imports

import {
  BBOmnibarNavigation
} from './omnibar-navigation';

import {
  BBOmnibarTheme
} from './theming';

//#endregion

export interface BBOmnibarUpdateArgs {

  theme?: BBOmnibarTheme;

  compactNavOnly?: boolean;

  nav?: BBOmnibarNavigation;

}
