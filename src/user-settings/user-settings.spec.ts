import {
  BBAuth
} from '../auth';

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBUserConfig
} from './user-config';

import {
  BBUserSettings
} from './user-settings';

describe('User settings', () => {
  let requestWithTokenSpy: jasmine.Spy;

  beforeEach(() => {
    requestWithTokenSpy = spyOn(BBCsrfXhr, 'requestWithToken');
  });

  describe('when logged in', () => {
    beforeEach(() => {
      spyOn(BBAuth, 'getToken')
        .and
        .returnValue(Promise.resolve('abc'));
    });

    it('should get user settings from the web service', async () => {
      const response = {
        settings: {
          omnibar: {
            vMin: true
          }
        }
      };

      requestWithTokenSpy.and.returnValue(Promise.resolve(response));

      const settings = await BBUserSettings.getSettings();

      expect(requestWithTokenSpy).toHaveBeenCalledWith(
        'https://sky-pusa01.app.blackbaud.net/uicfg/settings/user',
        'abc'
      );

      expect(settings).toEqual(response.settings);
    });

    it('should update user settings by calling the web service after a delay', (done) => {
      const config: BBUserConfig = {
        omnibar: {
          vMin: true
        }
      };

      requestWithTokenSpy.and.returnValue(Promise.resolve());

      // Each time updateSettings() is called, the previous request should be canceled.
      BBUserSettings.updateSettings(config);
      BBUserSettings.updateSettings(config);
      BBUserSettings.updateSettings(config);

      expect(requestWithTokenSpy).not.toHaveBeenCalled();

      setTimeout(() => {
        // Validate that previous calls were canceled.
        expect(requestWithTokenSpy).toHaveBeenCalledTimes(1);

        expect(requestWithTokenSpy).toHaveBeenCalledWith(
          'https://sky-pusa01.app.blackbaud.net/uicfg/settings/user',
          'abc',
          'PATCH',
          {
            settings: config
          }
        );

        done();
      }, BBUserSettings.UPDATE_DELAY + 100);
    });
  });

  describe('when not logged in', () => {
    let getItemSpy: jasmine.Spy;
    let setItemSpy: jasmine.Spy;

    beforeEach(() => {
      spyOn(BBAuth, 'getToken')
        .and
        .returnValue(Promise.reject());

      getItemSpy = spyOn(localStorage, 'getItem');
      setItemSpy = spyOn(localStorage, 'setItem');
    });

    it('should get settings from local storage', async () => {
      const testSettings: BBUserConfig = {
        omnibar: {
          vMin: true
        }
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
          vMin: false
        }
      };

      BBUserSettings.updateSettings(newSettings);

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
          vMin: true
        }
      };

      getItemSpy.and.returnValue(JSON.stringify(existingSettings));
      const newSettings: BBUserConfig = {
        omnibar: { }
      };

      BBUserSettings.updateSettings(newSettings);

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
          vMin: false
        }
      };

      let rejected = false;

      try {
        await BBUserSettings.updateSettings(newSettings);
      } catch (err) {
        rejected = true;
      }

      expect(rejected).toBe(true);
    });

  });

});
