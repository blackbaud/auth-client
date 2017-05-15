import { BBOmnibarNavigationItem } from './omnibar-navigation-item';
import { BBOmnibarServiceItem } from './omnibar-service-item';

export class BBOmnibarNavigation {
  public services?: BBOmnibarServiceItem[];

  public localNavItems?: BBOmnibarNavigationItem[];

  public beforeNavCallback?: (item: BBOmnibarNavigationItem) => void | boolean;
}
