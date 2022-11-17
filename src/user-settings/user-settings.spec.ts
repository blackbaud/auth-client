import { BBAuth } from '../auth';

import { BBCsrfXhr } from '../shared/csrf-xhr';

import { BBUserConfig } from './user-config';

import { BBUserSettings } from './user-settings';

describe('User settings', () => {
  let requestWithTokenSpy: jasmine.Spy<typeof BBCsrfXhr.requestWithToken>;
  let previousUpdateDelay: number;
  let previousGetSettingsTimeout: number;

  beforeEach(() => {
    requestWithTokenSpy = spyOn(BBCsrfXhr, 'requestWithToken');

    previousUpdateDelay = BBUserSettings.UPDATE_DELAY;
    previousGetSettingsTimeout = BBUserSettings.GET_SETTINGS_TIMEOUT;

    BBUserSettings.UPDATE_DELAY = 100;
    BBUserSettings.GET_SETTINGS_TIMEOUT = 100;
  });

  afterEach(() => {
    BBUserSettings.UPDATE_DELAY = previousUpdateDelay;
    BBUserSettings.GET_SETTINGS_TIMEOUT = previousGetSettingsTimeout;
  });

  describe('when logged in', () => {
    beforeEach(() => {
      spyOn(BBAuth, 'getToken').and.returnValue(Promise.resolve('abc'));
    });

    it('should get user settings from the web service', async () => {
      const response = {
        settings: {
          omnibar: {
            vMin: true,
          },
        },
      };

      requestWithTokenSpy.and.returnValue(Promise.resolve(response));

      const settings = await BBUserSettings.getSettings();

      expect(requestWithTokenSpy).toHaveBeenCalledWith(
        'https://sky-pusa01.app.blackbaud.net/uicfg/settings/user',
        'abc'
      );

      expect(settings).toEqual(response.settings);
    });

    it('should give up on unresponsive requests to retrieve user settings', (done) => {
      requestWithTokenSpy.and.returnValue(
        new Promise(() => {
          /* */
        })
      );

      let timedOut = false;

      BBUserSettings.getSettings().catch(() => (timedOut = true));

      setTimeout(() => {
        expect(timedOut).toBe(true);
        done();
      }, BBUserSettings.GET_SETTINGS_TIMEOUT + 100);
    });

    it('should handle errors from the UI config service when retrieving settings', async () => {
      requestWithTokenSpy.and.callFake(() => Promise.reject());

      let errorOccurred = false;

      try {
        await BBUserSettings.getSettings();
      } catch (err) {
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
    });

    it('should handle errors from the UI config service when updating settings', async () => {
      requestWithTokenSpy.and.callFake(() => Promise.reject());

      let errorOccurred = false;

      try {
        await BBUserSettings.updateSettings('123', {
          omnibar: {
            vMin: true,
          },
        });
      } catch (err) {
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(true);
    });

    it('should update user settings by calling the web service after a delay', (done) => {
      const config: BBUserConfig = {
        omnibar: {
          vMin: true,
        },
      };

      requestWithTokenSpy.and.returnValue(Promise.resolve());

      // Each time updateSettings() is called, the previous request should be canceled.
      BBUserSettings.updateSettings('123', config);
      BBUserSettings.updateSettings('124', config);
      BBUserSettings.updateSettings('125', config);

      expect(requestWithTokenSpy).not.toHaveBeenCalled();

      setTimeout(() => {
        // Validate that previous calls were canceled.
        expect(requestWithTokenSpy).toHaveBeenCalledTimes(1);

        expect(requestWithTokenSpy).toHaveBeenCalledWith(
          'https://sky-pusa01.app.blackbaud.net/uicfg/settings/user',
          'abc',
          'PATCH',
          {
            correlationId: '125',
            settings: config,
          }
        );

        done();
      }, BBUserSettings.UPDATE_DELAY + 100);
    });
  });

  describe('when not logged in', () => {
    let getItemSpy: jasmine.Spy<typeof localStorage.getItem>;
    let setItemSpy: jasmine.Spy<typeof localStorage.setItem>;

    beforeEach(() => {
      spyOn(BBAuth, 'getToken').and.callFake(() => Promise.reject());

      getItemSpy = spyOn(localStorage, 'getItem');
      setItemSpy = spyOn(localStorage, 'setItem');
    });

    it('should get settings from local storage', async () => {
      const testSettings: BBUserConfig = {
        omnibar: {
          vMin: true,
        },
      };

      getItemSpy.and.returnValue(JSON.stringify(testSettings));

      const settings = await BBUserSettings.getSettings();

      expect(getItemSpy).toHaveBeenCalledWith(BBUserSettings.LOCAL_STORAGE_KEY);

      expect(settings).toEqual(testSettings);
    });

    it('should handle errors when retrieving from local storage', async () => {
      getItemSpy.and.throwError('Error');

      let rejected = false;

      try {
        await BBUserSettings.getSettings();
      } catch (err) {
        rejected = true;
      }

      expect(rejected).toBe(true);
    });

    it('should update settings to local storage', (done) => {
      getItemSpy.and.returnValue(undefined);

      const newSettings: BBUserConfig = {
        omnibar: {
          vMin: false,
        },
      };

      BBUserSettings.updateSettings('123', newSettings);

      setTimeout(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          BBUserSettings.LOCAL_STORAGE_KEY,
          JSON.stringify(newSettings)
        );

        done();
      }, BBUserSettings.UPDATE_DELAY + 100);
    });

    it('should patch existing settings in local storage by not overriting unspecified properties', (done) => {
      const existingSettings: BBUserConfig = {
        omnibar: {
          vMin: true,
        },
      };

      getItemSpy.and.returnValue(JSON.stringify(existingSettings));
      const newSettings: BBUserConfig = {
        omnibar: {},
      };

      BBUserSettings.updateSettings('123', newSettings);

      setTimeout(() => {
        expect(setItemSpy).toHaveBeenCalledWith(
          BBUserSettings.LOCAL_STORAGE_KEY,
          JSON.stringify(existingSettings)
        );

        done();
      }, BBUserSettings.UPDATE_DELAY + 100);
    });

    it('should handle errors when updating local storage', async () => {
      getItemSpy.and.returnValue(undefined);

      setItemSpy.and.throwError('Error');

      const newSettings: BBUserConfig = {
        omnibar: {
          vMin: false,
        },
      };

      let rejected = false;

      try {
        await BBUserSettings.updateSettings('123', newSettings);
      } catch (err) {
        rejected = true;
      }

      expect(rejected).toBe(true);
    });
  });
});
