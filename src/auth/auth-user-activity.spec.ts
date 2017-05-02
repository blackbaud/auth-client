import { BBAuthUserActivity } from './auth-user-activity';

import { BBCsrfXhr } from '../shared/csrf-xhr';

const RENEW_URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew';

describe('User activity', () => {
  let requestSpy: jasmine.Spy;

  function moveMouse(clientX = 1, clientY = 1) {
    document.dispatchEvent(
      new MouseEvent(
        'mousemove',
        {
          clientX,
          clientY
        }
      )
    );
  }

  function pressKey() {
    document.dispatchEvent(new KeyboardEvent('keypress'));
  }

  beforeAll(() => {
    requestSpy = spyOn(BBCsrfXhr, 'request');
  });

  beforeEach(() => {
    requestSpy.calls.reset();
    BBAuthUserActivity.MIN_RENEWAL_AGE = 20;
    BBAuthUserActivity.ACTIVITY_TIMER_INTERVAL = 10;
  });

  afterEach(() => {
    BBAuthUserActivity.stopTracking();
  });

  it('should renew the user\'s session as soon as activity starts to be tracked', () => {
    BBAuthUserActivity.startTracking();

    expect(requestSpy).toHaveBeenCalledWith(RENEW_URL);
  });

  it('should renew the user\'s session when the user moves the mouse', (done) => {
    BBAuthUserActivity.startTracking();

    requestSpy.calls.reset();

    setTimeout(() => {
      moveMouse();

      expect(requestSpy).toHaveBeenCalledWith(RENEW_URL);

      done();
    }, 30);
  });

  it('should renew the user\'s session when the user presses a key', (done) => {
    BBAuthUserActivity.startTracking();

    requestSpy.calls.reset();

    setTimeout(() => {
      pressKey();

      expect(requestSpy).toHaveBeenCalledWith(RENEW_URL);

      done();
    }, 30);
  });

  it(
    'should not renew the user\'s session when the mouse move event has fired but the mouse did not actually move',
    (done) => {
      BBAuthUserActivity.startTracking();

      setTimeout(() => {
        moveMouse();

        requestSpy.calls.reset();

        moveMouse();

        setTimeout(() => {
          expect(requestSpy).not.toHaveBeenCalled();
          done();
        }, 30);
      }, 30);
    }
  );

  it(
    'should not renew the user\'s session during activity if the minimum renewal time has not yet been reached',
    (done) => {
      BBAuthUserActivity.MIN_RENEWAL_AGE = 2000;

      BBAuthUserActivity.startTracking();

      requestSpy.calls.reset();

      setTimeout(() => {
        moveMouse();

        expect(requestSpy).not.toHaveBeenCalled();

        done();
      }, 30);
    }
  );

  it(
    'should not start tracking again if tracking has already started',
    (done) => {
      BBAuthUserActivity.startTracking();
      BBAuthUserActivity.startTracking();

      requestSpy.calls.reset();

      setTimeout(() => {
        moveMouse();

        expect(requestSpy.calls.count()).toBe(1);

        done();
      }, 30);
    }
  );

  it('should stop tracking activity', (done) => {
    BBAuthUserActivity.startTracking();
    BBAuthUserActivity.stopTracking();

    requestSpy.calls.reset();

    setTimeout(() => {
      moveMouse();
      pressKey();

      expect(requestSpy).not.toHaveBeenCalled();

      done();
    }, 30);
  });

});
