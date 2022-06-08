import {
  BBOmnibarNavigationItem
} from './omnibar-navigation-item';

export interface BBOmnibarPushNotificationsConnectArgs {

  customMessageCallback: any;

  envId: string;

  handlePushNotificationsChange: (notifications: any[]) => void;

  handleNavigate: (navItem: BBOmnibarNavigationItem) => void;

  handleNavigateUrl: (url: string) => void;

  leId: string;

  notificationsCallback: (message: any) => void;

  openPushNotificationsMenu: () => void;

  showVerticalNav: boolean;

  svcId: string;

}
