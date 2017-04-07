import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

export class BBOmnibarNavigation {
  public localNavItems?: BBOmnibarNavigationItem[];

  public beforeNavCallback?: (item: BBOmnibarNavigationItem) => void | boolean;
}
