import * as jwtDecode from 'jwt-decode';

import { BBAuth } from '../auth';

import { BBAuthInterop } from '../shared/interop';

import { BBOmnibarPushNotificationsConnectArgs } from './omnibar-push-notifications-connect-args';

import { BBOmnibarScriptLoader } from './omnibar-script-loader';

import { BBOmnibarToastContainer } from './omnibar-toast-container';

let connectArgs: BBOmnibarPushNotificationsConnectArgs;
let pushNotificationsConnected = false;
let registerPromise: Promise<void>;

const notificationSvcIds: Record<
  string,
  {
    requiresNotif: boolean;
  }
> = {
  admin: {
    requiresNotif: false,
  },
  chrch: {
    requiresNotif: false,
  },
  donorcentrics: {
    requiresNotif: false,
  },
  faith: {
    requiresNotif: true,
  },
  fenxt: {
    requiresNotif: true,
  },
  gmk: {
    requiresNotif: false,
  },
  gsrch: {
    requiresNotif: true,
  },
  lst: {
    requiresNotif: false,
  },
  marketplace: {
    requiresNotif: false,
  },
  merchservices: {
    requiresNotif: false,
  },
  mpebill: {
    requiresNotif: false,
  },
  renxt: {
    requiresNotif: false,
  },
  skydev: {
    requiresNotif: false,
  },
  skydevhome: {
    requiresNotif: false,
  },
  skyux: {
    requiresNotif: false,
  },
  tcs: {
    requiresNotif: true,
  },
  edu: {
    requiresNotif: false,
  },
  highered: {
    requiresNotif: false,
  },
  '1bbfun': {
    requiresNotif: false,
  },
};

async function initToastContainer(
  args: BBOmnibarPushNotificationsConnectArgs
): Promise<void> {
  await BBOmnibarToastContainer.init({
    envId: args.envId,
    leId: args.leId,
    navigateCallback: args.handleNavigate,
    navigateUrlCallback: args.handleNavigateUrl,
    openMenuCallback: args.openPushNotificationsMenu,
    pushNotificationsChangeCallback: args.handlePushNotificationsChange,
    svcId: args.svcId,
    url: BBAuthInterop.getCurrentUrl(),
  });
}

async function tokenContainsNotif(
  envId: string,
  leId: string
): Promise<boolean> {
  let token: string;

  try {
    token = await BBAuth.getToken({
      disableRedirect: true,
      envId,
      leId,
      permissionScope: 'Notifications',
    });
  } catch (err) {
    return false;
  }

  const decodedToken: Record<string, unknown> = jwtDecode(token);
  let entitlements = decodedToken['1bb.entitlements'] as string | string[];

  if (entitlements) {
    entitlements = Array.isArray(entitlements) ? entitlements : [entitlements];
    return (entitlements as string[]).indexOf('notif') > -1;
  }

  return false;
}

export class BBOmnibarPushNotifications {
  public static readonly NOTIFICATIONS_CLIENT_URL =
    'https://sky.blackbaudcdn.net/static/notifications-client/1/notifications-client.global.min.js';

  public static async connect(
    args: BBOmnibarPushNotificationsConnectArgs
  ): Promise<void> {
    if (!pushNotificationsConnected) {
      connectArgs = args;
      pushNotificationsConnected = true;

      if (window.BBNotificationsClient) {
        registerPromise = Promise.resolve();
      } else {
        registerPromise = BBOmnibarScriptLoader.registerScript(
          BBOmnibarPushNotifications.NOTIFICATIONS_CLIENT_URL
        );
      }

      await registerPromise;

      window.BBNotificationsClient.BBNotifications.init({
        tokenCallback: () =>
          BBAuth.getToken({
            disableRedirect: true,
            envId: args.envId,
            leId: args.leId,
          }),
      });

      const notificationsEnabled = await this.pushNotificationsEnabled();

      if (notificationsEnabled) {
        await initToastContainer(args);
        window.BBNotificationsClient.BBNotifications.addListener(
          args.notificationsCallback
        );
      }

      if (args.showVerticalNav) {
        window.BBNotificationsClient.BBNotifications.addCustomMessageListener({
          callback: args.customMessageCallback,
          customMessageType: 'ui-config-global-settings-update',
        });
      }
    }
  }

  public static async disconnect(): Promise<void> {
    if (pushNotificationsConnected) {
      connectArgs = undefined;

      BBOmnibarToastContainer.destroy();

      await registerPromise;

      window.BBNotificationsClient.BBNotifications.destroy();
      registerPromise = undefined;
      pushNotificationsConnected = false;
    }
  }

  public static updateNotifications(notifications: unknown[]): void {
    window.BBNotificationsClient.BBNotifications.updateNotifications(
      notifications
    );
  }

  public static async pushNotificationsEnabled(): Promise<boolean> {
    if (pushNotificationsConnected) {
      const notificationSvcId = notificationSvcIds[connectArgs.svcId];

      if (notificationSvcId) {
        return (
          !notificationSvcId.requiresNotif ||
          tokenContainsNotif(connectArgs.envId, connectArgs.leId)
        );
      }
    }

    return false;
  }
}
