import { BBOmnibarNavigationItem } from './omnibar-navigation-item';
import { BBOmnibarServiceItem } from './omnibar-service-item';

export interface BBOmnibarNavigation {
  services?: BBOmnibarServiceItem[];

  localNavItems?: BBOmnibarNavigationItem[];

  beforeNavCallback?: (item: BBOmnibarNavigationItem) => void | boolean;
}
