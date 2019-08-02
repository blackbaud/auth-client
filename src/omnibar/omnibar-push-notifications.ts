//#region imports

import {
  BBOmnibarScriptLoader
} from './omnibar-script-loader';

//#endregion

declare const BBNotificationsClient: any;

export class BBOmnibarPushNotifications {

  public static init(cb: (message: any) => void) {
    BBOmnibarScriptLoader.registerScript(
      'https://localhost:8080/dist/bundles/notifications-client.global.js'
    )
      .then(() => {
        return BBOmnibarScriptLoader.registerScript(
          'https://localhost:8082/dist/skyux-el-toast/bundles/skyux-el-toast.bundle.js'
        );
      })
      .then(() => {
        BBNotificationsClient.BBNotifications.addListener((message: any) => {
          cb(message);
        });
      });
  }

}
