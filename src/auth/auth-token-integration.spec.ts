//#region imports

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBAuthTokenIntegration
} from './auth-token-integration';

import {
  BBAuthCrossDomainIframe
} from './auth-cross-domain-iframe';

import 'jasmine-ajax';
import { BBAuthGetDomain } from './auth-get-domain';
//#endregion

describe('Auth token integration', () => {
  let requestSpy: jasmine.Spy;

  describe('when the location host name is blackbaud.com', () => {
    beforeEach(() => {
      requestSpy = spyOn(BBCsrfXhr, 'request');
      spyOn(BBAuthGetDomain, 'isRegisteredDomain')
      .and.returnValue(false);
      spyOn(BBAuthGetDomain, 'getSTSDomain')
        .and.returnValue('https://s21aidntoken00blkbapp01.nxt.blackbaud.com');
      spyOn(BBAuthTokenIntegration, 'getLocationHostname').and.returnValue('blackbaud.com');
    });

    it('should request a token without params', () => {
      BBAuthTokenIntegration.getToken();

      expect(requestSpy).toHaveBeenCalledWith(
        'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

    });

    it('should request a token with envId and permissionScope', () => {
      BBAuthTokenIntegration.getToken(true, 'abc', '123');

      expect(requestSpy).toHaveBeenCalledWith(
        'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token',
        undefined,
        true,
        'abc',
        '123',
        undefined,
        true
      );

    });

    it('should request a token with envId, permissionScope, and leId', () => {
      BBAuthTokenIntegration.getToken(true, 'abc', '123', 'xyz');

      expect(requestSpy).toHaveBeenCalledWith(
        'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token',
        undefined,
        true,
        'abc',
        '123',
        'xyz',
        true
      );
    });

  });

  describe('when the host name location is not blackbaud.com or a registered third party', () => {
    beforeEach(() => {
      requestSpy = spyOn(BBAuthCrossDomainIframe, 'getToken');
      spyOn(BBAuthGetDomain, 'isRegisteredDomain')
      .and.returnValue(false);
      spyOn(BBAuthTokenIntegration, 'getLocationHostname').and.returnValue('forgoodfund.com');
    });

    it('should create an iframe and then call getToken', () => {
      BBAuthTokenIntegration.getToken();

      expect(requestSpy).toHaveBeenCalledWith({
        disableRedirect: undefined,
        envId: undefined,
        leId: undefined,
        permissionScope: undefined
      });
    });
  });

  describe('when the location host name is a registered third party', () => {
    beforeEach(() => {
      requestSpy = spyOn(BBCsrfXhr, 'request');
      spyOn(BBAuthGetDomain, 'isRegisteredDomain')
      .and.returnValue(true);
      spyOn(BBAuthGetDomain, 'getSTSDomain')
        .and.returnValue('https://myRegisteredThirdPartySTS.com');
      spyOn(BBAuthTokenIntegration, 'getLocationHostname').and.returnValue('myRegisteredThirdParty.com');
    });

    it('should request a token without params', () => {
      BBAuthTokenIntegration.getToken();

      expect(requestSpy).toHaveBeenCalledWith(
        'https://myRegisteredThirdPartySTS.com/oauth2/token',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true
      );

    });

    it('should request a token with envId and permissionScope', () => {
      BBAuthTokenIntegration.getToken(true, 'abc', '123');

      expect(requestSpy).toHaveBeenCalledWith(
        'https://myRegisteredThirdPartySTS.com/oauth2/token',
        undefined,
        true,
        'abc',
        '123',
        undefined,
        true
      );

    });

    it('should request a token with envId, permissionScope, and leId', () => {
      BBAuthTokenIntegration.getToken(true, 'abc', '123', 'xyz');

      expect(requestSpy).toHaveBeenCalledWith(
        'https://myRegisteredThirdPartySTS.com/oauth2/token',
        undefined,
        true,
        'abc',
        '123',
        'xyz',
        true
      );
    });

  });

  describe('getLocationHostname', () => {
    it('should return window location hostname', () => {
      expect(BBAuthTokenIntegration.getLocationHostname()).toEqual(window.location.hostname);
    });
  });
});
