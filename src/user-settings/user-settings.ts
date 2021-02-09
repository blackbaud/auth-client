import {
  BBAuth
} from '../auth';

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBUserConfig
} from './user-config';

const URL = 'https://sky-pusa01.app.blackbaud.net/uicfg/settings/user';

let updateTimeoutId: any;

export class BBUserSettings {

  public static readonly UPDATE_DELAY = 1000;

  public static readonly GET_SETTINGS_TIMEOUT = 5000;

  public static readonly LOCAL_STORAGE_KEY = 'auth-client-local-user-settings';

  public static getSettings(): Promise<BBUserConfig> {
    return new Promise((resolve, reject) => {
      BBAuth.getToken({
        disableRedirect: true
      }).then(
        (token) => {
          const timeoutId = setTimeout(reject, this.GET_SETTINGS_TIMEOUT);

          BBCsrfXhr.requestWithToken(
            URL,
            token
          ).then(
            (value: { settings: BBUserConfig }) => {
              clearTimeout(timeoutId);
              resolve(value.settings);
            },
            reject
          );
        },
        () => {
          // User is not logged in; return local settings.
          try {
            resolve(this.getLocalSettings());
          } catch (err) {
            reject();
          }
        }
      );
    });
  }

  public static updateSettings(settings: BBUserConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
        updateTimeoutId = undefined;
      }

      updateTimeoutId = setTimeout(() => {
        updateTimeoutId = undefined;

        BBAuth.getToken({
          disableRedirect: true
        }).then(
          (token) => {
            BBCsrfXhr.requestWithToken(
              URL,
              token,
              'PATCH',
              {
                settings
              }
            ).then(
              resolve,
              reject
            );
          },
          () => {
            // User is not logged in; save settings locally.
            let existingSettings: BBUserConfig;

            try {
              existingSettings = this.getLocalSettings();
            } catch (err) {
              existingSettings = {};
            }

            try {
              existingSettings.omnibar = existingSettings.omnibar || {};

              Object.assign(existingSettings.omnibar, settings.omnibar);

              localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(existingSettings));
            } catch (err) {
              reject();
            }
          }
        );
      }, this.UPDATE_DELAY);
    });
  }

  private static getLocalSettings(): BBUserConfig {
    return JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY));
  }

}
