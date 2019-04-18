import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

export interface BBOmnibarServiceItem {
  title: string;

  items?: BBOmnibarNavigationItem[];

  selected?: boolean;

  specialItems?: BBOmnibarNavigationItem[];

  imageUrl?: string;
}
