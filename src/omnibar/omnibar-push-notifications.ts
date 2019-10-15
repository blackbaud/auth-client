//#region imports

import {
  BBAuth
} from '../auth';

import {
  BBOmnibarScriptLoader
} from './omnibar-script-loader';

//#endregion

declare const BBNotificationsClient: any;

let registerPromise: Promise<any>;

export class BBOmnibarPushNotifications {

  // public static readonly NOTIFICATIONS_CLIENT_URL = 'https://localhost:8080/lib/notifications-client.global.js';

  public static readonly NOTIFICATIONS_CLIENT_URL =
    'https://sky.blackbaudcdn.net/static/notifications-client/1/notifications-client.global.min.js';

  public static async connect(leId: string, envId: string, cb: (message: any) => void): Promise<void> {
    if (!registerPromise) {
      if ((window as any).BBNotificationsClient) {
        registerPromise = Promise.resolve();
      } else {
        registerPromise = BBOmnibarScriptLoader.registerScript(
          this.NOTIFICATIONS_CLIENT_URL
        );
      }
    }

    return registerPromise.then(() => {
      BBNotificationsClient.BBNotifications.init({
        tokenCallback: () => BBAuth.getToken({
          disableRedirect: true,
          envId,
          leId
        })
      });

      BBNotificationsClient.BBNotifications.addListener(cb);
    });
  }

  public static async disconnect(): Promise<void> {
    if (registerPromise) {
      return registerPromise.then(() => {
        BBNotificationsClient.BBNotifications.destroy();
        registerPromise = undefined;
      });
    }

    return Promise.resolve();
  }

  public static updateNotifications(notifications: any): void {
    BBNotificationsClient.BBNotifications.updateNotifications(notifications);
  }

}
