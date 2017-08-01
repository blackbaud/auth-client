import { BBOmnibarNotificationItem } from './omnibar-notification-item';
import { BBOmnibarNotificationsReadyArgs } from './omnibar-notifications-ready-args';

export interface BBOmnibarNotificationsConfig {
  onReady: (args: BBOmnibarNotificationsReadyArgs) => void;

  onNotificationRead?: (notification: BBOmnibarNotificationItem) => void;
}
