import { BBOmnibarNotifications } from './omnibar-notifications';

export interface BBOmnibarNotificationsReadyArgs {
  updateNotifications: (notifications: BBOmnibarNotifications) => void;
}
