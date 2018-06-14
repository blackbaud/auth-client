import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

export interface BBOmnibarServiceItem {
  title: string;

  items?: BBOmnibarNavigationItem[];

  specialItems?: BBOmnibarNavigationItem[];

  imageUrl?: string;
}
