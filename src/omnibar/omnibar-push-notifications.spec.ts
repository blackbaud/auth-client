//#region imports

import {
  BBAuth
} from '../auth';

import {
  BBOmnibarPushNotifications
} from './omnibar-push-notifications';

import {
  BBOmnibarScriptLoader
} from './omnibar-script-loader';

//#endregion

describe('Omnibar push notifications', () => {

  let addListenerSpy: jasmine.Spy;
  let cbSpy: jasmine.Spy;
  let destroySpy: jasmine.Spy;
  let initSpy: jasmine.Spy;
  let registerScriptSpy: jasmine.Spy;
  let updateNotificationsSpy: jasmine.Spy;

  function createNotificationsClient() {
    return (window as any).BBNotificationsClient = {
      BBNotifications: {
        addListener: addListenerSpy,
        destroy: destroySpy,
        init: initSpy,
        updateNotifications: updateNotificationsSpy
      }
    };
  }

  beforeEach(() => {
    registerScriptSpy = spyOn(BBOmnibarScriptLoader, 'registerScript');

    addListenerSpy = jasmine.createSpy('addListener');
    cbSpy = jasmine.createSpy('cb');
    initSpy = jasmine.createSpy('init');
    destroySpy = jasmine.createSpy('destroy');
    updateNotificationsSpy = jasmine.createSpy('updateNotifications');
  });

  afterEach(async () => {
    await BBOmnibarPushNotifications.disconnect();
    delete (window as any).BBNotificationsClient;
  });

  it('should add a listener to notifications client on init', async () => {
    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(
      'abc',
      '123',
      cbSpy
    );

    expect(registerScriptSpy).not.toHaveBeenCalled();

    expect(initSpy).toHaveBeenCalledWith({
      tokenCallback: jasmine.any(Function)
    });

    expect(addListenerSpy).toHaveBeenCalledWith(cbSpy);
  });

  it('should register notifications client if it is not present', () => {
    let registerResolve: any;

    registerScriptSpy.and.returnValue(new Promise((resolve) => registerResolve = resolve));

    BBOmnibarPushNotifications.connect(
      'abc',
      '123',
      cbSpy
    );

    createNotificationsClient();

    registerResolve();

    expect(registerScriptSpy).toHaveBeenCalledWith(BBOmnibarPushNotifications.NOTIFICATIONS_CLIENT_URL);
  });

  it('should not register notifications client again if previously connected', async () => {
    let registerResolve: any;

    registerScriptSpy.and.returnValue(new Promise((resolve) => registerResolve = resolve));

    BBOmnibarPushNotifications.connect(
      'abc',
      '123',
      cbSpy
    );

    createNotificationsClient();

    registerResolve();

    BBOmnibarPushNotifications.connect(
      'abc',
      '123',
      cbSpy
    );

    expect(registerScriptSpy).toHaveBeenCalledTimes(1);
  });

  it('should pass a function to get a token to notifications init', async () => {
    const getTokenSpy = spyOn(BBAuth, 'getToken');

    let tokenCallback: () => void;

    initSpy
      .and
      .callFake((args: { tokenCallback: typeof tokenCallback }) => tokenCallback = args.tokenCallback);

    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(
      'abc',
      '123',
      cbSpy
    );

    tokenCallback();

    expect(getTokenSpy).toHaveBeenCalled();
  });

  it('should pass updated notifications to notifications client', async () => {
    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(
      'abc',
      '123',
      cbSpy
    );

    const testNotifications = [
      {
        isRead: true,
        notificationId: '1'
      }
    ];

    BBOmnibarPushNotifications.updateNotifications(testNotifications);

    expect(updateNotificationsSpy).toHaveBeenCalledWith(testNotifications);
  });

  it('should destroy the notifications client on disconnect', async () => {
    createNotificationsClient();

    await BBOmnibarPushNotifications.connect(
      'abc',
      '123',
      cbSpy
    );

    await BBOmnibarPushNotifications.disconnect();

    expect(destroySpy).toHaveBeenCalled();
  });

});
