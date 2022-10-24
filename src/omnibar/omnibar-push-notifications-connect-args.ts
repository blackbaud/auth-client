import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

export interface BBOmnibarPushNotificationsConnectArgs {
  customMessageCallback(message: { value: string }): void;

  envId: string;

  handlePushNotificationsChange: (notifications: unknown[]) => void;

  handleNavigate: (navItem: BBOmnibarNavigationItem) => void;

  handleNavigateUrl: (url: string) => void;

  leId: string;

  notificationsCallback: (message: unknown) => void;

  openPushNotificationsMenu: () => void;

  showVerticalNav: boolean;

  svcId: string;
}
