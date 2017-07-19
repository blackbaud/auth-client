import { BBCsrfXhr } from '../shared/csrf-xhr';
import { BBAuthTokenIntegration } from './auth-token-integration';

import 'jasmine-ajax';

describe('Auth token integration', () => {

  it('should request a token', () => {
    const requestSpy = spyOn(BBCsrfXhr, 'request');

    BBAuthTokenIntegration.getToken();

    expect(requestSpy).toHaveBeenCalledWith(
      'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token',
      undefined,
      undefined,
      undefined,
      undefined
    );

    requestSpy.calls.reset();

    BBAuthTokenIntegration.getToken(true, 'abc', '123');

    expect(requestSpy).toHaveBeenCalledWith(
      'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token',
      undefined,
      true,
      'abc',
      '123'
    );
  });

});
