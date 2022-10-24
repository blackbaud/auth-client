import { BBOmnibarNavigationItemDisplayStyle } from './omnibar-navigation-item-display-style';

export interface BBOmnibarNavigationItem {
  title: string;

  url?: string;

  icon?: string;

  items?: BBOmnibarNavigationItem[];

  data?: unknown;

  displayStyle?: BBOmnibarNavigationItemDisplayStyle;
}
